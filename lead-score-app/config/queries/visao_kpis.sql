-- KPIs da Visão do Gestor (RF-15). :v só força nova leitura depois de marcar um contato.
-- @param v STRING = 0
WITH dia AS (
  SELECT max(data_arquivo) AS data_ref FROM lh_leadscore_ensaio2.gold.leads_classificados
),
recebidos AS (
  SELECT count(*) AS recebidos
  FROM lh_leadscore_ensaio2.bronze.leads_raw, dia
  WHERE _arquivo LIKE concat('%', CAST(dia.data_ref AS STRING), '%')
),
lc AS (
  SELECT c.*
  FROM lh_leadscore_ensaio2.gold.leads_classificados c, dia
  WHERE c.data_arquivo = dia.data_ref
),
fila AS (
  SELECT f.lead_id FROM lh_leadscore_ensaio2.gold.fila_do_dia f, dia WHERE f.data = dia.data_ref
),
contatos AS (
  SELECT DISTINCT fb.lead_id FROM lh_leadscore_ensaio2.gold.feedback_contatos fb JOIN fila USING (lead_id)
)
SELECT
  CAST(dia.data_ref AS STRING)                                                AS data_ref,
  r.recebidos,
  (SELECT count(*) FROM lc)                                                   AS unicos,
  (SELECT count_if(intencao IS NOT NULL) FROM lc)                             AS classificados,
  (SELECT count(*) FROM fila)                                                 AS na_fila,
  (SELECT count(*) FROM contatos)                                             AS contatados,
  (SELECT count_if(intencao = 'compra_imediata') FROM lc)                     AS compra_imediata,
  (SELECT count(*) FROM lc LEFT ANTI JOIN fila USING (lead_id) WHERE lc.intencao = 'compra_imediata') AS compra_fora_da_fila,
  (SELECT date_format(max(processado_em), 'dd/MM HH:mm') FROM lc)             AS processado_em,
  :v                                                                          AS versao
FROM dia, recebidos r;
