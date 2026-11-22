-- Gold · todos os leads com intenção, entidades e Lead Score explicável (RF-09, RF-10, RF-12)
-- lead_score = 0,50 × intenção + 0,25 × perfil + 0,15 × sinais + 0,10 × recência
CREATE OR REFRESH MATERIALIZED VIEW gold.leads_classificados (
  CONSTRAINT score_0_a_100 EXPECT (lead_score BETWEEN 0 AND 100),
  CONSTRAINT intencao_classificada EXPECT (intencao IN ('compra_imediata', 'avaliando', 'suporte', 'spam'))
)
COMMENT 'Todos os leads únicos classificados, com score, componentes, motivo e próximo passo'
AS
WITH base AS (
  SELECT
    s.*,
    ia.intencao,
    ia.entidades_raw:response.produto.value::string             AS produto,
    ia.entidades_raw:response.qtd_licencas.value::int           AS qtd_licencas,
    nullif(trim(ia.entidades_raw:response.prazo.value::string), '') AS prazo,
    coalesce(ia.entidades_raw:response.orcamento_aprovado.value::boolean, false) AS orcamento_aprovado,
    ia.entidades_raw:response.cargo.value::string               AS cargo,
    ia.entidades_raw:response.concorrente_citado.value::string  AS concorrente_citado,
    ia.ai_versao,
    ia.processado_em
  FROM silver.leads_enriquecidos s
  JOIN gold.leads_ia ia ON ia.lead_id = s.lead_id
),
componentes AS (
  SELECT *,
    CASE intencao WHEN 'compra_imediata' THEN 100 WHEN 'avaliando' THEN 40 ELSE 0 END AS c_intencao,
    least(100,
      CASE porte WHEN 'grande' THEN 100 WHEN 'médio' THEN 60 WHEN 'pequeno' THEN 30 ELSE 20 END
      + CASE WHEN ja_cliente THEN 20 ELSE 0 END) AS c_perfil,
    least(100,
      CASE WHEN orcamento_aprovado THEN 40 ELSE 0 END
      + CASE WHEN prazo IS NOT NULL THEN 30 ELSE 0 END
      + CASE WHEN qtd_licencas IS NOT NULL THEN 30 ELSE 0 END) AS c_sinais,
    CASE datediff(data_arquivo, coalesce(to_date(recebido_em), data_arquivo))
      WHEN 0 THEN 100 WHEN 1 THEN 50 WHEN 2 THEN 25 ELSE 0 END AS c_recencia
  FROM base
)
SELECT
  lead_id, nome, email, telefone, empresa, cnpj_norm AS cnpj, cnpj_valido, canal, campanha,
  porte, segmento, uf, ja_cliente, oportunidades_ganhas, produtos_ganhos,
  mensagem, intencao,
  produto, qtd_licencas, prazo, orcamento_aprovado, cargo, concorrente_citado,
  CASE WHEN intencao = 'spam' THEN 0
       ELSE cast(round(0.50 * c_intencao + 0.25 * c_perfil + 0.15 * c_sinais + 0.10 * c_recencia) AS INT)
  END AS lead_score,
  named_struct('intencao', c_intencao, 'perfil', c_perfil, 'sinais', c_sinais, 'recencia', c_recencia) AS score_componentes,
  c_sinais AS sinais,
  c_perfil AS perfil,
  concat_ws(' · ',
    CASE intencao
      WHEN 'compra_imediata' THEN concat('Pediu ',
        coalesce(concat(qtd_licencas, ' licenças'), 'proposta'),
        coalesce(concat(' do ', produto), ''),
        coalesce(concat(' até ', prazo), ''))
      WHEN 'avaliando' THEN concat('Quer conhecer ', coalesce(produto, 'as soluções Atlas'))
      WHEN 'suporte' THEN 'Pedido de suporte de cliente'
      ELSE 'Mensagem sem intenção de compra'
    END,
    CASE WHEN orcamento_aprovado THEN 'orçamento aprovado' END,
    cargo,
    CASE WHEN concorrente_citado IS NOT NULL THEN concat('usa ', concorrente_citado) END,
    CASE WHEN porte IS NOT NULL THEN concat('empresa de porte ', porte) END,
    CASE WHEN ja_cliente THEN 'já é cliente Atlas' END
  ) AS motivo,
  CASE
    WHEN intencao = 'spam' THEN 'Descartar'
    WHEN intencao = 'suporte' THEN 'Encaminhar ao suporte'
    WHEN intencao = 'compra_imediata' AND orcamento_aprovado THEN 'Ligar hoje e enviar proposta comercial'
    WHEN intencao = 'compra_imediata' THEN 'Ligar hoje e agendar reunião comercial'
    ELSE 'Enviar material e oferecer demonstração'
  END AS proximo_passo,
  intencao IN ('compra_imediata', 'avaliando') AS elegivel_fila,
  recebido_em, data_arquivo, processado_em, ai_versao
FROM componentes;
