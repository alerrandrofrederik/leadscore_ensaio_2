-- Bronze · leads como vieram (Auto Loader: cada arquivo lido uma única vez)
CREATE OR REFRESH STREAMING TABLE bronze.leads_raw
COMMENT 'Leads do dia, crus, com arquivo de origem e momento da ingestão (RF-01, RF-02)'
AS SELECT
  *,
  _metadata.file_path AS _arquivo,
  current_timestamp() AS _ingerido_em
FROM STREAM read_files(
  '/Volumes/${lead_score.catalog}/landing/raw/leads/',
  format => 'csv',
  header => true,
  multiLine => true,
  timestampFormat => 'yyyy-MM-dd HH:mm:ss',
  schemaHints => 'lead_id STRING, telefone STRING, cnpj STRING, campanha STRING, mensagem STRING, recebido_em TIMESTAMP',
  rescuedDataColumn => '_rescued_data'
);
