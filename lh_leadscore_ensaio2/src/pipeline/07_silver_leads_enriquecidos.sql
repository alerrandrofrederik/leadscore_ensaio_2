-- Silver · lead + empresa + histórico (RF-05)
CREATE OR REFRESH MATERIALIZED VIEW silver.leads_enriquecidos
COMMENT 'Lead único unido ao cadastro da empresa e ao histórico comercial'
AS SELECT
  l.lead_id, l.nome, l.email, l.email_norm, l.telefone, l.cnpj, l.cnpj_norm, l.cnpj_valido,
  l.canal, l.campanha, l.mensagem, l.recebido_em, l.data_arquivo, l._rescued_data,
  e.razao_social AS empresa, e.porte, e.segmento, e.num_funcionarios, e.uf,
  coalesce(h.ja_cliente, false) AS ja_cliente,
  coalesce(h.oportunidades_ganhas, 0) AS oportunidades_ganhas,
  coalesce(h.produtos_ganhos, array()) AS produtos_ganhos
FROM silver.leads l
LEFT JOIN silver.empresas e
  ON l.cnpj_valido AND e.cnpj_norm = l.cnpj_norm
LEFT JOIN silver.historico_empresa h
  ON l.cnpj_valido AND h.cnpj_norm = l.cnpj_norm;
