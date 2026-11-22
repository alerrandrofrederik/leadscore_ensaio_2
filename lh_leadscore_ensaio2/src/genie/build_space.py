"""Cria o Genie Space "Lead Score · Agente Comercial" sobre as 3 tabelas Gold.

Uso:  py -I lh_leadscore_ensaio2/src/genie/build_space.py   → imprime o space_id
"""
import json
import os
import subprocess
import sys
import tempfile

PROFILE = os.environ.get("LS_PROFILE", "lead_score")
WAREHOUSE = os.environ.get("LS_WAREHOUSE", "a50e6a998ebe9440")
CAT = "lh_leadscore_ensaio2"
TITULO = "Lead Score · Agente Comercial"
G = f"{CAT}.gold"

_seq = iter(range(1, 1000))


def novo_id() -> str:
    """IDs de 32 hex, crescentes (o serialized_space exige ordem)."""
    return f"{0x01f0c0de000000000000000000000000 + next(_seq):032x}"


INSTRUCOES = f"""Você é o agente comercial da Atlas Software. Responda sempre em português, de forma curta.
Tabelas: {G}.leads_classificados (todos os leads únicos do dia, com intencao, entidades extraídas pela IA, lead_score e score_componentes),
{G}.fila_do_dia (os 20 leads priorizados, com posicao 1-20 e vendedor) e {G}.feedback_contatos (cliques em "Contatado" no app).
Regras:
- "hoje" ou "do dia" = data_arquivo = (SELECT max(data_arquivo) FROM {G}.leads_classificados). Nunca use current_date().
- "compra imediata" = intencao = 'compra_imediata'. Intenções possíveis: compra_imediata, avaliando, suporte, spam.
- "fora da fila" = leads de compra_imediata do dia LEFT ANTI JOIN {G}.fila_do_dia por lead_id.
- "contatado" = lead_id presente em {G}.feedback_contatos. Os vendedores são Ana Ribeiro, Bruno Carvalho, Carla Mendes e Diego Rocha.
- "concorrente" = concorrente_citado IS NOT NULL.
- Ao listar leads, mostre lead_id, nome, empresa, canal, lead_score e motivo, ordenados por lead_score DESC."""

HOJE = f"(SELECT max(data_arquivo) FROM {G}.leads_classificados)"

EXEMPLOS = [
    ("Quantos leads de compra imediata chegaram hoje?",
     f"SELECT count(*) AS leads_compra_imediata\nFROM {G}.leads_classificados\n"
     f"WHERE intencao = 'compra_imediata' AND data_arquivo = {HOJE}"),
    ("Qual canal trouxe mais leads de compra imediata?",
     f"SELECT canal, count(*) AS leads_compra_imediata\nFROM {G}.leads_classificados\n"
     f"WHERE intencao = 'compra_imediata' AND data_arquivo = {HOJE}\nGROUP BY canal\nORDER BY leads_compra_imediata DESC"),
    ("Quais leads citaram concorrente?",
     f"SELECT lead_id, nome, empresa, concorrente_citado, intencao, lead_score\nFROM {G}.leads_classificados\n"
     f"WHERE concorrente_citado IS NOT NULL AND data_arquivo = {HOJE}\nORDER BY lead_score DESC"),
    ("Quantos leads da minha fila eu já contatei?",
     f"SELECT f.vendedor, count(DISTINCT f.lead_id) AS na_fila, count(DISTINCT c.lead_id) AS contatados\n"
     f"FROM {G}.fila_do_dia f\nLEFT JOIN {G}.feedback_contatos c ON c.lead_id = f.lead_id\nGROUP BY f.vendedor\nORDER BY f.vendedor"),
    ("Quais leads de compra imediata ficaram fora da fila de hoje?",
     f"SELECT c.lead_id, c.nome, c.empresa, c.canal, c.lead_score, c.motivo\nFROM {G}.leads_classificados c\n"
     f"LEFT ANTI JOIN {G}.fila_do_dia f ON f.lead_id = c.lead_id\n"
     f"WHERE c.intencao = 'compra_imediata' AND c.data_arquivo = {HOJE}\nORDER BY c.lead_score DESC"),
]


def montar() -> dict:
    perguntas = [{"id": novo_id(), "question": [q]} for q, _ in EXEMPLOS]
    texto = [{"id": novo_id(), "content": [INSTRUCOES]}]
    exemplos = [{"id": novo_id(), "question": [q], "sql": [s]} for q, s in EXEMPLOS]
    tabelas = sorted(
        [{"identifier": f"{G}.{t}"} for t in ("leads_classificados", "fila_do_dia", "feedback_contatos")],
        key=lambda t: t["identifier"],
    )
    espaco = {
        "version": 2,
        "config": {"sample_questions": perguntas},
        "data_sources": {"tables": tabelas},
        "instructions": {"text_instructions": texto, "example_question_sqls": exemplos},
    }
    return {
        "warehouse_id": WAREHOUSE,
        "title": TITULO,
        "description": "Pergunte em português sobre os leads do dia, a Fila do Dia e os contatos do time comercial.",
        "serialized_space": json.dumps(espaco, ensure_ascii=False),
    }


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump(montar(), f, ensure_ascii=False)
        corpo = f.name
    try:
        out = subprocess.run(
            ["databricks", "genie", "create-space", "--json", "@" + corpo, "--profile", PROFILE, "-o", "json"],
            capture_output=True, text=True, encoding="utf-8", shell=(os.name == "nt"),
        )
    finally:
        os.unlink(corpo)
    if out.returncode:
        print(out.stderr.strip(), file=sys.stderr)
        return 1
    print(json.loads(out.stdout)["space_id"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
