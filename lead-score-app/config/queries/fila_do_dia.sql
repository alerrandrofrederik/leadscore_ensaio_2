-- Fila do Dia: os 20 leads com score, componentes, motivo, entidades e status de contato (RF-13)
-- @param v STRING = 0
SELECT
  f.posicao,
  f.vendedor,
  f.lead_id,
  f.nome,
  f.empresa,
  f.porte,
  f.cargo,
  f.canal,
  f.telefone,
  f.intencao,
  f.lead_score,
  f.score_componentes.intencao AS c_intencao,
  f.score_componentes.perfil   AS c_perfil,
  f.score_componentes.sinais   AS c_sinais,
  f.score_componentes.recencia AS c_recencia,
  f.motivo,
  f.proximo_passo,
  f.produto,
  f.qtd_licencas,
  f.prazo,
  f.orcamento_aprovado,
  f.concorrente_citado,
  f.mensagem,
  CAST(f.data AS STRING)            AS data_ref,
  fb.lead_id IS NOT NULL            AS contatado,
  :v                                AS versao
FROM lh_leadscore_ensaio2.gold.fila_do_dia f
LEFT JOIN (SELECT DISTINCT lead_id FROM lh_leadscore_ensaio2.gold.feedback_contatos) fb
  ON f.lead_id = fb.lead_id
WHERE f.data = (SELECT max(data) FROM lh_leadscore_ensaio2.gold.fila_do_dia)
ORDER BY f.posicao;
