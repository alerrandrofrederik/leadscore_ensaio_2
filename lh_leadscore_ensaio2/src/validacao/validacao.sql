-- Validação dos critérios de aceite (PRD · 3.1). Uma linha por critério: obtido x esperado.
USE CATALOG lh_leadscore_ensaio2;

WITH gab AS (
  SELECT * FROM read_files('/Volumes/lh_leadscore_ensaio2/landing/gabarito/intencao.csv', format => 'csv', header => true)
),
ent AS (
  SELECT * FROM read_files('/Volumes/lh_leadscore_ensaio2/landing/gabarito/entidades.csv', format => 'csv', header => true,
                           schemaHints => 'qtd_licencas INT, orcamento_aprovado BOOLEAN')
),
acuracia AS (
  SELECT
    round(100 * avg(CASE WHEN c.intencao = g.intencao_esperada THEN 1 ELSE 0 END), 1) AS pct,
    count_if(g.pegadinha IS NOT NULL AND c.intencao = g.intencao_esperada)              AS pegadinhas_ok,
    count_if(g.pegadinha IS NOT NULL)                                                   AS pegadinhas
  FROM gold.leads_classificados c
  JOIN gab g USING (lead_id)
),
heroi AS (
  SELECT * FROM gold.leads_classificados WHERE lead_id = 'L20261122-0089'
)
SELECT 'CA-01' AS ca, 'Linhas na Bronze' AS criterio, CAST(count(*) AS STRING) AS obtido, '100' AS esperado FROM bronze.leads_raw
UNION ALL SELECT 'CA-02', 'Datas em _rescued_data', CAST(count_if(_rescued_data IS NOT NULL) AS STRING), '2' FROM bronze.leads_raw
UNION ALL SELECT 'CA-03', 'Leads únicos na Silver', CAST(count(*) AS STRING), '96' FROM silver.leads
UNION ALL SELECT 'CA-03', 'E-mails duplicados na Silver', CAST(count(*) - count(DISTINCT email_norm) AS STRING), '0' FROM silver.leads
UNION ALL SELECT 'CA-03', 'CNPJs inválidos', CAST(count_if(cnpj_norm IS NOT NULL AND NOT cnpj_valido) AS STRING), '2' FROM silver.leads
UNION ALL SELECT 'CA-04', 'Reenvio que evolui mantém L20261122-0064', CAST(count_if(lead_id = 'L20261122-0064') AS STRING), '1' FROM silver.leads
UNION ALL SELECT 'CA-05', 'Acurácia ai_classify (%)', CAST(pct AS STRING), '>= 85' FROM acuracia
UNION ALL SELECT 'CA-06', 'Pegadinhas corretas', concat(pegadinhas_ok, ' de ', pegadinhas), '>= 4 de 5' FROM acuracia
UNION ALL SELECT 'CA-07', 'Entidades da mensagem herói',
  concat_ws(' | ', produto, CAST(qtd_licencas AS STRING), prazo, CAST(orcamento_aprovado AS STRING), cargo, concorrente_citado),
  'Atlas Gestão | 200 | dezembro | true | Diretor Financeiro | OmniERP' FROM heroi
UNION ALL SELECT 'CA-08', 'spam/suporte na fila', CAST(count_if(intencao NOT IN ('compra_imediata', 'avaliando')) AS STRING), '0' FROM gold.fila_do_dia
UNION ALL SELECT 'CA-09', 'Leads na fila', CAST(count(*) AS STRING), '20' FROM gold.fila_do_dia
UNION ALL SELECT 'CA-09', 'Leads por vendedor', concat_ws(', ', collect_list(v)), '5 cada'
  FROM (SELECT concat(vendedor, '=', count(*)) AS v FROM gold.fila_do_dia GROUP BY vendedor)
UNION ALL SELECT 'CA-09', 'Posição do lead herói', CAST(max(posicao) AS STRING), '1' FROM gold.fila_do_dia WHERE lead_id = 'L20261122-0089'
UNION ALL SELECT 'Roteiro', 'Compra imediata hoje', CAST(count_if(intencao = 'compra_imediata') AS STRING), '26' FROM gold.leads_classificados
UNION ALL SELECT 'Roteiro', 'Compra imediata fora da fila',
  CAST(count(*) AS STRING), '6'
  FROM gold.leads_classificados c LEFT ANTI JOIN gold.fila_do_dia f USING (lead_id)
  WHERE c.intencao = 'compra_imediata'
UNION ALL SELECT 'CA-12', 'Linhas processadas pela IA (gold.leads_ia)', CAST(count(*) AS STRING), '100 (não cresce sem arquivo novo)' FROM gold.leads_ia;
