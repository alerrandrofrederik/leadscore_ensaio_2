-- @param v STRING = 0
-- Funil do dia: recebidos → classificados → na fila → contatados
WITH dia AS (SELECT max(data_arquivo) AS d FROM lh_leadscore_ensaio2.gold.leads_classificados),
contatos AS (SELECT DISTINCT lead_id FROM lh_leadscore_ensaio2.gold.feedback_contatos)
SELECT etapa, leads FROM (
  SELECT 1 AS ordem, 'Recebidos' AS etapa, (SELECT count(*) FROM lh_leadscore_ensaio2.bronze.leads_raw) AS leads
  UNION ALL SELECT 2, 'Únicos classificados',
    (SELECT count(*) FROM lh_leadscore_ensaio2.gold.leads_classificados c JOIN dia ON c.data_arquivo = dia.d)
  UNION ALL SELECT 3, 'Elegíveis (compra + avaliando)',
    (SELECT count(*) FROM lh_leadscore_ensaio2.gold.leads_classificados c JOIN dia ON c.data_arquivo = dia.d WHERE c.elegivel_fila)
  UNION ALL SELECT 4, 'Na fila', (SELECT count(*) FROM lh_leadscore_ensaio2.gold.fila_do_dia)
  UNION ALL SELECT 5, 'Contatados',
    (SELECT count(*) FROM lh_leadscore_ensaio2.gold.fila_do_dia f JOIN contatos c ON c.lead_id = f.lead_id)
)
WHERE :v IS NOT NULL
ORDER BY ordem
