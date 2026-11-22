-- Silver · histórico comercial agregado por empresa (RF-05)
CREATE OR REFRESH MATERIALIZED VIEW silver.historico_empresa
COMMENT 'Oportunidades por empresa: ganhas, perdidas, abertas e produtos já comprados'
AS SELECT
  regexp_replace(cnpj, '[^0-9]', '') AS cnpj_norm,
  count(*) AS oportunidades,
  count_if(status = 'ganha') AS oportunidades_ganhas,
  count_if(status = 'perdida') AS oportunidades_perdidas,
  count_if(status = 'aberta') AS oportunidades_abertas,
  sum(CASE WHEN status = 'ganha' THEN valor ELSE 0 END) AS valor_ganho,
  array_sort(collect_set(CASE WHEN status = 'ganha' THEN produto END)) AS produtos_ganhos,
  count_if(status = 'ganha') > 0 AS ja_cliente
FROM bronze.oportunidades_raw
GROUP BY 1;
