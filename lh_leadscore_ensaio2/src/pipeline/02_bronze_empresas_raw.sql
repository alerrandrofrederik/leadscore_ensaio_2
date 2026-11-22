-- Bronze · base cadastral de empresas
CREATE OR REFRESH STREAMING TABLE bronze.empresas_raw
COMMENT 'Cadastro de empresas, cru (RF-01)'
AS SELECT
  *,
  _metadata.file_path AS _arquivo,
  current_timestamp() AS _ingerido_em
FROM STREAM read_files(
  '/Volumes/${lead_score.catalog}/landing/raw/empresas/',
  format => 'csv',
  header => true,
  multiLine => true,
  schemaHints => 'cnpj STRING, num_funcionarios INT',
  rescuedDataColumn => '_rescued_data'
);
