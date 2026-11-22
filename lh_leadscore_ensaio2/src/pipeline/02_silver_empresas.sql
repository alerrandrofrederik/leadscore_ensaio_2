-- Silver · empresas com CNPJ normalizado (RF-03)
CREATE OR REFRESH MATERIALIZED VIEW silver.empresas (
  CONSTRAINT cnpj_14_digitos EXPECT (length(cnpj_norm) = 14)
)
COMMENT 'Base cadastral normalizada: 1 linha por CNPJ'
AS
SELECT * EXCEPT (_rn)
FROM (
  SELECT
    regexp_replace(cnpj, '[^0-9]', '') AS cnpj_norm,
    trim(razao_social)                 AS razao_social,
    CASE lower(trim(porte))
      WHEN 'grande'  THEN 'grande'
      WHEN 'médio'   THEN 'médio'
      WHEN 'medio'   THEN 'médio'
      WHEN 'pequeno' THEN 'pequeno'
      ELSE 'desconhecido'
    END                                AS porte,
    trim(segmento)                     AS segmento,
    num_funcionarios,
    upper(trim(uf))                    AS uf,
    row_number() OVER (PARTITION BY regexp_replace(cnpj, '[^0-9]', '') ORDER BY _ingerido_em DESC) AS _rn
  FROM bronze.empresas_raw
)
WHERE _rn = 1;
