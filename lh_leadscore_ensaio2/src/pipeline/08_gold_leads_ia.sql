-- Gold · IA sobre a mensagem (RF-07, RF-08)
-- STREAMING TABLE: só linhas novas da Bronze chamam a IA (CA-12: 2ª execução sem arquivo novo = 0 chamadas)
-- Mensagem com menos de 5 caracteres vira spam sem chamar a IA; ai_extract só para compra/avaliando.
CREATE OR REFRESH STREAMING TABLE gold.leads_ia
COMMENT 'Intenção (ai_classify) e entidades (ai_extract) de cada lead recebido, versão 2.1'
AS SELECT
  lead_id,
  mensagem,
  intencao,
  intencao_raw,
  CASE WHEN intencao IN ('compra_imediata', 'avaliando') THEN
    ai_extract(
      mensagem,
      '{
        "produto":            {"type": "string",  "description": "Produto Atlas citado"},
        "qtd_licencas":       {"type": "integer", "description": "Quantidade de licenças ou usuários"},
        "prazo":              {"type": "string",  "description": "Prazo ou data desejada, só o mês ou a data, sem preposição (ex.: dezembro)"},
        "orcamento_aprovado": {"type": "boolean", "description": "Mencionou orçamento aprovado"},
        "cargo":              {"type": "string",  "description": "Cargo de quem escreveu"},
        "concorrente_citado": {"type": "string",  "description": "Sistema concorrente de outra empresa que o lead usa ou avalia (nunca um produto Atlas)"}
      }',
      map('version', '2.1')
    )
  END AS entidades_raw,
  ia_chamada,
  '2.1' AS ai_versao,
  current_timestamp() AS processado_em
FROM (
  SELECT *,
    CASE WHEN ia_chamada THEN intencao_raw:response[0].value::string ELSE 'spam' END AS intencao
  FROM (
    SELECT
      lead_id,
      mensagem,
      length(trim(coalesce(mensagem, ''))) >= 5 AS ia_chamada,
      CASE WHEN length(trim(coalesce(mensagem, ''))) >= 5 THEN
        ai_classify(
          mensagem,
          '{
            "compra_imediata": "Quer comprar produtos da Atlas Software: pede preço, proposta, quantidade de licenças, prazo ou reunião comercial",
            "avaliando":       "Quer conhecer os produtos da Atlas, comparar opções ou ver uma demonstração, sem urgência",
            "suporte":         "Já é cliente da Atlas e relata problema, dúvida de uso ou pede ajuda técnica",
            "spam":            "Sem relação com comprar da Atlas: oferta ou propaganda de terceiros (SEO, empréstimo, marketing), teste ou texto sem sentido, mesmo que use palavras como urgente, proposta ou preço"
          }',
          map('version', '2.1')
        )
      END AS intencao_raw
    FROM STREAM(bronze.leads_raw)
  )
);
