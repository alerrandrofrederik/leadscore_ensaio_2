"""
Lead Score V3 · gerador de dados sintéticos
Gera os CSVs que serão enviados ao Volume /Volumes/lead_score/landing/raw/

Uso:  python gerar_csvs.py [--data AAAA-MM-DD] [--saida pasta]
A seed é fixa: a mesma data gera sempre os mesmos arquivos.
"""
import argparse, csv, random, os
from datetime import datetime, timedelta, date

SEED = 42
rnd = random.Random(SEED)

# ---------------------------------------------------------------- parâmetros
ap = argparse.ArgumentParser()
ap.add_argument("--data", default=date.today().isoformat(), help="dia da demo (AAAA-MM-DD)")
ap.add_argument("--saida", default="lead_score_dados")
args = ap.parse_args()
DIA = datetime.strptime(args.data, "%Y-%m-%d")
OUT = args.saida
for p in ["raw/leads", "raw/empresas", "raw/historico", "gabarito"]:
    os.makedirs(os.path.join(OUT, p), exist_ok=True)

PRODUTOS = ["Atlas Gestão", "Atlas BI", "Atlas Fiscal", "Atlas CRM", "Atlas Estoque"]
PRECO_LICENCA = {"Atlas Gestão": 180, "Atlas BI": 90, "Atlas Fiscal": 70, "Atlas CRM": 110, "Atlas Estoque": 80}
CONCORRENTES = ["OmniERP", "Nexus Gestão", "GestorPro", "DataPlan"]  # fictícios
SEGMENTOS = ["Indústria", "Varejo", "Logística", "Serviços", "Saúde", "Agronegócio", "Construção", "Alimentos", "Educação", "Tecnologia"]
UFS = ["SP", "SP", "SP", "RJ", "MG", "MG", "PR", "SC", "RS", "BA", "PE", "GO", "DF", "ES", "CE"]
NOMES = ["Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Felipe", "Gabriela", "Henrique", "Isabela", "João", "Karina", "Lucas",
         "Mariana", "Nicolas", "Olívia", "Paulo", "Rafaela", "Rodrigo", "Sabrina", "Thiago", "Vanessa", "Wagner", "Yasmin",
         "Leonardo", "Fernanda", "Gustavo", "Patrícia", "Marcelo", "Juliana", "Ricardo", "Camila", "André", "Letícia", "Diego"]
SOBRENOMES = ["Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa", "Almeida", "Ferreira", "Rodrigues", "Gomes",
              "Martins", "Araújo", "Barbosa", "Ribeiro", "Carvalho", "Rocha", "Mendes", "Nunes", "Cardoso", "Teixeira", "Moreira"]
CARGOS = ["Diretor Financeiro", "CFO", "Gerente de TI", "Controller", "Diretora de Operações", "CEO", "Gerente Administrativo",
          "Coordenadora Fiscal", "Head de Dados", "Gerente Comercial"]

# canal -> (campanha, peso por intenção [compra, avaliando, suporte, spam])
CANAIS = {
    "linkedin":   ("li_erp_q4",          [5, 2, 0.3, 0.5]),
    "indicacao":  ("",                    [5, 1.5, 0.3, 0.1]),
    "evento":     ("expo_gestao_2026",    [2, 3, 0.3, 0.2]),
    "google_ads": ("gads_bi_novembro",    [1, 4, 1, 3]),
    "site":       ("organico",            [1, 3, 4, 4]),
}

def sem_acento(s):
    tr = str.maketrans("áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ", "aaaaeeiooouc" + "AAAAEEIOOOUC")
    return s.translate(tr)

# ---------------------------------------------------------------- CNPJ
def dv_cnpj(base12):
    def calc(nums, pesos):
        s = sum(int(n) * p for n, p in zip(nums, pesos)); r = s % 11
        return "0" if r < 2 else str(11 - r)
    d1 = calc(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    d2 = calc(base12 + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
    return d1 + d2

def novo_cnpj():
    base = "".join(str(rnd.randint(0, 9)) for _ in range(8)) + "0001"
    return base + dv_cnpj(base)

def mascara(c):
    return f"{c[:2]}.{c[2:5]}.{c[5:8]}/{c[8:12]}-{c[12:]}"

def formato_aleatorio(c):
    r = rnd.random()
    if r < 0.45: return mascara(c)
    if r < 0.9:  return c
    return " " + mascara(c).replace("/", " / ") + " "   # sujo de propósito

def cnpj_invalido():
    c = novo_cnpj()
    return c[:-1] + str((int(c[-1]) + 3) % 10)

# ---------------------------------------------------------------- EMPRESAS
PREF = ["Grupo", "Indústrias", "Comercial", "Rede", "Transportes", "Laboratório", "Construtora", "Agro", "Distribuidora", "Colégio", "Tech"]
NUCLEO = ["Ferraz", "Horizonte", "Vale Verde", "Alvorada", "Pioneira", "Santa Clara", "Boa Vista", "Atlântico", "Serra Azul",
          "Nova Era", "Bandeirantes", "Monte Alto", "Rio Claro", "Primavera", "Estrela", "Cristal", "Delta", "Aurora", "Itapuã",
          "Paraná", "Mirante", "Cordilheira", "Ipê", "Jequitibá", "Litoral", "Planalto", "Sertão", "Capital", "Uirapuru", "Tropical"]
SUF = ["S.A.", "Ltda", "Ltda", "Ltda", "EIRELI", "S.A."]

empresas = []
nomes_usados = set()
while len(empresas) < 120:
    nome = f"{rnd.choice(PREF)} {rnd.choice(NUCLEO)}"
    if nome in nomes_usados: continue
    nomes_usados.add(nome)
    porte = rnd.choices(["grande", "médio", "pequeno"], [25, 35, 40])[0]
    func = {"grande": rnd.randint(500, 8000), "médio": rnd.randint(100, 499), "pequeno": rnd.randint(5, 99)}[porte]
    empresas.append(dict(cnpj=novo_cnpj(), razao_social=f"{nome} {rnd.choice(SUF)}", porte=porte,
                         segmento=rnd.choice(SEGMENTOS), num_funcionarios=func, uf=rnd.choice(UFS)))

# empresa da mensagem herói (fixa)
HEROI = dict(cnpj="", razao_social="Metalúrgica Bandeirantes S.A.", porte="grande", segmento="Indústria",
             num_funcionarios=2300, uf="SP")
b = "33419827" + "0001"; HEROI["cnpj"] = b + dv_cnpj(b)
empresas.append(HEROI)

grandes_medias = [e for e in empresas if e["porte"] in ("grande", "médio") and e is not HEROI]
todas = [e for e in empresas if e is not HEROI]

# ---------------------------------------------------------------- HISTÓRICO DE OPORTUNIDADES
clientes = rnd.sample(todas, 38) + [HEROI]          # empresas com ao menos 1 venda ganha
oportunidades = []
op_id = 1
def add_op(emp, produto, status, quando):
    global op_id
    usuarios = {"grande": rnd.randint(50, 400), "médio": rnd.randint(15, 80), "pequeno": rnd.randint(3, 15)}[emp["porte"]]
    oportunidades.append(dict(oportunidade_id=f"OP{op_id:05d}", cnpj=emp["cnpj"], produto=produto, status=status,
                              valor=round(usuarios * PRECO_LICENCA[produto] * 12, 2), data=quando.date().isoformat()))
    op_id += 1

for emp in clientes:
    prods = rnd.sample(PRODUTOS, rnd.choice([1, 1, 2]))
    if emp is HEROI: prods = ["Atlas BI"]
    for p in prods:
        add_op(emp, p, "ganha", DIA - timedelta(days=rnd.randint(60, 900)))
for emp in rnd.sample(todas, 70):                  # perdidas e abertas
    add_op(emp, rnd.choice(PRODUTOS), rnd.choices(["perdida", "aberta"], [75, 25])[0],
           DIA - timedelta(days=rnd.randint(5, 700)))
rnd.shuffle(oportunidades)

# ---------------------------------------------------------------- MENSAGENS
PRAZOS = ["dezembro", "janeiro", "até o fim do mês", "ainda este trimestre", "em 30 dias", "até março"]

def msg_compra():
    prod = rnd.choice(PRODUTOS)
    qtd = rnd.choice([None, rnd.choice([10, 15, 20, 30, 40, 50, 60, 80, 100, 150])])
    prazo = rnd.choice([None, rnd.choice(PRAZOS)])
    orc = rnd.random() < 0.4
    cargo = rnd.choice([None, None, rnd.choice(CARGOS)])
    conc = rnd.choice([None, None, None, rnd.choice(CONCORRENTES)])
    partes = []
    if cargo: partes.append(f"Sou {cargo}.")
    abre = rnd.choice(["Precisamos contratar o {p}", "Queremos fechar o {p}", "Gostaria de uma proposta comercial do {p}",
                       "Temos interesse em adquirir o {p}", "Quero cotar o {p}"]).format(p=prod)
    if qtd: abre += rnd.choice([f" para {qtd} usuários", f" com {qtd} licenças", f" ({qtd} usuários)"])
    if prazo: abre += f", com implantação {prazo}" if prazo.startswith(("até", "em", "ainda")) else f" até {prazo}"
    partes.append(abre + ".")
    if orc: partes.append(rnd.choice(["O orçamento já está aprovado.", "Budget aprovado pela diretoria.", "Já temos verba aprovada para isso."]))
    if conc: partes.append(f"Hoje usamos o {conc} e queremos migrar.")
    partes.append(rnd.choice(["Podem me ligar?", "Qual o valor?", "Podemos agendar uma reunião esta semana?", "Aguardo contato do comercial.", "Me enviem a proposta, por favor."]))
    ent = dict(produto=prod, qtd_licencas=qtd or "", prazo=prazo or "", orcamento_aprovado=str(orc).lower(),
               cargo=cargo or "", concorrente_citado=conc or "")
    return " ".join(partes), ent

AVALIANDO = [
    "Olá, gostaria de conhecer melhor o {p}. Vocês têm algum material?",
    "Estamos começando a pesquisar sistemas de {area}. Como funciona o {p}?",
    "Vi o anúncio do {p}. Tem período de teste gratuito?",
    "Queria entender as diferenças entre o {p} e o {p2}.",
    "Podem me mandar um vídeo de demonstração do {p}?",
    "Estamos avaliando opções para o ano que vem, ainda sem data. O {p} integra com planilhas?",
    "Quais módulos o {p} tem? Só queria ter uma ideia geral.",
    "Vocês atendem empresas do segmento de {seg}? Estou levantando fornecedores.",
    "Baixei o e-book de vocês e fiquei curioso sobre o {p}.",
    "Estou comparando o {p} com o {c}. Quais as principais vantagens?",
    "Tem algum webinar sobre o {p} nos próximos dias?",
    "Gostaria de saber se o {p} roda em nuvem. Ainda estamos no começo da pesquisa.",
]
AREAS = {"Atlas Gestão": "gestão", "Atlas BI": "BI", "Atlas Fiscal": "área fiscal", "Atlas CRM": "CRM", "Atlas Estoque": "estoque"}

def msg_avaliando():
    p, p2 = rnd.sample(PRODUTOS, 2)
    return rnd.choice(AVALIANDO).format(p=p, p2=p2, area=AREAS[p], seg=rnd.choice(SEGMENTOS).lower(), c=rnd.choice(CONCORRENTES))

SUPORTE = [
    "O {p} não está gerando o relatório mensal desde ontem. Podem ajudar?",
    "Não consigo acessar o {p}, aparece erro de senha inválida.",
    "Como faço para cadastrar um novo usuário no {p}?",
    "A nota fiscal não está sendo emitida no {p}, dá erro 500.",
    "Somos clientes e o {p} está muito lento hoje.",
    "Preciso da segunda via do boleto da assinatura do {p}.",
    "A integração do {p} com o banco parou de funcionar.",
    "Como exporto os dados do {p} para Excel?",
    "O dashboard do {p} não atualiza desde segunda-feira.",
    "Esqueci meu login do {p}, como recupero?",
]
def msg_suporte():
    return rnd.choice(SUPORTE).format(p=rnd.choice(PRODUTOS))

SPAM = [
    "Aumente suas vendas com nossa lista de 50 mil e-mails qualificados! Responda já.",
    "Oferecemos serviço de SEO e backlinks para o site de vocês.",
    "Parabéns, você foi selecionado para receber um prêmio. Clique no link.",
    "Somos uma agência de marketing digital e queremos apresentar nosso portfólio.",
    "Compro e vendo criptomoedas com a melhor taxa do mercado.",
    "Vaga de emprego? Envio meu currículo em anexo.",
    "Gostaria de anunciar no blog de vocês, qual o valor do post patrocinado?",
    "Empréstimo rápido sem consulta, fale no WhatsApp.",
    "lorem ipsum dolor sit amet",
    "Olá, tudo bem? kkkkk",
]
SPAM_CURTO = ["teste", "", "ok"]
def msg_spam():
    return rnd.choice(SPAM)

# ---------------------------------------------------------------- LEADS DO DIA
EMAILS_USADOS = {"roberto.almeida@metalurgicabandeirantes.com.br"}
def pessoa(empresa=None, pessoal=False):
  while True:
    n, s = rnd.choice(NOMES), rnd.choice(SOBRENOMES)
    if pessoal or empresa is None:
        dom = rnd.choice(["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br"])
    else:
        nucleo = sem_acento(empresa["razao_social"].split()[1]).lower().replace(" ", "")
        dom = f"{nucleo}.com.br"
    email = f"{sem_acento(n).lower()}.{sem_acento(s).lower()}@{dom}"
    if email in EMAILS_USADOS: continue
    EMAILS_USADOS.add(email)
    tel = f"({rnd.choice([11, 21, 31, 41, 47, 51, 61, 71, 81])}) 9{rnd.randint(1000, 9999)}-{rnd.randint(1000, 9999)}"
    return f"{n} {s}", email, tel

def horario(ini=7, fim=19):
    return DIA + timedelta(hours=rnd.randint(ini, fim - 1), minutes=rnd.randint(0, 59), seconds=rnd.randint(0, 59))

def canal_para(intencao):
    idx = ["compra_imediata", "avaliando", "suporte", "spam"].index(intencao)
    nomes = list(CANAIS); pesos = [CANAIS[c][1][idx] for c in nomes]
    c = rnd.choices(nomes, pesos)[0]
    return c, CANAIS[c][0]

leads, gabarito, gab_ent = [], [], []

def add_lead(intencao, mensagem, empresa=None, cnpj_txt=None, pessoal=False, quando=None, pegadinha="", obs="",
             entidades=None, nome=None, email=None, tel=None, canal=None):
    if nome is None: nome, email, tel = pessoa(empresa, pessoal)
    if cnpj_txt is None: cnpj_txt = formato_aleatorio(empresa["cnpj"]) if empresa else ""
    c, camp = canal if canal else canal_para(intencao)
    row = dict(nome=nome, email=email, telefone=tel, cnpj=cnpj_txt, canal=c, campanha=camp,
               mensagem=mensagem, recebido_em=(quando or horario()).strftime("%Y-%m-%d %H:%M:%S"))
    leads.append(row)
    gabarito.append(dict(row=row, intencao_esperada=intencao, pegadinha=pegadinha, observacao=obs))
    if entidades: gab_ent.append(dict(row=row, **entidades))
    return row

# --- 1. mensagem herói: chega tarde (17h48), iria para o fim da fila por ordem de chegada
heroi_msg = ("Boa tarde, sou Diretor Financeiro da Metalúrgica Bandeirantes. Precisamos de 200 licenças do Atlas Gestão "
             "até dezembro, o orçamento já está aprovado. Hoje usamos o OmniERP e queremos migrar. Podemos agendar uma reunião?")
add_lead("compra_imediata", heroi_msg, HEROI, cnpj_txt=mascara(HEROI["cnpj"]),
         nome="Roberto Almeida", email="roberto.almeida@metalurgicabandeirantes.com.br", tel="(11) 98765-4321",
         quando=DIA.replace(hour=17, minute=48, second=12), canal=("linkedin", "li_erp_q4"),
         obs="MENSAGEM HERÓI (CA-06): chega às 17h48 e deve ir para o topo da fila",
         entidades=dict(produto="Atlas Gestão", qtd_licencas=200, prazo="dezembro", orcamento_aprovado="true",
                        cargo="Diretor Financeiro", concorrente_citado="OmniERP"))

# --- 2. pegadinhas (CA-05)
cli = [e for e in clientes if e is not HEROI]
p1 = rnd.choice(cli)
add_lead("suporte", "Não tenho interesse em comprar nada agora, só preciso saber por que o Atlas Fiscal não gera o SPED desde ontem. Somos clientes há 3 anos.",
         p1, pegadinha="P1", obs="Cita 'comprar', mas é suporte")
add_lead("spam", "URGENTE!!! Proposta imperdível: pacote de backlinks e SEO com preço promocional só hoje. Responda para receber o orçamento.",
         pessoal=True, pegadinha="P2", obs="Tem 'urgente', 'proposta', 'preço' e 'orçamento', mas é spam")
p3 = rnd.choice([e for e in cli if e["porte"] != "pequeno"])
add_lead("compra_imediata", "Somos clientes do Atlas Fiscal e queremos contratar também o Atlas BI para 80 usuários ainda este trimestre. Podem enviar a proposta?",
         p3, pegadinha="P3", obs="Diz 'somos clientes', mas é compra (cross-sell)",
         entidades=dict(produto="Atlas BI", qtd_licencas=80, prazo="ainda este trimestre", orcamento_aprovado="false", cargo="", concorrente_citado=""))
add_lead("avaliando", "Vi a demo de vocês no evento semana passada e achei bem interessante, mas só devemos olhar isso com calma no ano que vem.",
         rnd.choice(todas), canal=("evento", "expo_gestao_2026"), pegadinha="P4", obs="Fala de demo e evento, mas sem urgência")
p5 = rnd.choice(grandes_medias)
add_lead("compra_imediata", "Hi, we need 120 licenses of Atlas Gestão for our Brazilian subsidiary by January. Budget is already approved. Who can send us a quote?",
         p5, pegadinha="P5", obs="Mensagem em inglês",
         entidades=dict(produto="Atlas Gestão", qtd_licencas=120, prazo="janeiro", orcamento_aprovado="true", cargo="", concorrente_citado=""))

# --- 3. volume do dia (total único = 96)
ALVO = {"compra_imediata": 25, "avaliando": 37, "suporte": 16, "spam": 18}
contagem = {k: sum(1 for g in gabarito if g["intencao_esperada"] == k) for k in ALVO}

invalidos_restantes = 2
for _ in range(ALVO["compra_imediata"] - contagem["compra_imediata"]):
    emp = rnd.choice(grandes_medias if rnd.random() < 0.7 else todas)
    m, ent = msg_compra()
    cnpj_txt = None
    if invalidos_restantes and rnd.random() < 0.15:
        cnpj_txt = mascara(cnpj_invalido()); invalidos_restantes -= 1
    add_lead("compra_imediata", m, emp, cnpj_txt=cnpj_txt, entidades=ent)

for _ in range(ALVO["avaliando"] - contagem["avaliando"]):
    if rnd.random() < 0.6:
        emp = rnd.choice(todas); cnpj_txt = None
        if invalidos_restantes and rnd.random() < 0.05:
            cnpj_txt = cnpj_invalido(); invalidos_restantes -= 1
        add_lead("avaliando", msg_avaliando(), emp, cnpj_txt=cnpj_txt)
    else:
        add_lead("avaliando", msg_avaliando(), pessoal=True)

while invalidos_restantes:                         # garante exatamente 2 CNPJs inválidos
    g = rnd.choice([g for g in gabarito if g["intencao_esperada"] == "avaliando" and g["row"]["cnpj"] and not g["pegadinha"]])
    g["row"]["cnpj"] = mascara(cnpj_invalido()); invalidos_restantes -= 1

for _ in range(ALVO["suporte"] - contagem["suporte"]):
    add_lead("suporte", msg_suporte(), rnd.choice(cli))

n_spam = ALVO["spam"] - contagem["spam"]
for i in range(n_spam):
    if i < len(SPAM_CURTO):
        add_lead("spam", SPAM_CURTO[i], pessoal=True, obs="Menos de 5 caracteres: vira spam sem chamar a IA")
    else:
        add_lead("spam", msg_spam(), pessoal=True)

# --- 4. duplicados (+4 linhas → 100)
# 4a. reenvios com e-mail em outra caixa/espaços (3). Um deles evolui de 'avaliando' para 'compra_imediata'.
base_aval = [g for g in gabarito if g["intencao_esperada"] == "avaliando" and not g["pegadinha"] and g["row"]["cnpj"]]
upgrade = rnd.choice(base_aval)
r0 = upgrade["row"]; t0 = datetime.strptime(r0["recebido_em"], "%Y-%m-%d %H:%M:%S")
if t0.hour > 15: r0["recebido_em"] = t0.replace(hour=9).strftime("%Y-%m-%d %H:%M:%S"); t0 = t0.replace(hour=9)
emp_up = next(e for e in empresas if e["cnpj"] == "".join(ch for ch in r0["cnpj"] if ch.isdigit())) if any(
    e["cnpj"] == "".join(ch for ch in r0["cnpj"] if ch.isdigit()) for e in empresas) else None
m_up = "Conversei com a diretoria e aprovamos o orçamento. Queremos fechar o Atlas CRM para 40 usuários em 30 dias. Podem me ligar hoje?"
add_lead("compra_imediata", m_up, emp_up, cnpj_txt=r0["cnpj"], nome=r0["nome"], email="  " + r0["email"].upper() + " ",
         tel=r0["telefone"], quando=t0 + timedelta(hours=5, minutes=12), canal=(r0["canal"], r0["campanha"]),
         obs=f"REENVIO do mesmo e-mail: a mensagem mais recente (compra) deve sobreviver à deduplicação",
         entidades=dict(produto="Atlas CRM", qtd_licencas=40, prazo="em 30 dias", orcamento_aprovado="true", cargo="", concorrente_citado=""))
for g in rnd.sample([g for g in gabarito if g is not upgrade and not g["pegadinha"] and g["row"]["mensagem"]
                     and g["intencao_esperada"] in ("avaliando", "suporte") and "HERÓI" not in g["observacao"]], 2):
    r = g["row"]; t = datetime.strptime(r["recebido_em"], "%Y-%m-%d %H:%M:%S")
    variante = r["email"].capitalize() if rnd.random() < 0.5 else r["email"] + " "
    add_lead(g["intencao_esperada"], r["mensagem"] + " (reenviando, não tive retorno)", None, cnpj_txt=r["cnpj"],
             nome=r["nome"], email=variante, tel=r["telefone"], quando=min(t + timedelta(minutes=rnd.randint(40, 200)), DIA.replace(hour=23, minute=59)),
             canal=(r["canal"], r["campanha"]), obs="REENVIO: mesmo e-mail com caixa/espaço diferente")

# 4b. duplo clique: mesma mensagem e e-mail com segundos de diferença (1)
for g in rnd.sample([g for g in gabarito if g["intencao_esperada"] in ("compra_imediata", "avaliando") and not g["pegadinha"]
                     and "REENVIO" not in g["observacao"] and "HERÓI" not in g["observacao"]], 1):
    r = g["row"]; t = datetime.strptime(r["recebido_em"], "%Y-%m-%d %H:%M:%S")
    add_lead(g["intencao_esperada"], r["mensagem"], None, cnpj_txt=r["cnpj"], nome=r["nome"], email=r["email"],
             tel=r["telefone"], quando=t + timedelta(seconds=rnd.randint(2, 9)), canal=(r["canal"], r["campanha"]),
             obs="DUPLO CLIQUE: envio idêntico segundos depois",
             entidades={k: v for k, v in next((e for e in gab_ent if e["row"] is r), {}).items() if k != "row"} or None)

# --- 5. ordena por horário, atribui IDs, injeta 2 linhas com data malformada (CA-02)
leads.sort(key=lambda r: r["recebido_em"])
ymd = DIA.strftime("%Y%m%d")
for i, r in enumerate(leads, 1):
    r["lead_id"] = f"L{ymd}-{i:04d}"
obs_livre = {id(g["row"]) for g in gabarito if not g["observacao"] and not g["pegadinha"]}
mal = rnd.sample([r for r in leads if id(r) in obs_livre], 2)
for r, v in zip(mal, ["ontem à tarde", "17/13/2026 25:61"]):
    r["recebido_em"] = v
    next(g for g in gabarito if g["row"] is r)["observacao"] = "DATA MALFORMADA: deve cair em _rescued_data"

assert len(leads) == 100, len(leads)

# ---------------------------------------------------------------- ESCRITA
COLS_LEADS = ["lead_id", "nome", "email", "telefone", "cnpj", "canal", "campanha", "mensagem", "recebido_em"]
def escreve(caminho, cols, linhas):
    with open(os.path.join(OUT, caminho), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, quoting=csv.QUOTE_MINIMAL); w.writeheader()
        for l in linhas: w.writerow({c: l.get(c, "") for c in cols})

escreve(f"raw/leads/leads_{args.data}.csv", COLS_LEADS, leads)
escreve(f"raw/empresas/empresas_{args.data}.csv",
        ["cnpj", "razao_social", "porte", "segmento", "num_funcionarios", "uf"],
        [dict(e, cnpj=(mascara(e["cnpj"]) if rnd.random() < 0.3 else e["cnpj"])) for e in empresas])
escreve(f"raw/historico/oportunidades_{args.data}.csv",
        ["oportunidade_id", "cnpj", "produto", "status", "valor", "data"], oportunidades)
escreve("gabarito/intencao.csv", ["lead_id", "email", "intencao_esperada", "pegadinha", "observacao"],
        [dict(lead_id=g["row"]["lead_id"], email=g["row"]["email"].strip().lower(), intencao_esperada=g["intencao_esperada"],
              pegadinha=g["pegadinha"], observacao=g["observacao"]) for g in sorted(gabarito, key=lambda g: g["row"]["lead_id"])])
escreve("gabarito/entidades.csv", ["lead_id", "produto", "qtd_licencas", "prazo", "orcamento_aprovado", "cargo", "concorrente_citado"],
        [dict(e, lead_id=e["row"]["lead_id"]) for e in sorted(gab_ent, key=lambda e: e["row"]["lead_id"])])

print(f"OK · {len(leads)} leads · {len(empresas)} empresas · {len(oportunidades)} oportunidades → {OUT}/")
