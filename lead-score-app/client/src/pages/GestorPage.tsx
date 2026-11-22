import { useNavigate } from 'react-router';
import {
  useAnalyticsQuery,
  BarChart,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@databricks/appkit-ui/react';
import { sql } from '@databricks/appkit-ui/js';
import { ArrowRight, CheckCircle2, Flame, Inbox, ListOrdered, Sparkles, Target } from 'lucide-react';
import type { ReactNode } from 'react';
import { num, txt, useVersao } from '../lib/dados';
import { Cabecalho, Erro } from './Cabecalho';

function Kpi({ titulo, valor, detalhe, fonte, icone, cor }: { titulo: string; valor: ReactNode; detalhe: string; fonte: string; icone: ReactNode; cor: string }) {
  return (
    <Card className={`border-l-4 ${cor}`}>
      <CardContent className="pt-6 space-y-2">
        <div className="flex items-center justify-between text-muted-foreground text-sm">
          {titulo}
          {icone}
        </div>
        <div className="text-4xl font-bold text-foreground">{valor}</div>
        <div className="text-xs text-muted-foreground min-h-8">{detalhe}</div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{fonte}</div>
      </CardContent>
    </Card>
  );
}

export function GestorPage() {
  const navigate = useNavigate();
  const { versao } = useVersao();
  const kpis = useAnalyticsQuery('kpis', { v: sql.string(versao) });
  const funil = useAnalyticsQuery('funil', { v: sql.string(versao) });
  const canal = useAnalyticsQuery('intencao_canal', {});

  const k = kpis.data?.[0];
  const recebidos = num(k?.recebidos);
  const naFila = num(k?.na_fila);
  const compra = num(k?.compra_imediata);
  const fora = num(k?.compra_fora_fila);
  const contatados = num(k?.contatados);

  const dadosFunil = (funil.data ?? []).map((r) => ({ etapa: txt(r.etapa), leads: num(r.leads) }));
  const dadosCanal = (canal.data ?? []).map((r) => ({
    canal: txt(r.canal),
    compra_imediata: num(r.compra_imediata),
    avaliando: num(r.avaliando),
    suporte: num(r.suporte),
    spam: num(r.spam),
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <Cabecalho trilha={`Operação comercial · dia de referência ${txt(k?.data_fila) || '…'}`} titulo="Visão do Gestor" />

      {kpis.error && <Erro mensagem={String(kpis.error)} />}

      <div className="rounded-2xl bg-brand text-white p-8 md:p-10 space-y-4 shadow-lg">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] opacity-80">
          {recebidos || 100} leads · 20 conversas · quais 20?
        </div>
        {kpis.loading ? (
          <Skeleton className="h-10 w-2/3" />
        ) : (
          <h2 className="text-3xl md:text-4xl font-bold">
            {naFila} leads na fila hoje · {compra} de compra imediata
          </h2>
        )}
        <p className="max-w-3xl text-white/90 leading-relaxed">
          De <b>{recebidos}</b> leads recebidos, a IA classificou a intenção e extraiu produto, licenças, prazo e orçamento.
          A fila reúne as <b>{naFila}</b> maiores notas; <b>{fora}</b> leads de compra imediata ficaram de fora por falta de
          capacidade e <b>{contatados}</b> já foram contatados.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button variant="secondary" onClick={() => navigate('/fila')}>
            Ver minha fila <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="bg-white/10 border-white/40 text-white hover:bg-white/20" onClick={() => navigate('/agente')}>
            <Sparkles className="h-4 w-4" /> Perguntar ao agente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Kpi titulo="Recebidos" valor={recebidos} detalhe={`${num(k?.unicos)} únicos após deduplicação`} fonte="bronze.leads_raw" icone={<Inbox className="h-4 w-4" />} cor="border-l-brand" />
        <Kpi titulo="Classificados" valor={num(k?.classificados)} detalhe="ai_classify + regra de spam" fonte="gold.leads_ia" icone={<Sparkles className="h-4 w-4" />} cor="border-l-chart-2" />
        <Kpi titulo="Na fila" valor={naFila} detalhe="capacidade: 4 vendedores × 5" fonte="gold.fila_do_dia" icone={<ListOrdered className="h-4 w-4" />} cor="border-l-success" />
        <Kpi titulo="Contatados" valor={contatados} detalhe={`de ${naFila} leads na fila`} fonte="gold.feedback_contatos" icone={<CheckCircle2 className="h-4 w-4" />} cor="border-l-muted-foreground" />
        <Kpi titulo="Compra imediata" valor={compra} detalhe={`${fora} ficaram fora da fila`} fonte="gold.leads_classificados" icone={<Flame className="h-4 w-4" />} cor="border-l-destructive" />
        <Kpi titulo="Acurácia da IA" valor={`${num(k?.acuracia_ia)}%`} detalhe="vs. gabarito · meta ≥ 85%" fonte="gabarito/intencao.csv" icone={<Target className="h-4 w-4" />} cor="border-l-warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Funil do dia</CardTitle>
          </CardHeader>
          <CardContent>
            {funil.loading ? (
              <Skeleton className="h-64 w-full" />
            ) : funil.error ? (
              <Erro mensagem={String(funil.error)} />
            ) : (
              <BarChart data={dadosFunil} xKey="etapa" yKey="leads" orientation="horizontal" height={300} />
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Intenção por canal</CardTitle>
          </CardHeader>
          <CardContent>
            {canal.loading ? (
              <Skeleton className="h-64 w-full" />
            ) : canal.error ? (
              <Erro mensagem={String(canal.error)} />
            ) : (
              <BarChart
                data={dadosCanal}
                xKey="canal"
                yKey={['compra_imediata', 'avaliando', 'suporte', 'spam']}
                stacked
                showLegend
                height={300}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
