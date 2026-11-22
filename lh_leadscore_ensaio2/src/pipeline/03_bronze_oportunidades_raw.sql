-- Bronze · histórico de oportunidades exportado do CRM
CREATE OR REFRESH STREAMING TABLE bronze.oportunidades_raw
COMMENT 'Oportunidades do CRM, cruas (RF-01)'
AS SELECT
  *,
  _metadata.file_path AS _arquivo,
  current_timestamp() AS _ingerido_em
FROM STREAM read_files(
  '/Volumes/${lead_score.catalog}/landing/raw/historico/',
  format => 'csv',
  header => true,
  multiLine => true,
  schemaHints => 'oportunidade_id STRING, cnpj STRING, valor DOUBLE, data DATE',
  rescuedDataColumn => '_rescued_data'
);
