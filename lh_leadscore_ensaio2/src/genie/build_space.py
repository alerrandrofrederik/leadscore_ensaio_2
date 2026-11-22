"""Gera o corpo JSON do Genie Space "Lead Score · Agente Comercial" (RF-16, PRD 2.8).

Uso:
    python build_space.py > genie_space.json
    databricks genie create-space --json @genie_space.json --profile lead_score
"""
import json
import sys

CAT = "lh_leadscore_ensaio2"
WAREHOUSE_ID = "a50e6a998ebe9440"
LC, FD, FB = f"{CAT}.gold.leads_classificados", f"{CAT}.gold.fila_do_dia", f"{CAT}.gold.feedback_contatos"


def hid(prefix: int, n: int) -> str:
    """ID estável de 32 hex (o Genie exige ordenação por id)."""
    return f"{prefix:02x}{n:030x}"


PERGUNTAS = [
    (
        "Quantos leads de compra imediata chegaram hoje?",
        f"SELECT count(*) AS leads_compra_imediata FROM {LC} "
        f"WHERE intencao = 'compra_imediata' AND data_arquivo = (SELECT max(data_arquivo) FROM {LC})",
    ),
    (
        "Qual canal trouxe mais leads de compra imediata?",
        f"SELECT canal, count(*) AS leads_compra_imediata FROM {LC} "
        f"WHERE intencao = 'compra_imediata' AND data_arquivo = (SELECT max(data_arquivo) FROM {LC}) "
        f"GROUP BY canal ORDER BY leads_compra_imediata DESC",
    ),
    (
        "Quais leads citaram concorrente?",
        f"SELECT lead_id, nome, empresa, concorrente_citado, intencao, lead_score FROM {LC} "
        f"WHERE concorrente_citado IS NOT NULL ORDER BY lead_score DESC",
    ),
    (
        "Quantos leads da minha fila eu já contatei?",
        f"SELECT f.vendedor, count(*) AS leads_na_fila, count(DISTINCT fb.lead_id) AS contatados "
        f"FROM {FD} f LEFT JOIN {FB} fb ON f.lead_id = fb.lead_id "
        f"GROUP BY f.vendedor ORDER BY f.vendedor",
    ),
    (
        "Quais leads de compra imediata ficaram fora da fila de hoje?",
        f"SELECT c.lead_id, c.nome, c.empresa, c.canal, c.lead_score, c.motivo FROM {LC} c "
        f"LEFT ANTI JOIN {FD} f ON c.lead_id = f.lead_id "
        f"WHERE c.intencao = 'compra_imediata' AND c.data_arquivo = (SELECT max(data_arquivo) FROM {LC}) "
        f"ORDER BY c.lead_score DESC",
    ),
]

INSTRUCOES = [
    "Você é o agente comercial da Atlas Software. Responda sempre em português do Brasil, de forma curta e direta.",
    "Tabelas: leads_classificados tem TODOS os leads únicos (1 por e-mail) com intenção, entidades extraídas pela IA e lead_score; "
    "fila_do_dia tem os 20 leads priorizados do dia (5 por vendedor); feedback_contatos tem os contatos marcados pelos vendedores no app.",
    "'Hoje' ou 'do dia' = data_arquivo = max(data_arquivo) em leads_classificados (ou a coluna data em fila_do_dia). Não use current_date().",
    "Intenções possíveis (coluna intencao): compra_imediata, avaliando, suporte, spam. 'Leads quentes' = compra_imediata.",
    "'Ficaram fora da fila' = leads de compra_imediata do dia que NÃO aparecem em fila_do_dia (LEFT ANTI JOIN por lead_id).",
    "'Contatado' = o lead_id existe em feedback_contatos. Se o usuário disser 'minha fila' sem dizer o vendedor, mostre o resultado por vendedor.",
    "Vendedores: Ana Ribeiro, Bruno Carvalho, Carla Mendes e Diego Rocha.",
    "lead_score vai de 0 a 100 = 0,50 x intenção + 0,25 x perfil + 0,15 x sinais + 0,10 x recência; os componentes estão em score_componentes.",
    "Canais (coluna canal): site, linkedin, indicacao, evento, google_ads.",
]

COLUNAS_CATEGORICAS = ["canal", "intencao", "porte", "produto", "vendedor", "concorrente_citado", "segmento", "uf"]


def tabela(identifier: str, colunas: list[str]) -> dict:
    cfgs = [{"column_name": c, "enable_entity_matching": True, "enable_format_assistance": True} for c in colunas]
    return {"identifier": identifier, "column_configs": sorted(cfgs, key=lambda c: c["column_name"])}


space = {
    "version": 2,
    "config": {
        "sample_questions": [{"id": hid(0x10, i), "question": [q]} for i, (q, _) in enumerate(PERGUNTAS, 1)],
    },
    "data_sources": {
        "tables": sorted(
            [
                tabela(FB, ["vendedor"]),
                tabela(FD, ["canal", "intencao", "porte", "produto", "vendedor"]),
                tabela(LC, COLUNAS_CATEGORICAS[:4] + COLUNAS_CATEGORICAS[5:]),
            ],
            key=lambda t: t["identifier"],
        )
    },
    "instructions": {
        "text_instructions": [{"id": hid(0x30, 1), "content": [l + "\n" for l in INSTRUCOES]}],
        "example_question_sqls": [
            {"id": hid(0x20, i), "question": [q], "sql": [s]} for i, (q, s) in enumerate(PERGUNTAS, 1)
        ],
    },
}

body = {
    "warehouse_id": WAREHOUSE_ID,
    "title": "Lead Score · Agente Comercial",
    "description": "Perguntas em português sobre os leads do dia, a Fila do Dia e os contatos (Atlas Software · dados sintéticos).",
    "serialized_space": json.dumps(space, ensure_ascii=False),
}
sys.stdout.reconfigure(encoding="utf-8")
print(json.dumps(body, ensure_ascii=False, indent=2))
