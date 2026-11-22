-- Bronze · leads como vieram do formulário/LinkedIn/eventos/Google Ads (RF-01, RF-02)
-- Auto Loader: cada arquivo é lido uma única vez. Datas inválidas vão para _rescued_data sem parar o pipeline.
CREATE OR REFRESH STREAMING TABLE bronze.leads_raw
COMMENT 'Leads brutos, um registro por linha dos CSVs leads_AAAA-MM-DD.csv'
AS SELECT
  *,
  _metadata.file_path AS _arquivo,
  current_timestamp() AS _ingerido_em
FROM STREAM read_files(
  '/Volumes/${lead_score.catalog}/landing/raw/leads/',
  format => 'csv',
  header => true,
  multiLine => true,
  encoding => 'UTF-8',
  timestampFormat => 'yyyy-MM-dd HH:mm:ss',
  schemaHints => 'lead_id STRING, telefone STRING, cnpj STRING, campanha STRING, mensagem STRING, recebido_em TIMESTAMP',
  rescuedDataColumn => '_rescued_data'
);
