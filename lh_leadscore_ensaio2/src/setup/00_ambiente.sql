-- Setup do Lead Score: tabela de feedback gravada pelo Data App (botão "Contatado").
-- Schemas e volumes já existem (pre-flight). Parâmetro: :catalog
CREATE TABLE IF NOT EXISTS IDENTIFIER(:catalog || '.gold.feedback_contatos') (
  lead_id      STRING    COMMENT 'Lead contatado',
  vendedor     STRING    COMMENT 'Vendedor que fez o contato',
  contatado_em TIMESTAMP COMMENT 'Momento do contato',
  resultado    STRING    COMMENT 'Resultado registrado (ex.: contatado)'
)
COMMENT 'Feedback dos vendedores: cada clique em "Contatado" no Data App';
