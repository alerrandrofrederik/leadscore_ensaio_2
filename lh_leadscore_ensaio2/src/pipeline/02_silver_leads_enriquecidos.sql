-- Silver · lead + empresa + histórico (RF-05)
CREATE OR REFRESH MATERIALIZED VIEW silver.leads_enriquecidos
COMMENT 'Lead único unido ao cadastro da empresa e ao histórico comercial'
AS
SELECT
  l.*,
  e.razao_social                       AS empresa,
  coalesce(e.porte, 'desconhecido')    AS porte,
  e.segmento,
  e.num_funcionarios,
  e.uf,
  coalesce(h.ja_cliente, false)        AS ja_cliente,
  coalesce(h.oportunidades_ganhas, 0)  AS oportunidades_ganhas,
  coalesce(h.produtos_ganhos, array()) AS produtos_ganhos
FROM silver.leads l
LEFT JOIN silver.empresas e          ON l.cnpj_valido AND l.cnpj_norm = e.cnpj_norm
LEFT JOIN silver.historico_empresa h ON l.cnpj_valido AND l.cnpj_norm = h.cnpj_norm;
