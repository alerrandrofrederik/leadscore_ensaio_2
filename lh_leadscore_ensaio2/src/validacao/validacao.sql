-- Lead Score · validação dos critérios de aceite (CA-01 a CA-09)
-- Rode com:  py -I scripts/sql.py lh_leadscore_ensaio2/src/validacao/validacao.sql
WITH
gabarito AS (
  SELECT lead_id, intencao_esperada, pegadinha
  FROM read_files('/Volumes/lh_leadscore_ensaio2/landing/gabarito/intencao.csv',
                  format => 'csv', header => true, schemaHints => 'lead_id STRING, pegadinha STRING')
),
acerto AS (
  SELECT g.lead_id, g.pegadinha, ia.intencao = g.intencao_esperada AS ok
  FROM gabarito g JOIN lh_leadscore_ensaio2.gold.leads_ia ia ON ia.lead_id = g.lead_id
),
heroi AS (
  SELECT * FROM lh_leadscore_ensaio2.gold.leads_classificados WHERE lead_id = 'L20261122-0089'
),
fila AS (SELECT * FROM lh_leadscore_ensaio2.gold.fila_do_dia),
compras AS (
  SELECT lead_id FROM lh_leadscore_ensaio2.gold.leads_classificados
  WHERE intencao = 'compra_imediata'
    AND data_arquivo = (SELECT max(data_arquivo) FROM lh_leadscore_ensaio2.gold.leads_classificados)
),
checks AS (
  SELECT 1 AS n, 'CA-01 linhas na Bronze' AS checagem, '100' AS esperado,
         cast((SELECT count(*) FROM lh_leadscore_ensaio2.bronze.leads_raw) AS STRING) AS obtido
  UNION ALL SELECT 2, 'CA-02 datas malformadas em _rescued_data', '2',
         cast((SELECT count(*) FROM lh_leadscore_ensaio2.bronze.leads_raw WHERE _rescued_data IS NOT NULL) AS STRING)
  UNION ALL SELECT 3, 'CA-03 leads únicos na Silver', '96',
         cast((SELECT count(*) FROM lh_leadscore_ensaio2.silver.leads) AS STRING)
  UNION ALL SELECT 4, 'CA-03 e-mails duplicados na Silver', '0',
         cast((SELECT count(*) - count(DISTINCT email_norm) FROM lh_leadscore_ensaio2.silver.leads) AS STRING)
  UNION ALL SELECT 5, 'CA-03 CNPJs inválidos', '2',
         cast((SELECT count(*) FROM lh_leadscore_ensaio2.silver.leads WHERE cnpj_norm IS NOT NULL AND NOT cnpj_valido) AS STRING)
  UNION ALL SELECT 6, 'CA-04 reenvio que evolui: sobrevive', '0064',
         (SELECT right(max(lead_id), 4) FROM lh_leadscore_ensaio2.silver.leads WHERE lead_id = 'L20261122-0064')
  UNION ALL SELECT 7, 'CA-05 acurácia do ai_classify (%)', '>=85',
         cast((SELECT round(100 * avg(CASE WHEN ok THEN 1 ELSE 0 END), 1) FROM acerto) AS STRING)
  UNION ALL SELECT 8, 'CA-06 pegadinhas corretas (de 5)', '>=4',
         cast((SELECT count_if(ok) FROM acerto WHERE pegadinha IS NOT NULL) AS STRING)
  UNION ALL SELECT 9, 'CA-07 entidades do herói', 'Atlas Gestão|200|dezembro|true|Diretor Financeiro|OmniERP',
         (SELECT concat_ws('|', produto, cast(qtd_licencas AS STRING), lower(prazo), cast(orcamento_aprovado AS STRING), cargo, concorrente_citado) FROM heroi)
  UNION ALL SELECT 10, 'CA-08 spam/suporte na fila', '0',
         cast((SELECT count(*) FROM fila WHERE intencao IN ('spam', 'suporte')) AS STRING)
  UNION ALL SELECT 11, 'CA-09 herói na posição', '1',
         cast((SELECT posicao FROM fila WHERE lead_id = 'L20261122-0089') AS STRING)
  UNION ALL SELECT 12, 'CA-09 leads na fila', '20',
         cast((SELECT count(*) FROM fila) AS STRING)
  UNION ALL SELECT 13, 'CA-09 leads por vendedor', '5 cada',
         (SELECT CASE WHEN min(c) = 5 AND max(c) = 5 AND count(*) = 4 THEN '5 cada' ELSE concat(min(c), '-', max(c)) END
          FROM (SELECT vendedor, count(*) AS c FROM fila GROUP BY vendedor))
  UNION ALL SELECT 14, 'CA-09 fila com os 4 componentes', '20',
         cast((SELECT count(*) FROM fila WHERE score_componentes.intencao IS NOT NULL AND score_componentes.perfil IS NOT NULL
                 AND score_componentes.sinais IS NOT NULL AND score_componentes.recencia IS NOT NULL) AS STRING)
  UNION ALL SELECT 15, 'Compra imediata hoje', '26',
         cast((SELECT count(*) FROM compras) AS STRING)
  UNION ALL SELECT 16, 'Compra imediata fora da fila', '6',
         cast((SELECT count(*) FROM compras c LEFT ANTI JOIN fila f ON f.lead_id = c.lead_id) AS STRING)
)
SELECT
  n, checagem, esperado, obtido,
  CASE
    WHEN esperado LIKE '>=%' THEN IF(try_cast(obtido AS DOUBLE) >= try_cast(substr(esperado, 3) AS DOUBLE), '✅', '❌')
    WHEN obtido = esperado THEN '✅'
    ELSE '❌'
  END AS status
FROM checks
ORDER BY n
