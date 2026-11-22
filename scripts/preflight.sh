#!/usr/bin/env bash
# Pre-flight do Lead Score: deixa o workspace no estado "antes da apresentação" e confere tudo.
# Idempotente. Rode ~30 min antes da demo:  bash scripts/preflight.sh
#
# Garante: warehouse ligado · schemas landing/bronze/silver/gold · volumes raw e gabarito com
# empresas, histórico e gabarito · pasta leads/ vazia · app lead-score-app existente + grants do SP ·
# node/npm. Avisa se sobrou algo de um ensaio (pipeline, Genie Space, leads já carregados).
set -uo pipefail
export MSYS_NO_PATHCONV=1

P="--profile ${LS_PROFILE:-lead_score}"
WH="${LS_WAREHOUSE:-a50e6a998ebe9440}"
CAT="lh_leadscore_ensaio2"
APP="lead-score-app"
RAIZ="$(cd "$(dirname "$0")/.." && (pwd -W 2>/dev/null || pwd))"
PY="$(command -v py >/dev/null 2>&1 && echo "py -I" || echo "python3 -I")"
SQL="$PY $RAIZ/scripts/sql.py"
FALHAS=0

ok()   { echo "✅ $*"; }
erro() { echo "❌ $*"; FALHAS=$((FALHAS + 1)); }
aviso(){ echo "⚠️  $*"; }
json() { $PY -c "import json,sys; sys.stdin.reconfigure(encoding='utf-8'); sys.stdout.reconfigure(encoding='utf-8'); d=json.load(sys.stdin); print($1)"; }

echo "== Lead Score · pre-flight =="

# 1. Autenticação
if EU=$(databricks current-user me $P -o json 2>/dev/null | json "d['userName']"); then ok "autenticado como $EU"; else erro "CLI sem autenticação (rode: databricks auth login $P)"; exit 1; fi

# 2. Warehouse ligado
ESTADO=$(databricks warehouses get "$WH" $P -o json | json "d['state']")
if [ "$ESTADO" != "RUNNING" ]; then
  echo "   ligando o warehouse ($ESTADO)…"
  databricks warehouses start "$WH" $P >/dev/null 2>&1
  ESTADO=$(databricks warehouses get "$WH" $P -o json | json "d['state']")
fi
[ "$ESTADO" = "RUNNING" ] && ok "warehouse $WH RUNNING" || erro "warehouse $WH em $ESTADO"

# 3. Catálogo, schemas e volumes (pré-requisitos; o bundle ao vivo não os declara)
if $SQL -q -e "
  CREATE SCHEMA IF NOT EXISTS $CAT.landing COMMENT 'Porta de entrada dos CSVs';
  CREATE SCHEMA IF NOT EXISTS $CAT.bronze  COMMENT 'Dado como veio (Auto Loader)';
  CREATE SCHEMA IF NOT EXISTS $CAT.silver  COMMENT 'Limpo, deduplicado e unido';
  CREATE SCHEMA IF NOT EXISTS $CAT.gold    COMMENT 'IA + Lead Score + Fila do Dia';
  CREATE VOLUME IF NOT EXISTS $CAT.landing.raw;
  CREATE VOLUME IF NOT EXISTS $CAT.landing.gabarito" >/dev/null; then
  ok "catálogo $CAT com schemas e volumes"
else
  erro "catálogo $CAT ausente ou sem permissão (crie com CREATE CATALOG via warehouse)"
fi

# 4. Arquivos de referência (antes da demo) e pasta de leads vazia (ao vivo)
V="dbfs:/Volumes/$CAT/landing"
databricks fs mkdir "$V/raw/leads" $P >/dev/null 2>&1
databricks fs cp -r --overwrite "$RAIZ/data/raw/empresas"  "$V/raw/empresas"  $P >/dev/null && \
databricks fs cp -r --overwrite "$RAIZ/data/raw/historico" "$V/raw/historico" $P >/dev/null && \
databricks fs cp -r --overwrite "$RAIZ/data/gabarito"      "$V/gabarito"      $P >/dev/null && \
  ok "empresas, histórico e gabarito no Volume" || erro "falha ao copiar os CSVs de referência"
if [ -n "$(databricks fs ls "$V/raw/leads" $P 2>/dev/null)" ]; then
  aviso "já há arquivo em raw/leads/: a subida ao vivo não vai ser novidade (rode scripts/reset_demo.sh)"
else
  ok "raw/leads/ vazia, pronta para o upload ao vivo"
fi

# 5. App pré-criado + grants do service principal
APPS=$(databricks apps list $P -o json | json "len(d)")
if SPID=$(databricks apps get "$APP" $P -o json 2>/dev/null | json "d['service_principal_client_id']"); then
  ok "app $APP existe ($APPS de 3 apps no workspace)"
  if $SQL -q -e "
    GRANT USE CATALOG ON CATALOG $CAT TO \`$SPID\`;
    GRANT USE SCHEMA, SELECT ON SCHEMA $CAT.gold TO \`$SPID\`;
    GRANT MODIFY ON SCHEMA $CAT.gold TO \`$SPID\`;
    GRANT USE SCHEMA, SELECT ON SCHEMA $CAT.bronze TO \`$SPID\`;
    GRANT USE SCHEMA ON SCHEMA $CAT.landing TO \`$SPID\`;
    GRANT READ VOLUME ON VOLUME $CAT.landing.gabarito TO \`$SPID\`" >/dev/null; then
    ok "grants do SP do app aplicados (valem para as tabelas criadas ao vivo)"
  else
    erro "falha ao aplicar grants ao SP $SPID"
  fi
elif [ "$APPS" -ge 3 ]; then
  erro "app $APP não existe e o workspace já tem 3 apps: libere uma vaga"
else
  echo "   criando o app vazio $APP (provisiona o compute antes da demo)…"
  if databricks apps create "$APP" --description "Lead Score: Fila do Dia, Visão do Gestor e Agente Comercial" $P >/dev/null; then
    aviso "app criado: rode o pre-flight de novo para aplicar os grants"
  else
    erro "falha ao criar o app $APP"
  fi
fi

# 6. Ferramentas locais
command -v node >/dev/null && command -v npm >/dev/null && ok "node $(node --version) · npm $(npm --version)" || erro "node/npm ausentes"

# 7. Sobras de ensaio
if databricks pipelines list-pipelines $P -o json 2>/dev/null | json "any('lh_leadscore_ensaio2_pipeline' in p.get('name','') for p in d)" | grep -q True; then
  aviso "pipeline lh_leadscore_ensaio2_pipeline ainda existe (rode scripts/reset_demo.sh)"
fi
if databricks genie list-spaces $P -o json 2>/dev/null | json "any(s.get('title')=='Lead Score · Agente Comercial' for s in d.get('spaces',[]))" | grep -q True; then
  aviso "Genie Space 'Lead Score · Agente Comercial' ainda existe (rode scripts/reset_demo.sh)"
fi

echo
[ "$FALHAS" -eq 0 ] && echo "PRE-FLIGHT OK · pode começar" || { echo "PRE-FLIGHT COM $FALHAS FALHA(S)"; exit 1; }
