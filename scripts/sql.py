"""Executa SQL no warehouse do Lead Score via Statement Execution API (CLI `databricks api`).

Uso:
    py -I scripts/sql.py -e "SELECT 1"            # um comando
    py -I scripts/sql.py arquivo.sql               # vários comandos separados por ';'
    py -I scripts/sql.py -q -e "SELECT ..."        # só imprime as linhas (sem cabeçalho)
Saída: tabela "col | col"; código de saída 1 se algum comando falhar.
"""
import json
import os
import subprocess
import sys
import tempfile

PROFILE = os.environ.get("LS_PROFILE", "lead_score")
WAREHOUSE = os.environ.get("LS_WAREHOUSE", "a50e6a998ebe9440")


def executar(stmt: str) -> dict:
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump({"warehouse_id": WAREHOUSE, "statement": stmt, "wait_timeout": "50s"}, f, ensure_ascii=False)
        corpo = f.name
    try:
        out = subprocess.run(
            ["databricks", "api", "post", "/api/2.0/sql/statements", "--profile", PROFILE, "--json", "@" + corpo],
            capture_output=True, text=True, encoding="utf-8", env=dict(os.environ, MSYS_NO_PATHCONV="1"),
            shell=(os.name == "nt"),
        )
    finally:
        os.unlink(corpo)
    if out.returncode:
        return {"status": {"state": "FAILED", "error": {"message": out.stderr.strip()}}}
    return json.loads(out.stdout or "{}")


def comandos(texto: str) -> list[str]:
    linhas = [l for l in texto.splitlines() if not l.strip().startswith("--")]
    return [c.strip() for c in "\n".join(linhas).split(";") if c.strip()]


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    args = sys.argv[1:]
    quieto = "-q" in args
    args = [a for a in args if a != "-q"]
    if args[:1] == ["-e"]:
        texto = args[1]
    else:
        texto = open(args[0], encoding="utf-8").read()
    falhou = False
    for stmt in comandos(texto):
        r = executar(stmt)
        st = r.get("status", {})
        if st.get("state") != "SUCCEEDED":
            falhou = True
            print(f"❌ {stmt[:80]}… → {st.get('error', {}).get('message', st)}", file=sys.stderr)
            continue
        cols = [c["name"] for c in r.get("manifest", {}).get("schema", {}).get("columns", [])]
        linhas = (r.get("result") or {}).get("data_array") or []
        if cols and not quieto:
            print(" | ".join(cols))
        for linha in linhas:
            print(" | ".join("" if v is None else str(v) for v in linha))
    return 1 if falhou else 0


if __name__ == "__main__":
    sys.exit(main())
