-- Intenção por canal no dia (pergunta do marketing, US-05 · RF-15)
WITH dia AS (
  SELECT max(data_arquivo) AS data_ref FROM lh_leadscore_ensaio2.gold.leads_classificados
)
SELECT
  CASE c.canal
    WHEN 'indicacao'  THEN 'Indicação'
    WHEN 'linkedin'   THEN 'LinkedIn'
    WHEN 'evento'     THEN 'Evento'
    WHEN 'google_ads' THEN 'Google Ads'
    WHEN 'site'       THEN 'Site'
    ELSE c.canal
  END                                         AS canal,
  count_if(c.intencao = 'compra_imediata')    AS compra_imediata,
  count_if(c.intencao = 'avaliando')          AS avaliando,
  count_if(c.intencao = 'suporte')            AS suporte,
  count_if(c.intencao = 'spam')               AS spam
FROM lh_leadscore_ensaio2.gold.leads_classificados c, dia
WHERE c.data_arquivo = dia.data_ref
GROUP BY 1
ORDER BY compra_imediata ASC, canal;
