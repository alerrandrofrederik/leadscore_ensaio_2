-- Gold · Fila do Dia: os 20 leads de maior score do dia, 5 por vendedor (RF-11)
-- Travas: spam e suporte nunca entram (CA-08).
CREATE OR REFRESH MATERIALIZED VIEW gold.fila_do_dia (
  CONSTRAINT sem_spam_nem_suporte EXPECT (intencao IN ('compra_imediata', 'avaliando')) ON VIOLATION FAIL UPDATE
)
COMMENT 'Os 20 leads do dia, ordenados por Lead Score e distribuídos entre os 4 vendedores (5 cada)'
AS
WITH do_dia AS (
  SELECT *
  FROM gold.leads_classificados
  WHERE elegivel_fila
    AND data_arquivo = (SELECT max(data_arquivo) FROM gold.leads_classificados)
),
ordenado AS (
  SELECT
    *,
    row_number() OVER (
      ORDER BY lead_score DESC,
               score_componentes.sinais DESC,
               score_componentes.perfil DESC,
               qtd_licencas DESC NULLS LAST,
               recebido_em ASC NULLS LAST,
               lead_id
    ) AS posicao
  FROM do_dia
)
SELECT
  data_arquivo AS data,
  CAST(posicao AS INT) AS posicao,
  element_at(array('Ana Ribeiro', 'Bruno Carvalho', 'Carla Mendes', 'Diego Rocha'), CAST(pmod(posicao - 1, 4) + 1 AS INT)) AS vendedor,
  * EXCEPT (posicao, data_arquivo, elegivel_fila)
FROM ordenado
WHERE posicao <= 20;
