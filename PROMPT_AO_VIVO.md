# Prompt da demo ao vivo

## Checklist antes de subir no palco (T-30 min)
1. `git switch ao-vivo`: branch só com `PRD_v3_lead_score.md`, `CLAUDE.md`, `data/`, `app_referencia/`, `scripts/` e `.claude/`, **sem** `lh_leadscore_ensaio2/src`, `resources` nem `lead-score-app/`. A implementação de referência fica na branch `ensaio-2`.
2. `bash scripts/reset_demo.sh --sim` (só se houve ensaio depois do último reset).
3. `bash scripts/preflight.sh` → precisa terminar em **PRE-FLIGHT OK**.
4. Abrir o Claude Code na raiz do repositório em **auto mode** (sem plan mode), com o terminal em fonte grande.
5. Deixar abertas: aba do Catalog Explorer em `lh_leadscore_ensaio2`, aba da página do pipeline e o arquivo `data/raw/leads/leads_2026-11-22.csv`.

## Prompt (copiar e colar)

```
Implemente o PRD_v3_lead_score.md do zero até o Data App no ar, seguindo o CLAUDE.md à risca:
decisões fixas, ordem de execução, receitas e armadilhas. Não faça perguntas e não leia skills
nem docs do AppKit: tudo o que você precisa está no CLAUDE.md. Rode em background os comandos
longos (pipeline e deploy do app) e trabalhe no próximo passo enquanto isso. Antes de subir o
CSV de leads, avise em uma linha "Agora o CSV do dia chega" e pare só para eu dizer "pode subir".
No fim, mostre o resultado do validacao.sql e a URL do app.
```

## Marcos para cronometrar (alvo)
| Marco | Alvo |
|---|---|
| Bundle + pipeline escritos e `bundle deploy` OK | 5 min |
| CSV no Volume e pipeline disparado | 6 min |
| Pipeline concluído | 9 min |
| `validacao.sql` todo verde + Genie Space criado | 10 min |
| `apps validate` OK | 16 min |
| App RUNNING com o código novo | 19 min |
| Herói em #1, "Contatado" gravado e agente respondendo | 20 min |
