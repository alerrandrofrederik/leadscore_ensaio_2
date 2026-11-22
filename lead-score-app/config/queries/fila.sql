-- @param v STRING = 0
-- Fila do Dia com status de contato (v = cache-buster)
SELECT
  f.posicao, f.vendedor, f.lead_id, f.nome, f.empresa, f.porte, f.canal, f.telefone, f.cargo,
  f.intencao, f.lead_score,
  f.score_componentes.intencao AS c_intencao,
  f.score_componentes.perfil AS c_perfil,
  f.score_componentes.sinais AS c_sinais,
  f.score_componentes.recencia AS c_recencia,
  f.produto, f.qtd_licencas, f.prazo, f.orcamento_aprovado, f.concorrente_citado,
  f.motivo, f.proximo_passo, f.mensagem,
  date_format(f.recebido_em, 'HH:mm') AS recebido_hora,
  c.lead_id IS NOT NULL AS contatado,
  :v AS versao
FROM lh_leadscore_ensaio2.gold.fila_do_dia f
LEFT JOIN (SELECT DISTINCT lead_id FROM lh_leadscore_ensaio2.gold.feedback_contatos) c ON c.lead_id = f.lead_id
ORDER BY f.posicao
