-- Funil do dia: recebidos → únicos → com intenção comercial → na fila → contatados (RF-15)
-- @param v STRING = 0
WITH dia AS (
  SELECT max(data_arquivo) AS data_ref FROM lh_leadscore_ensaio2.gold.leads_classificados
),
lc AS (
  SELECT c.* FROM lh_leadscore_ensaio2.gold.leads_classificados c, dia WHERE c.data_arquivo = dia.data_ref
),
fila AS (
  SELECT f.lead_id FROM lh_leadscore_ensaio2.gold.fila_do_dia f, dia WHERE f.data = dia.data_ref
)
SELECT etapa, leads, ordem FROM (
  SELECT 'Recebidos' AS etapa, count(*) AS leads, 1 AS ordem
  FROM lh_leadscore_ensaio2.bronze.leads_raw, dia WHERE _arquivo LIKE concat('%', CAST(dia.data_ref AS STRING), '%')
  UNION ALL SELECT 'Únicos', count(*), 2 FROM lc
  UNION ALL SELECT 'Comercial', count_if(elegivel_fila), 3 FROM lc
  UNION ALL SELECT 'Na fila', count(*), 4 FROM fila
  UNION ALL SELECT 'Contatados', count(DISTINCT fb.lead_id), 5
  FROM lh_leadscore_ensaio2.gold.feedback_contatos fb JOIN fila USING (lead_id)
  WHERE :v IS NOT NULL
)
ORDER BY ordem DESC;
