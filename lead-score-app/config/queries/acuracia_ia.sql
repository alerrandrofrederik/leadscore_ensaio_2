-- Acurácia do ai_classify contra o gabarito (métrica de IA, PRD 1.9 · CA-05)
SELECT
  round(100 * avg(CASE WHEN c.intencao = g.intencao_esperada THEN 1 ELSE 0 END), 0) AS acuracia_pct,
  count(*)                                                                            AS avaliados
FROM lh_leadscore_ensaio2.gold.leads_classificados c
JOIN read_files(
  '/Volumes/lh_leadscore_ensaio2/landing/gabarito/intencao.csv',
  format => 'csv', header => true
) g USING (lead_id);
