-- Gold · IA sobre a mensagem do lead (RF-07, RF-08)
-- STREAMING TABLE de propósito: a IA roda só nas linhas novas da Bronze (incremental).
-- Uma segunda execução sem arquivos novos faz 0 chamadas de IA (CA-12).
-- Salvaguardas: mensagem com menos de 5 caracteres vira spam sem chamar a IA;
-- ai_extract só roda para quem tem intenção comercial.
CREATE OR REFRESH STREAMING TABLE gold.leads_ia
COMMENT 'Saída do ai_classify (intenção) e do ai_extract (entidades) por linha de lead, com versão para auditoria'
AS
WITH classificado AS (
  SELECT
    lead_id,
    mensagem,
    CASE
      WHEN length(trim(coalesce(mensagem, ''))) < 5 THEN NULL
      ELSE ai_classify(
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
),
com_intencao AS (
  SELECT
    *,
    coalesce(intencao_raw:response[0].value::string, 'spam') AS intencao,
    intencao_raw IS NOT NULL AS chamou_ia
  FROM classificado
),
extraido AS (
  SELECT
    *,
    CASE
      WHEN intencao IN ('compra_imediata', 'avaliando') THEN ai_extract(
        mensagem,
        '{
          "produto":            {"type": "string",  "description": "Produto Atlas citado (Atlas Gestão, Atlas BI, Atlas Fiscal, Atlas CRM ou Atlas Estoque)"},
          "qtd_licencas":       {"type": "integer", "description": "Quantidade de licenças ou usuários"},
          "prazo":              {"type": "string",  "description": "Prazo ou data desejada, só o mês ou a data, sem preposição (ex.: dezembro)"},
          "orcamento_aprovado": {"type": "boolean", "description": "Mencionou orçamento aprovado"},
          "cargo":              {"type": "string",  "description": "Cargo de quem escreveu"},
          "concorrente_citado": {"type": "string",  "description": "Sistema concorrente de outra empresa que o lead usa ou avalia (nunca um produto Atlas)"}
        }',
        map('version', '2.1')
      )
    END AS entidades_raw
  FROM com_intencao
)
SELECT
  lead_id,
  intencao,
  entidades_raw:response.produto.value::string             AS produto,
  entidades_raw:response.qtd_licencas.value::int           AS qtd_licencas,
  entidades_raw:response.prazo.value::string               AS prazo,
  entidades_raw:response.orcamento_aprovado.value::boolean AS orcamento_aprovado,
  entidades_raw:response.cargo.value::string               AS cargo,
  entidades_raw:response.concorrente_citado.value::string  AS concorrente_citado,
  chamou_ia,
  '2.1'                                                    AS ia_versao,
  intencao_raw,
  entidades_raw,
  current_timestamp()                                      AS processado_em
FROM extraido;
