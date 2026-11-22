# Lead Score V3 · dados sintéticos

Gerados por `gerar_csvs.py` (seed 42, data de referência 2026-11-22). Para o dia do workshop:
`python gerar_csvs.py --data AAAA-MM-DD` (mesma estrutura, datas e nomes de arquivo atualizados).

## Onde subir
| Pasta local | Destino no Volume | Quando |
|---|---|---|
| `raw/empresas/` | `/Volumes/lh_leadscore_ensaio2/landing/raw/empresas/` | antes da demo |
| `raw/historico/` | `/Volumes/lh_leadscore_ensaio2/landing/raw/historico/` | antes da demo |
| `raw/leads/` | `/Volumes/lh_leadscore_ensaio2/landing/raw/leads/` | **ao vivo** |
| `gabarito/` | fora do `raw` (ex.: `/Volumes/lh_leadscore_ensaio2/landing/gabarito/`) | antes da demo |

## leads_2026-11-22.csv (100 linhas → 96 leads únicos)
- Após deduplicação: 26 compra_imediata · 36 avaliando · 16 suporte · 18 spam → **6 compras ficam fora da fila de 20**.
- **Mensagem herói** `L20261122-0089`: 200 licenças do Atlas Gestão até dezembro, orçamento aprovado, chega às 17h48.
- **Pegadinhas P1–P5** (coluna `pegadinha` do gabarito).
- Duplicados: 2 reenvios com e-mail em outra caixa/espaços, 1 reenvio que evolui para compra (`L20261122-0064` deve sobreviver), 1 duplo clique.
- CNPJ com/sem máscara e com espaços; 38 vazios; **2 inválidos**.
- **2 datas malformadas** em `recebido_em` (use schema hint `recebido_em TIMESTAMP`).
- 3 mensagens com menos de 5 caracteres.

## Outros
- `empresas_*.csv`: 121 empresas · `oportunidades_*.csv`: 119 oportunidades.
- `gabarito/intencao.csv`: intenção esperada por linha · `gabarito/entidades.csv`: entidades esperadas das mensagens de compra.

Empresas, pessoas, concorrentes e CNPJs são fictícios.
