-- Silver · leads limpos e deduplicados (RF-03, RF-04, RF-06)
-- E-mail normalizado, CNPJ com 14 dígitos e dígito verificador validado,
-- 1 linha por e-mail mantendo a mensagem mais recente.
CREATE OR REFRESH MATERIALIZED VIEW silver.leads (
  CONSTRAINT email_presente               EXPECT (email_norm IS NOT NULL),
  CONSTRAINT cnpj_valido_quando_informado EXPECT (cnpj_norm IS NULL OR cnpj_valido),
  CONSTRAINT data_recebimento_valida      EXPECT (recebido_em IS NOT NULL)
)
COMMENT 'Leads únicos (deduplicados por e-mail normalizado), com CNPJ normalizado e validado'
AS
WITH base AS (
  SELECT
    lead_id,
    trim(nome)                                      AS nome,
    lower(regexp_replace(email, '[[:space:]]', '')) AS email_norm,
    email                                           AS email_original,
    telefone,
    nullif(regexp_replace(cnpj, '[^0-9]', ''), '')  AS cnpj_norm,
    cnpj                                            AS cnpj_original,
    lower(trim(canal))                              AS canal,
    coalesce(campanha, '')                          AS campanha,
    mensagem,
    recebido_em,
    get_json_object(_rescued_data, '$.recebido_em') AS recebido_em_invalido,
    to_date(regexp_extract(_arquivo, '([0-9]{4}-[0-9]{2}-[0-9]{2})', 1)) AS data_arquivo,
    _arquivo,
    _ingerido_em
  FROM bronze.leads_raw
),
somas AS (
  -- somas ponderadas do módulo 11 (dígito verificador do CNPJ)
  SELECT
    *,
    CASE WHEN length(cnpj_norm) = 14 THEN
      aggregate(sequence(1, 12), 0, (acc, i) ->
        acc + CAST(substr(cnpj_norm, i, 1) AS INT) * element_at(array(5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2), i))
    END AS _soma1,
    CASE WHEN length(cnpj_norm) = 14 THEN
      aggregate(sequence(1, 13), 0, (acc, i) ->
        acc + CAST(substr(cnpj_norm, i, 1) AS INT) * element_at(array(6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2), i))
    END AS _soma2
  FROM base
),
validado AS (
  SELECT
    * EXCEPT (_soma1, _soma2),
    coalesce(
      length(cnpj_norm) = 14
      AND cnpj_norm <> repeat(substr(cnpj_norm, 1, 1), 14)
      AND CAST(substr(cnpj_norm, 13, 1) AS INT) = CASE WHEN pmod(_soma1, 11) < 2 THEN 0 ELSE 11 - pmod(_soma1, 11) END
      AND CAST(substr(cnpj_norm, 14, 1) AS INT) = CASE WHEN pmod(_soma2, 11) < 2 THEN 0 ELSE 11 - pmod(_soma2, 11) END,
      false
    ) AS cnpj_valido
  FROM somas
),
ranqueado AS (
  SELECT
    *,
    row_number() OVER (PARTITION BY email_norm ORDER BY recebido_em DESC NULLS LAST, lead_id DESC) AS _rn,
    count(*)     OVER (PARTITION BY email_norm) AS envios
  FROM validado
)
SELECT * EXCEPT (_rn)
FROM ranqueado
WHERE _rn = 1;
