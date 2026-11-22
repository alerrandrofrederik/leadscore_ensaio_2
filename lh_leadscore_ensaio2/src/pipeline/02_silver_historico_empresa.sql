-- Silver · histórico comercial agregado por empresa (RF-05)
CREATE OR REFRESH MATERIALIZED VIEW silver.historico_empresa
COMMENT 'Oportunidades por CNPJ: ganhas, perdidas, abertas, produtos já comprados e flag ja_cliente'
AS
SELECT
  regexp_replace(cnpj, '[^0-9]', '')                                  AS cnpj_norm,
  count(*)                                                            AS oportunidades,
  count_if(lower(status) = 'ganha')                                   AS oportunidades_ganhas,
  count_if(lower(status) = 'perdida')                                 AS oportunidades_perdidas,
  count_if(lower(status) = 'aberta')                                  AS oportunidades_abertas,
  coalesce(sum(CASE WHEN lower(status) = 'ganha' THEN valor END), 0)  AS valor_ganho,
  array_sort(collect_set(CASE WHEN lower(status) = 'ganha' THEN produto END)) AS produtos_ganhos,
  count_if(lower(status) = 'ganha') > 0                               AS ja_cliente
FROM bronze.oportunidades_raw
GROUP BY 1;
