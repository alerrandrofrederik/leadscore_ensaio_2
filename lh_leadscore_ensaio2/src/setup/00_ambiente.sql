-- M0 · Ambiente do Lead Score
-- Catálogo, schemas e volumes vêm do bundle. Aqui: tabela de feedback do app + teste das AI Functions.
USE CATALOG IDENTIFIER(:catalog);

-- Gravada pelo Data App (botão "Marcar como contatado"). Fica fora do pipeline: é escrita por usuários.
CREATE TABLE IF NOT EXISTS gold.feedback_contatos (
  lead_id      STRING    COMMENT 'Lead contatado',
  vendedor     STRING    COMMENT 'Vendedor que fez o contato',
  contatado_em TIMESTAMP COMMENT 'Momento em que o vendedor marcou o contato',
  resultado    STRING    COMMENT 'contatado | sem_resposta | oportunidade | descartado'
)
COMMENT 'Feedback dos vendedores sobre os leads da fila (alimenta a recalibração do score)';

-- Teste das AI Functions na mensagem herói (risco 3.2: validar disponibilidade antes da demo)
SELECT
  ai_classify(
    msg,
    '{"compra_imediata": "Pede preço, proposta, quantidade de licenças, prazo ou reunião comercial",
      "avaliando": "Quer conhecer, comparar ou ver demo, sem urgência",
      "suporte": "Já é cliente e relata problema ou dúvida de uso",
      "spam": "Sem relação com compra"}',
    map('version', '2.1')
  ) AS intencao_raw,
  ai_extract(
    msg,
    '{"produto": {"type": "string", "description": "Produto Atlas citado"},
      "qtd_licencas": {"type": "integer", "description": "Quantidade de licenças ou usuários"},
      "prazo": {"type": "string", "description": "Prazo ou data desejada"},
      "orcamento_aprovado": {"type": "boolean", "description": "Mencionou orçamento aprovado"},
      "cargo": {"type": "string", "description": "Cargo de quem escreveu"},
      "concorrente_citado": {"type": "string", "description": "Concorrente mencionado"}}',
    map('version', '2.1')
  ) AS entidades_raw
FROM (SELECT 'Boa tarde, sou Diretor Financeiro da Metalúrgica Bandeirantes. Precisamos de 200 licenças do Atlas Gestão até dezembro, o orçamento já está aprovado. Hoje usamos o OmniERP e queremos migrar. Podemos agendar uma reunião?' AS msg);
