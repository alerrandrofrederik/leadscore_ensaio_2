-- Intenção por canal (leads únicos do dia), para barras empilhadas
SELECT
  canal,
  count_if(intencao = 'compra_imediata') AS compra_imediata,
  count_if(intencao = 'avaliando') AS avaliando,
  count_if(intencao = 'suporte') AS suporte,
  count_if(intencao = 'spam') AS spam
FROM lh_leadscore_ensaio2.gold.leads_classificados
WHERE data_arquivo = (SELECT max(data_arquivo) FROM lh_leadscore_ensaio2.gold.leads_classificados)
GROUP BY canal
ORDER BY compra_imediata DESC, canal
