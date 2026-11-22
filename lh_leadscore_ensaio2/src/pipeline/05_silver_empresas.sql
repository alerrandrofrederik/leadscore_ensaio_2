-- Silver · empresas com CNPJ normalizado (1 linha por CNPJ)
CREATE OR REFRESH MATERIALIZED VIEW silver.empresas (
  CONSTRAINT cnpj_14_digitos EXPECT (length(cnpj_norm) = 14)
)
COMMENT 'Cadastro de empresas limpo, chave cnpj_norm'
AS SELECT cnpj_norm, razao_social, porte, segmento, num_funcionarios, uf
FROM (
  SELECT *,
    regexp_replace(cnpj, '[^0-9]', '') AS cnpj_norm,
    row_number() OVER (PARTITION BY regexp_replace(cnpj, '[^0-9]', '') ORDER BY _ingerido_em DESC) AS rn
  FROM bronze.empresas_raw
)
WHERE rn = 1;
