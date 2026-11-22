-- Permissões mínimas do service principal do Data App (lead-score-app).
-- Rodar depois do primeiro deploy do app. Descubra o ID com:
--   databricks apps get lead-score-app --profile lead_score -o json   (campo service_principal_client_id)
-- e substitua <SP_CLIENT_ID> abaixo.
GRANT USE CATALOG ON CATALOG lh_leadscore_ensaio2 TO `<SP_CLIENT_ID>`;
GRANT USE SCHEMA, SELECT ON SCHEMA lh_leadscore_ensaio2.gold TO `<SP_CLIENT_ID>`;
GRANT USE SCHEMA, SELECT ON SCHEMA lh_leadscore_ensaio2.bronze TO `<SP_CLIENT_ID>`;  -- KPI "Recebidos"
GRANT USE SCHEMA ON SCHEMA lh_leadscore_ensaio2.landing TO `<SP_CLIENT_ID>`;
GRANT READ VOLUME ON VOLUME lh_leadscore_ensaio2.landing.gabarito TO `<SP_CLIENT_ID>`; -- KPI "Acurácia da IA"
GRANT MODIFY ON TABLE lh_leadscore_ensaio2.gold.feedback_contatos TO `<SP_CLIENT_ID>`;  -- botão "Contatado"
