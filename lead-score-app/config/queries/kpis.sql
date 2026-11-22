-- @param v STRING = 0
-- KPIs do dia para a Visão do Gestor (v = cache-buster trocado após cada contato)
WITH dia AS (SELECT max(data_arquivo) AS d FROM lh_leadscore_ensaio2.gold.leads_classificados),
lc AS (
  SELECT c.* FROM lh_leadscore_ensaio2.gold.leads_classificados c JOIN dia ON c.data_arquivo = dia.d
),
fila AS (SELECT * FROM lh_leadscore_ensaio2.gold.fila_do_dia),
contatos AS (SELECT DISTINCT lead_id FROM lh_leadscore_ensaio2.gold.feedback_contatos),
gabarito AS (
  SELECT lead_id, intencao_esperada
  FROM read_files('/Volumes/lh_leadscore_ensaio2/landing/gabarito/intencao.csv', format => 'csv', header => true)
)
SELECT
  cast((SELECT d FROM dia) AS STRING) AS data_fila,
  (SELECT count(*) FROM lh_leadscore_ensaio2.bronze.leads_raw) AS recebidos,
  (SELECT count(*) FROM lc) AS unicos,
  (SELECT count(*) FROM lc WHERE intencao IS NOT NULL) AS classificados,
  (SELECT count(*) FROM fila) AS na_fila,
  (SELECT count(*) FROM fila f JOIN contatos c ON c.lead_id = f.lead_id) AS contatados,
  (SELECT count(*) FROM lc WHERE intencao = 'compra_imediata') AS compra_imediata,
  (SELECT count(*) FROM lc LEFT ANTI JOIN fila f ON f.lead_id = lc.lead_id WHERE lc.intencao = 'compra_imediata') AS compra_fora_fila,
  (SELECT round(100 * avg(CASE WHEN ia.intencao = g.intencao_esperada THEN 1 ELSE 0 END), 0)
     FROM gabarito g JOIN lh_leadscore_ensaio2.gold.leads_ia ia ON ia.lead_id = g.lead_id) AS acuracia_ia,
  :v AS versao
