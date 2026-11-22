-- Gold · todos os leads com intenção, entidades e Lead Score explicável (RF-09, RF-10, RF-12)
-- lead_score = 0,50 × intenção + 0,25 × perfil + 0,15 × sinais + 0,10 × recência
CREATE OR REFRESH MATERIALIZED VIEW gold.leads_classificados
COMMENT 'Todos os leads únicos com intenção (ai_classify), entidades (ai_extract), Lead Score 0-100, componentes, motivo e próximo passo'
AS
WITH unido AS (
  SELECT
    l.lead_id, l.nome, l.email_norm AS email, l.telefone, l.empresa, l.canal, l.campanha,
    l.porte, l.segmento, l.uf, l.ja_cliente, l.produtos_ganhos, l.cnpj_norm AS cnpj, l.cnpj_valido,
    l.mensagem, l.recebido_em, l.data_arquivo, l.envios,
    ia.intencao, ia.produto, ia.qtd_licencas, ia.prazo, coalesce(ia.orcamento_aprovado, false) AS orcamento_aprovado,
    ia.cargo, ia.concorrente_citado, ia.ia_versao, ia.processado_em
  FROM silver.leads_enriquecidos l
  JOIN gold.leads_ia ia USING (lead_id)
),
componentes AS (
  SELECT
    *,
    CASE intencao WHEN 'compra_imediata' THEN 100 WHEN 'avaliando' THEN 40 ELSE 0 END AS c_intencao,
    least(100,
      CASE porte WHEN 'grande' THEN 100 WHEN 'médio' THEN 60 WHEN 'pequeno' THEN 30 ELSE 20 END
      -- cross-sell: já é cliente e pediu outro produto (ou não disse qual)
      + CASE WHEN ja_cliente AND (produto IS NULL OR NOT array_contains(produtos_ganhos, produto)) THEN 20 ELSE 0 END
    ) AS c_perfil,
    least(100,
      CASE WHEN orcamento_aprovado         THEN 40 ELSE 0 END
      + CASE WHEN prazo IS NOT NULL        THEN 30 ELSE 0 END
      + CASE WHEN qtd_licencas IS NOT NULL THEN 30 ELSE 0 END
    ) AS c_sinais,
    -- recência em relação à data do arquivo; data inválida conta como recebida no dia do arquivo
    CASE coalesce(datediff(data_arquivo, to_date(recebido_em)), 0)
      WHEN 0 THEN 100 WHEN 1 THEN 50 WHEN 2 THEN 25 ELSE 0
    END AS c_recencia
  FROM unido
)
SELECT
  lead_id, nome, email, telefone, empresa, canal, campanha, porte, segmento, uf, ja_cliente, cnpj, cnpj_valido,
  mensagem, intencao, produto, qtd_licencas, prazo, orcamento_aprovado, cargo, concorrente_citado,
  CASE WHEN intencao = 'spam' THEN 0
       ELSE CAST(round(0.50 * c_intencao + 0.25 * c_perfil + 0.15 * c_sinais + 0.10 * c_recencia) AS INT)
  END AS lead_score,
  named_struct('intencao', c_intencao, 'perfil', c_perfil, 'sinais', c_sinais, 'recencia', c_recencia) AS score_componentes,
  CASE intencao
    WHEN 'spam'    THEN 'Sem relação com compra'
    WHEN 'suporte' THEN 'Pedido de suporte de cliente'
    ELSE nullif(concat_ws(' · ',
      CASE
        WHEN qtd_licencas IS NOT NULL THEN concat('Pediu ', qtd_licencas, ' licenças', CASE WHEN produto IS NOT NULL THEN concat(' do ', produto) ELSE '' END)
        WHEN produto IS NOT NULL      THEN concat('Interesse no ', produto)
      END,
      CASE WHEN prazo IS NOT NULL              THEN concat('prazo: ', prazo) END,
      CASE WHEN orcamento_aprovado             THEN 'orçamento aprovado' END,
      CASE WHEN concorrente_citado IS NOT NULL THEN concat('usa ', concorrente_citado) END,
      CASE WHEN porte <> 'desconhecido'        THEN concat('empresa de porte ', porte) END,
      CASE WHEN ja_cliente                     THEN 'já é cliente (cross-sell)' END
    ), '')
  END AS motivo,
  CASE intencao
    WHEN 'compra_imediata' THEN 'Ligar hoje e enviar proposta'
    WHEN 'avaliando'       THEN 'Agendar demonstração'
    WHEN 'suporte'         THEN 'Encaminhar ao suporte'
    ELSE 'Descartar'
  END AS proximo_passo,
  intencao IN ('compra_imediata', 'avaliando') AS elegivel_fila,
  recebido_em, data_arquivo, envios, ia_versao, processado_em
FROM componentes;
