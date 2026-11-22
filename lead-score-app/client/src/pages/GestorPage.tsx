import { useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  BarChart,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  useAnalyticsQuery,
} from '@databricks/appkit-ui/react';
import { sql } from '@databricks/appkit-ui/js';
import { ArrowRight, CircleCheck, Flame, Inbox, ListOrdered, Sparkles, Target } from 'lucide-react';
import { Cabecalho } from '../components/Cabecalho';
import { useVersao } from '../lib/versao';

function Kpi({
  titulo,
  valor,
  detalhe,
  fonte,
  icone,
  destaque,
}: {
  titulo: string;
  valor: ReactNode;
  detalhe: ReactNode;
  fonte: string;
  icone: ReactNode;
  destaque: string;
}) {
  return (
    <Card className={`border-l-4 ${destaque}`}>
      <CardContent className="flex h-full flex-col gap-2 pt-6">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-sm">{titulo}</span>
          {icone}
        </div>
        <span className="text-4xl font-bold tabular-nums text-foreground">{valor}</span>
        <span className="text-sm text-muted-foreground">{detalhe}</span>
        <span className="mt-auto pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {fonte}
        </span>
      </CardContent>
    </Card>
  );
}

export function GestorPage() {
  const navigate = useNavigate();
  const { versao } = useVersao();
  const params = useMemo(() => ({ v: sql.string(versao) }), [versao]);
  const kpis = useAnalyticsQuery('visao_kpis', params);
  const acuracia = useAnalyticsQuery('acuracia_ia');
  const k = kpis.data?.[0];
  const ac = acuracia.data?.[0];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <Cabecalho
        trilha={`Operação comercial · dia de referência ${k?.data_ref ?? '…'}`}
        titulo="Visão do Gestor"
      />

      {kpis.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Não foi possível carregar os indicadores</AlertTitle>
          <AlertDescription>{kpis.error}</AlertDescription>
        </Alert>
      )}

      <section className="mb-8 rounded-2xl bg-brand p-8 text-brand-foreground shadow-lg md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-80">
          {k ? `${k.recebidos} leads · 20 conversas · quais 20?` : '100 leads · 20 conversas · quais 20?'}
        </p>
        {kpis.loading || !k ? (
          <Skeleton className="mt-4 h-12 w-2/3 bg-brand-foreground/20" />
        ) : (
          <>
            <h2 className="mt-3 text-3xl font-bold md:text-5xl">
              {k.na_fila} leads na fila hoje · {k.compra_imediata} de compra imediata
            </h2>
            <p className="mt-4 max-w-3xl text-base opacity-90 md:text-lg">
              De <b>{k.recebidos}</b> leads recebidos, a IA classificou a intenção e extraiu produto, licenças, prazo e
              orçamento. A fila reúne as <b>{k.na_fila}</b> maiores notas; <b>{k.compra_fora_da_fila}</b> leads de compra
              imediata ficaram de fora por falta de capacidade e <b>{k.contatados}</b> já foram contatados.
            </p>
          </>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => navigate('/fila')}>
            Ver minha fila <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="border-brand-foreground/40 bg-transparent text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground"
            onClick={() => navigate('/agente')}
          >
            <Sparkles className="h-4 w-4" /> Perguntar ao agente
          </Button>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.loading || !k ? (
          Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)
        ) : (
          <>
            <Kpi
              titulo="Recebidos"
              valor={k.recebidos}
              detalhe={`${k.unicos} únicos após deduplicação`}
              fonte="bronze.leads_raw"
              icone={<Inbox className="h-4 w-4" />}
              destaque="border-l-chart-1"
            />
            <Kpi
              titulo="Classificados"
              valor={k.classificados}
              detalhe="ai_classify + regra de spam"
              fonte="gold.leads_ia"
              icone={<Sparkles className="h-4 w-4" />}
              destaque="border-l-chart-2"
            />
            <Kpi
              titulo="Na fila"
              valor={k.na_fila}
              detalhe="capacidade: 4 vendedores × 5"
              fonte="gold.fila_do_dia"
              icone={<ListOrdered className="h-4 w-4" />}
              destaque="border-l-success"
            />
            <Kpi
              titulo="Contatados"
              valor={k.contatados}
              detalhe={`de ${k.na_fila} leads na fila`}
              fonte="gold.feedback_contatos"
              icone={<CircleCheck className="h-4 w-4" />}
              destaque="border-l-muted-foreground"
            />
            <Kpi
              titulo="Compra imediata"
              valor={k.compra_imediata}
              detalhe={`${k.compra_fora_da_fila} ficaram fora da fila`}
              fonte="gold.leads_classificados"
              icone={<Flame className="h-4 w-4" />}
              destaque="border-l-destructive"
            />
            <Kpi
              titulo="Acurácia da IA"
              valor={acuracia.loading ? '…' : ac ? `${Math.round(Number(ac.acuracia_pct))}%` : '—'}
              detalhe="vs. gabarito · meta ≥ 85%"
              fonte="gabarito/intencao.csv"
              icone={<Target className="h-4 w-4" />}
              destaque="border-l-warning"
            />
          </>
        )}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Funil do dia</CardTitle>
            <CardDescription>
              Recebidos → únicos → intenção comercial → na fila → contatados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart queryKey="funil" parameters={params} xKey="etapa" yKey="leads" orientation="horizontal" height={340} />
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Intenção por canal</CardTitle>
            <CardDescription>Indicação e LinkedIn trazem compra; site traz suporte; Google Ads traz spam</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              queryKey="intencao_por_canal"
              xKey="canal"
              yKey={['compra_imediata', 'avaliando', 'suporte', 'spam']}
              stacked
              orientation="horizontal"
              colorPalette="categorical"
              height={340}
            />
          </CardContent>
        </Card>
      </section>

      <p className="mt-6 text-xs text-muted-foreground">
        Fonte: tabelas Gold de <code>lh_leadscore_ensaio2</code> no Unity Catalog · IA processada em{' '}
        {k?.processado_em ?? '…'}
      </p>
    </div>
  );
}
