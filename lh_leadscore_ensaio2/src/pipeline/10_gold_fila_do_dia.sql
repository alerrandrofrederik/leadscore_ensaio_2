-- Gold · Fila do Dia: os 20 melhores do dia, 5 por vendedor (RF-11)
-- Dia = max(data_arquivo). Nunca spam/suporte (CA-08). Vendedor em round-robin pela posição.
CREATE OR REFRESH MATERIALIZED VIEW gold.fila_do_dia (
  CONSTRAINT posicao_1_a_20 EXPECT (posicao BETWEEN 1 AND 20),
  CONSTRAINT sem_spam_suporte EXPECT (intencao IN ('compra_imediata', 'avaliando'))
)
COMMENT 'Fila do dia: 20 leads de maior score distribuídos entre os 4 vendedores (5 cada)'
AS
WITH dia AS (
  SELECT max(data_arquivo) AS data_fila FROM gold.leads_classificados
),
ranqueado AS (
  SELECT
    d.data_fila,
    row_number() OVER (
      ORDER BY c.lead_score DESC, c.sinais DESC, c.perfil DESC,
               c.qtd_licencas DESC NULLS LAST, c.recebido_em ASC, c.lead_id
    ) AS posicao,
    c.*
  FROM gold.leads_classificados c
  JOIN dia d ON c.data_arquivo = d.data_fila
  WHERE c.elegivel_fila
)
SELECT
  data_fila AS data,
  posicao,
  element_at(array('Ana Ribeiro', 'Bruno Carvalho', 'Carla Mendes', 'Diego Rocha'),
             cast((posicao - 1) % 4 + 1 AS INT)) AS vendedor,
  * EXCEPT (data_fila, posicao)
FROM ranqueado
WHERE posicao <= 20;
