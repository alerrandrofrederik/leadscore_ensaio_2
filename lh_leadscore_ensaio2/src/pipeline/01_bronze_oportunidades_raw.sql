-- Bronze · histórico de oportunidades exportado do CRM (RF-01, RF-02)
CREATE OR REFRESH STREAMING TABLE bronze.oportunidades_raw
COMMENT 'Oportunidades brutas do CRM (oportunidades_AAAA-MM-DD.csv)'
AS SELECT
  *,
  _metadata.file_path AS _arquivo,
  current_timestamp() AS _ingerido_em
FROM STREAM read_files(
  '/Volumes/${lead_score.catalog}/landing/raw/historico/',
  format => 'csv',
  header => true,
  encoding => 'UTF-8',
  schemaHints => 'oportunidade_id STRING, cnpj STRING, valor DOUBLE, data DATE',
  rescuedDataColumn => '_rescued_data'
);
