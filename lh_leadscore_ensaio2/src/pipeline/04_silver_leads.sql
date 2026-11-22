-- Silver · leads limpos e deduplicados (RF-03, RF-04, RF-06)
-- e-mail normalizado, CNPJ só com dígitos + dígito verificador, 1 linha por e-mail (a mais recente)
CREATE OR REFRESH MATERIALIZED VIEW silver.leads (
  CONSTRAINT email_presente   EXPECT (email_norm IS NOT NULL AND email_norm LIKE '%@%'),
  CONSTRAINT cnpj_valido_ou_vazio EXPECT (cnpj_norm IS NULL OR cnpj_valido),
  CONSTRAINT data_recebimento_valida EXPECT (recebido_em IS NOT NULL),
  CONSTRAINT mensagem_presente EXPECT (mensagem IS NOT NULL)
)
COMMENT 'Leads únicos por e-mail normalizado, com CNPJ validado (CA-03, CA-04)'
AS
WITH normalizado AS (
  SELECT
    lead_id, nome, email, telefone, cnpj, canal, campanha, mensagem, recebido_em,
    lower(regexp_replace(email, '[[:space:]]', '')) AS email_norm,
    nullif(regexp_replace(cnpj, '[^0-9]', ''), '') AS cnpj_norm,
    to_date(regexp_extract(_arquivo, '[0-9]{4}-[0-9]{2}-[0-9]{2}', 0)) AS data_arquivo,
    _rescued_data, _arquivo, _ingerido_em
  FROM bronze.leads_raw
),
digitos AS (
  SELECT *,
    CASE WHEN length(cnpj_norm) = 14 THEN
      aggregate(sequence(1, 12), 0, (acc, i) ->
        acc + cast(substr(cnpj_norm, i, 1) AS INT) * element_at(array(5,4,3,2,9,8,7,6,5,4,3,2), i)) % 11
    END AS r1,
    CASE WHEN length(cnpj_norm) = 14 THEN
      aggregate(sequence(1, 13), 0, (acc, i) ->
        acc + cast(substr(cnpj_norm, i, 1) AS INT) * element_at(array(6,5,4,3,2,9,8,7,6,5,4,3,2), i)) % 11
    END AS r2
  FROM normalizado
),
validado AS (
  SELECT * EXCEPT (r1, r2),
    coalesce(
      length(cnpj_norm) = 14
      AND cnpj_norm NOT RLIKE '^([0-9])\1{13}$'
      AND cast(substr(cnpj_norm, 13, 1) AS INT) = CASE WHEN r1 < 2 THEN 0 ELSE 11 - r1 END
      AND cast(substr(cnpj_norm, 14, 1) AS INT) = CASE WHEN r2 < 2 THEN 0 ELSE 11 - r2 END,
      false) AS cnpj_valido
  FROM digitos
)
SELECT * EXCEPT (rn)
FROM (
  SELECT *,
    row_number() OVER (PARTITION BY email_norm ORDER BY recebido_em DESC NULLS LAST, lead_id DESC) AS rn
  FROM validado
)
WHERE rn = 1;
