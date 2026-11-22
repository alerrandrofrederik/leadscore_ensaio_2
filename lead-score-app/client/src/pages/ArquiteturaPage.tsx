import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@databricks/appkit-ui/react';
import { ArrowRight, Layers } from 'lucide-react';
import { Cabecalho } from '../components/Cabecalho';

const ETAPAS = [
  { nome: 'CSVs do dia', detalhe: 'leads, empresas e histórico exportados pelos sistemas de origem', tabela: 'leads_AAAA-MM-DD.csv' },
  { nome: 'Volume raw', detalhe: 'porta de entrada governada pelo Unity Catalog', tabela: 'landing.raw' },
  { nome: 'Bronze', detalhe: 'Auto Loader: cada arquivo lido uma vez; datas inválidas em _rescued_data', tabela: 'bronze.leads_raw' },
  { nome: 'Silver', detalhe: 'e-mail e CNPJ normalizados, deduplicação, junção com empresa e histórico', tabela: 'silver.leads_enriquecidos' },
  { nome: 'Gold', detalhe: 'ai_classify + ai_extract (incremental) e Lead Score explicável', tabela: 'gold.leads_classificados' },
  { nome: 'Data App', detalhe: 'Fila do Dia, Visão do Gestor e Agente (Genie)', tabela: 'gold.fila_do_dia' },
];

const DECISOES = [
  ['CSV no Volume raw', 'Simples, reproduzível, sem dependência de rede'],
  ['Auto Loader em pipeline declarativo', 'Incremental e idempotente por padrão'],
  ['AI Functions no SQL', 'Governado, sem endpoint, fácil de explicar'],
  ['IA em streaming table', 'Só linhas novas chamam a IA: reprocessar custa 0'],
  ['Motivo e score por regra', 'Determinístico, auditável e validável com o negócio'],
  ['Databricks Apps + Genie', 'App e agente dentro do workspace, com a mesma governança'],
];

export function ArquiteturaPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <Cabecalho
        trilha="Plataforma → Da fonte à decisão"
        titulo="Da fonte à decisão"
        icone={<Layers className="h-8 w-8" aria-hidden />}
        descricao="Do CSV exportado pelo CRM até o card na mão do vendedor, tudo dentro do Databricks e governado pelo Unity Catalog (catálogo lh_leadscore_ensaio2)."
      />

      <div className="mb-10 flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {ETAPAS.map((e, i) => (
          <div key={e.nome} className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <Card className="h-full flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{e.nome}</CardTitle>
                <CardDescription className="font-mono text-[11px]">{e.tabela}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{e.detalhe}</CardContent>
            </Card>
            {i < ETAPAS.length - 1 && (
              <ArrowRight className="mx-auto h-5 w-5 shrink-0 rotate-90 text-muted-foreground lg:rotate-0" aria-hidden />
            )}
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-xl font-semibold text-foreground">Lead Score</h2>
      <Card className="mb-10">
        <CardContent className="space-y-3 pt-6">
          <p className="font-mono text-sm text-foreground">
            lead_score = 0,50 × intenção + 0,25 × perfil + 0,15 × sinais + 0,10 × recência
          </p>
          <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <li><b className="text-foreground">Intenção</b> (ai_classify): compra 100 · avaliando 40 · suporte/spam 0</li>
            <li><b className="text-foreground">Perfil</b>: porte grande 100 · médio 60 · pequeno 30 · +20 cross-sell</li>
            <li><b className="text-foreground">Sinais</b> (ai_extract): +40 orçamento · +30 prazo · +30 quantidade</li>
            <li><b className="text-foreground">Recência</b>: 100 no dia · 50 no dia seguinte · 0 após 3 dias</li>
          </ul>
          <p className="text-sm text-muted-foreground">Travas: spam → score 0 · suporte → fora da fila comercial.</p>
        </CardContent>
      </Card>

      <h2 className="mb-4 text-xl font-semibold text-foreground">Decisões de arquitetura</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DECISOES.map(([d, m]) => (
          <Card key={d}>
            <CardContent className="pt-5">
              <p className="font-semibold text-foreground">{d}</p>
              <p className="text-sm text-muted-foreground">{m}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
