import { useMemo, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  Label,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  useAnalyticsQuery,
} from '@databricks/appkit-ui/react';
import { sql } from '@databricks/appkit-ui/js';
import { Building2, Check, ListOrdered, Loader2, PhoneCall, Quote } from 'lucide-react';
import { Cabecalho } from '../components/Cabecalho';
import { useVersao } from '../lib/versao';

const TODOS = 'todos';

const INTENCAO: Record<string, string> = {
  compra_imediata: 'Compra imediata',
  avaliando: 'Avaliando',
  suporte: 'Suporte',
  spam: 'Spam',
};

const CANAL: Record<string, string> = {
  indicacao: 'indicação',
  linkedin: 'LinkedIn',
  evento: 'evento',
  google_ads: 'Google Ads',
  site: 'site',
};

type Lead = {
  posicao: number;
  vendedor: string;
  lead_id: string;
  nome: string;
  empresa: string | null;
  porte: string | null;
  cargo: string | null;
  canal: string;
  telefone: string | null;
  intencao: string;
  lead_score: number;
  c_intencao: number;
  c_perfil: number;
  c_sinais: number;
  c_recencia: number;
  motivo: string | null;
  proximo_passo: string;
  produto: string | null;
  qtd_licencas: number | null;
  prazo: string | null;
  orcamento_aprovado: boolean | null;
  concorrente_citado: string | null;
  mensagem: string;
  contatado: boolean;
};

function comoBooleano(v: unknown): boolean {
  return v === true || v === 'true';
}

function Componente({ nome, peso, valor }: { nome: string; peso: string; valor: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">
          {nome} <span className="opacity-70">({peso})</span>
        </span>
        <span className="font-semibold tabular-nums">{valor}</span>
      </div>
      <Progress value={valor} aria-label={`${nome}: ${valor} de 100`} />
    </div>
  );
}

function Chip({ rotulo, valor }: { rotulo: string; valor: string | number | null | undefined }) {
  if (valor === null || valor === undefined || valor === '') return null;
  return (
    <span className="rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
      {rotulo}: <b className="text-foreground">{valor}</b>
    </span>
  );
}

function CardLead({
  lead,
  enviando,
  onContatar,
}: {
  lead: Lead;
  enviando: boolean;
  onContatar: (lead: Lead) => void;
}) {
  const compra = lead.intencao === 'compra_imediata';
  return (
    <Card className={lead.contatado ? 'opacity-80' : undefined}>
      <CardContent className="grid gap-6 pt-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">#{lead.posicao}</span>
            <h3 className="text-xl font-semibold text-foreground">{lead.nome}</h3>
            <Badge className={compra ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>
              {INTENCAO[lead.intencao] ?? lead.intencao}
            </Badge>
            <Badge variant="outline">{lead.vendedor}</Badge>
            {lead.contatado && (
              <Badge className="bg-success/15 text-foreground" variant="outline">
                <Check className="h-3 w-3" /> Contatado
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {lead.empresa && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4" aria-hidden />
                {lead.empresa}
                {lead.porte && lead.porte !== 'desconhecido' ? ` · ${lead.porte}` : ''}
              </span>
            )}
            {lead.cargo && <span>{lead.cargo}</span>}
            <span>canal: {CANAL[lead.canal] ?? lead.canal}</span>
            {lead.telefone && <span>{lead.telefone}</span>}
          </div>

          {lead.motivo && <p className="font-medium text-foreground">{lead.motivo}</p>}

          <div className="flex flex-wrap gap-2">
            <Chip rotulo="Produto" valor={lead.produto} />
            <Chip rotulo="Licenças" valor={lead.qtd_licencas} />
            <Chip rotulo="Prazo" valor={lead.prazo} />
            <Chip rotulo="Orçamento" valor={lead.orcamento_aprovado ? 'aprovado' : null} />
            <Chip rotulo="Concorrente" valor={lead.concorrente_citado} />
          </div>

          <blockquote className="flex gap-2 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <Quote className="h-4 w-4 shrink-0" aria-hidden />
            <span>{lead.mensagem}</span>
          </blockquote>
        </div>

        <div className="flex flex-col gap-3 border-t pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <p className="text-xs text-muted-foreground">Nota de prioridade</p>
            <p className="text-5xl font-bold tabular-nums text-foreground">{lead.lead_score}</p>
          </div>
          <Componente nome="Intenção" peso="50%" valor={lead.c_intencao} />
          <Componente nome="Perfil" peso="25%" valor={lead.c_perfil} />
          <Componente nome="Sinais" peso="15%" valor={lead.c_sinais} />
          <Componente nome="Recência" peso="10%" valor={lead.c_recencia} />
          <div className="rounded-lg bg-primary/10 p-3 text-sm text-foreground">
            <b>Próximo passo:</b> {lead.proximo_passo}
          </div>
          <Button
            variant={lead.contatado ? 'outline' : 'default'}
            disabled={lead.contatado || enviando}
            onClick={() => onContatar(lead)}
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : lead.contatado ? <Check className="h-4 w-4" /> : <PhoneCall className="h-4 w-4" />}
            {lead.contatado ? 'Contatado' : 'Marcar como contatado'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function FilaPage() {
  const { versao, novaVersao } = useVersao();
  const params = useMemo(() => ({ v: sql.string(versao) }), [versao]);
  const { data, loading, error } = useAnalyticsQuery('fila_do_dia', params);
  const [vendedor, setVendedor] = useState(TODOS);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  // O formato JSON do warehouse pode trazer booleanos e números como texto ("false", "100"):
  // normalizamos aqui para não tratar "false" como verdadeiro.
  const leads: Lead[] = useMemo(
    () =>
      (data ?? []).map((l) => ({
        ...l,
        posicao: Number(l.posicao),
        lead_score: Number(l.lead_score),
        c_intencao: Number(l.c_intencao),
        c_perfil: Number(l.c_perfil),
        c_sinais: Number(l.c_sinais),
        c_recencia: Number(l.c_recencia),
        qtd_licencas: l.qtd_licencas === null || l.qtd_licencas === undefined ? null : Number(l.qtd_licencas),
        orcamento_aprovado: comoBooleano(l.orcamento_aprovado),
        contatado: comoBooleano(l.contatado) || marcados.has(l.lead_id),
      })),
    [data, marcados],
  );
  const vendedores = useMemo(() => [...new Set(leads.map((l) => l.vendedor))].sort(), [leads]);
  const visiveis = vendedor === TODOS ? leads : leads.filter((l) => l.vendedor === vendedor);
  const contatados = visiveis.filter((l) => l.contatado).length;

  async function contatar(lead: Lead) {
    setEnviando(lead.lead_id);
    setErroEnvio(null);
    try {
      const r = await fetch('/api/contatado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.lead_id, vendedor: lead.vendedor, resultado: 'contatado' }),
      });
      if (!r.ok) {
        const corpo: { error?: string } = await r.json().catch(() => ({}));
        throw new Error(corpo.error ?? `HTTP ${r.status}`);
      }
      setMarcados((m) => new Set(m).add(lead.lead_id));
      novaVersao();
    } catch (e) {
      setErroEnvio(`Não foi possível registrar o contato de ${lead.nome}: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Cabecalho
        trilha="Operação → Fila do Dia"
        titulo="Fila do Dia"
        icone={<ListOrdered className="h-8 w-8" aria-hidden />}
        descricao="Os 20 leads de maior nota, 5 por vendedor. Cada card mostra por que o lead está na fila e o que fazer na ligação."
      />

      <div className="mb-6 flex flex-wrap items-end gap-6">
        <div className="w-64 space-y-2">
          <Label htmlFor="vendedor">Vendedor</Label>
          <Select value={vendedor} onValueChange={setVendedor}>
            <SelectTrigger id="vendedor">
              <SelectValue placeholder="Todos os vendedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos os vendedores</SelectItem>
              {vendedores.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!loading && !error && (
          <p className="pb-2 text-muted-foreground">
            {contatados} de {visiveis.length} contatados
          </p>
        )}
      </div>

      {erroEnvio && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Contato não registrado</AlertTitle>
          <AlertDescription>{erroEnvio}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Não foi possível carregar a fila</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-5">
        {loading && !data && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        {!loading && !error && visiveis.length === 0 && (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Nenhum lead na fila</EmptyTitle>
              <EmptyDescription>
                Suba o CSV do dia em /Volumes/lh_leadscore_ensaio2/landing/raw/leads/ e rode o pipeline.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {visiveis.map((lead) => (
          <CardLead key={lead.lead_id} lead={lead} enviando={enviando === lead.lead_id} onContatar={contatar} />
        ))}
      </div>
    </div>
  );
}
