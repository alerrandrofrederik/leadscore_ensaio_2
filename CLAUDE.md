# Lead Score · roteiro de build ao vivo (≤ 20 min)

Você vai implementar o `PRD_v3_lead_score.md` **ao vivo, na frente da plateia**. Tudo abaixo já foi
decidido e testado no ensaio 2: **não pergunte, não use plan mode, não leia skills nem docs do AppKit**
(a receita está aqui). Narre em uma linha o que está fazendo a cada passo.

## Decisões fixas
| Item | Valor |
|---|---|
| Profile do CLI | `--profile lead_score` em **todo** comando `databricks` |
| SQL Warehouse | `a50e6a998ebe9440` (já ligado pelo pre-flight) |
| Catálogo | `lh_leadscore_ensaio2` (**já existe**; nunca rode `catalogs create`) |
| Já existem (pre-flight) | schemas `landing`, `bronze`, `silver`, `gold`; volumes `landing.raw` e `landing.gabarito`, com `empresas/`, `historico/` e o gabarito carregados. **Não declare schemas nem volumes no bundle.** |
| Ao vivo | `data/raw/leads/leads_2026-11-22.csv` → `dbfs:/Volumes/lh_leadscore_ensaio2/landing/raw/leads/` |
| Bundle de dados | `lh_leadscore_ensaio2/` (pipeline SQL serverless, **sem** `mode: development`) |
| Pipeline | nome `lh_leadscore_ensaio2_pipeline`, catálogo padrão do pipeline = `lh_leadscore_ensaio2`, schema `gold` |
| Genie Space | "Lead Score · Agente Comercial" sobre as 3 tabelas Gold |
| App | `lead-score-app/` (AppKit) · **já criado e vazio no workspace**, com grants aplicados |
| Feedback | `gold.feedback_contatos` (Delta comum, criada pelo setup; o app faz INSERT) |
| Vendedores | Ana Ribeiro, Bruno Carvalho, Carla Mendes, Diego Rocha (round-robin pela posição) |

## Ordem de execução (paralelize: comando longo → `run_in_background`)
1. **Bundle + pipeline** (`lh_leadscore_ensaio2/`): `databricks.yml` (variáveis `catalog` e `warehouse_id`), `resources/lead_score.pipeline.yml` (chave `lead_score_pipeline`), `resources/lead_score.setup.job.yml` (chave `lead_score_setup`, `sql_task` com `file` e `parameters: {catalog}`), `src/setup/00_ambiente.sql`, `src/pipeline/*.sql` (1 dataset por arquivo). `bundle validate` → `bundle deploy`.
2. Rode o setup (`bundle run lead_score_setup` → cria `gold.feedback_contatos`). **Suba o CSV de leads** (momento da plateia) e dispare `bundle run lead_score_pipeline` **em background** (cold start de 2–3 min).
3. Enquanto o pipeline roda: `src/genie/build_space.py` e `databricks apps init` do app. Escreva também as consultas `config/queries/*.sql`.
4. Pipeline terminou → rode `src/validacao/validacao.sql` e mostre na tela (pegadinhas, herói em 1º, 26/6). Crie o Genie Space.
5. App: typegen → `server/server.ts` → telas → `databricks apps validate` → `bundle deploy` + `bundle run app` (**em background**, ~2–3 min).
6. Fim: abra a URL e mostre o herói em #1, o botão "Contatado" e uma pergunta ao agente.

Se o relógio passar de 16 min antes do passo 5, pule a tela "Da fonte à decisão".

## Receita · pipeline (SQL)
- Bronze (streaming tables): `FROM STREAM read_files('/Volumes/${lead_score.catalog}/landing/raw/leads/', format => 'csv', header => true, multiLine => true, timestampFormat => 'yyyy-MM-dd HH:mm:ss', schemaHints => 'lead_id STRING, telefone STRING, cnpj STRING, campanha STRING, mensagem STRING, recebido_em TIMESTAMP', rescuedDataColumn => '_rescued_data')`, mais `_metadata.file_path AS _arquivo` e `current_timestamp() AS _ingerido_em`. Defina `configuration: lead_score.catalog: ${var.catalog}` no pipeline. Use `CNPJ STRING` em todas as fontes.
- Silver (MVs): `email_norm = lower(regexp_replace(email,'[[:space:]]',''))`; `cnpj_norm` só com dígitos; dígito verificador em SQL puro com `aggregate(sequence(1,12)...)` e pesos `5,4,3,2,9,8,7,6,5,4,3,2` / `6,5,4,3,2,9,8,7,6,5,4,3,2`; dedup `row_number() OVER (PARTITION BY email_norm ORDER BY recebido_em DESC NULLS LAST, lead_id DESC)`; `data_arquivo` extraída de `_arquivo` com regex `[0-9]{4}-[0-9]{2}-[0-9]{2}` (evite `\d` em string SQL).
- Gold: **`gold.leads_ia` é STREAMING TABLE sobre `STREAM(bronze.leads_raw)`** (só linhas novas chamam a IA → CA-12). Mensagem com menos de 5 caracteres → `spam` sem IA (`CASE`). `ai_extract` só para `compra_imediata`/`avaliando`.
- **Rótulos finais (deram 100% e 5/5 pegadinhas; não simplifique):**
  ```
  "compra_imediata": "Quer comprar produtos da Atlas Software: pede preço, proposta, quantidade de licenças, prazo ou reunião comercial",
  "avaliando":       "Quer conhecer os produtos da Atlas, comparar opções ou ver uma demonstração, sem urgência",
  "suporte":         "Já é cliente da Atlas e relata problema, dúvida de uso ou pede ajuda técnica",
  "spam":            "Sem relação com comprar da Atlas: oferta ou propaganda de terceiros (SEO, empréstimo, marketing), teste ou texto sem sentido, mesmo que use palavras como urgente, proposta ou preço"
  ```
  No `ai_extract`, use `prazo` = "Prazo ou data desejada, só o mês ou a data, sem preposição (ex.: dezembro)" e `concorrente_citado` = "Sistema concorrente de outra empresa que o lead usa ou avalia (nunca um produto Atlas)". Sempre `map('version', '2.1')`.
- **Caminhos do VARIANT:** `intencao_raw:response[0].value::string` e `entidades_raw:response.qtd_licencas.value::int` (**não** `response:qtd_licencas`).
- Score (seção 2.7 do PRD) em `gold.leads_classificados` (MV), com `score_componentes` struct, `motivo` (`concat_ws(' · ', ...)`, "empresa de porte X") e `proximo_passo`. Fila: `elegivel_fila`, dia = `max(data_arquivo)`, desempate `lead_score DESC, sinais DESC, perfil DESC, qtd_licencas DESC NULLS LAST, recebido_em ASC` (é isso que põe o herói em #1).

## Receita · Genie
`databricks genie create-space --json @arquivo.json` com `{warehouse_id, title, description, serialized_space}`. O `serialized_space` é string JSON `version: 2`. IDs de 32 hex **ordenados**; `question`, `sql` e `content` são **arrays**; no máximo 1 `text_instructions`; tabelas ordenadas por `identifier`. Instruções: "hoje" = `max(data_arquivo)` (nunca `current_date()`); "fora da fila" = `compra_imediata` LEFT ANTI JOIN `fila_do_dia`. Inclua o SQL de exemplo das 5 perguntas do PRD 2.8.

## Receita · App (AppKit)
- Init: `databricks apps init --name lead-score-app --package-manager npm --features analytics,genie --set analytics.sql-warehouse.id=a50e6a998ebe9440 --set genie.genie-space.id=<ID> --set "genie.genie-space.name=Lead Score · Agente Comercial" --run none --profile lead_score`. Apague `hello_world.sql`, `mocked_sales.sql` e as páginas de exemplo.
- Typegen: `set -a; . ./.env; set +a; npm run typegen` (sem o `.env` carregado ele fica OFFLINE).
- Consultas em `config/queries/` com nomes de 3 partes (`lh_leadscore_ensaio2.gold...`). As que dependem de contatos recebem `-- @param v STRING = 0` e usam `:v`; o client passa `sql.string(versao)` e troca a versão depois de cada contato (cache-buster).
- **O warehouse devolve booleanos e números como texto**: normalize com `v === true || v === 'true'` e `Number(...)` antes de usar (senão "false" vira verdadeiro).
- INSERT do feedback em `server/server.ts`, dentro de `onPluginsReady` → `appkit.server.extend`: `const { client } = getExecutionContext(); const warehouseId = await getWarehouseId(); client.statementExecution.executeStatement({ warehouse_id, statement, parameters: [{name, value, type: 'STRING'}] })`. O corpo JSON já vem parseado (não importe express; `getWorkspaceClient` do pacote é do Lakebase).
- Componentes: `useAnalyticsQuery`, `BarChart` (`xKey`, `yKey`, `stacked`, `orientation="horizontal"`), `Progress`, `Badge`, `Empty*`, `Alert*`, `Skeleton`, `GenieChat alias="default"`. Cores só por token (`bg-success`, `bg-warning`, `bg-brand`…). Tema: `.dark` força o escuro e `.light` impede o escuro do sistema.
- Layout dos prints em `app_referencia/` (sidebar azul-marinho, marca "Lead Score"). Smoke: `databricks apps validate --profile lead_score` precisa passar antes do deploy.

## Armadilhas conhecidas → solução
- `catalogs create` falha (Default Storage) → o catálogo já existe; se precisar, use `CREATE CATALOG` via warehouse.
- `mode: development` prefixa os schemas (`dev_usuario_bronze`) → não use.
- Pipeline com nome repetido (409) → use `lh_leadscore_ensaio2_pipeline`.
- Git Bash converte `/api/...` em caminho do Windows → `export MSYS_NO_PATHCONV=1` antes de `databricks api`.
- `python -c` multilinha quebra no Bash do Windows → escreva o script num arquivo e rode com `py -I`.
- `bundle run --refresh/--full-refresh` recebe `"table:<catálogo.schema.tabela>"`.
- Build do app falha com `INSUFFICIENT_PERMISSIONS` → grants do SP (`lh_leadscore_ensaio2/src/setup/01_grants_app.sql`; o pre-flight já aplica).
- Limite de 3 apps no workspace → o app já está pré-criado; nunca crie outro.

## Pronto quando
`src/validacao/validacao.sql` está todo verde (100 / 2 / 96 / 0 / 2 / 0064 / ≥85% / ≥4 de 5 / herói / 20 / 5 cada / 26 / 6), o app está RUNNING, "Contatado" grava em `feedback_contatos` e o Genie responde 26 e 6.
