import { useState } from 'react';
import {
  useAnalyticsQuery,
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
} from '@databricks/appkit-ui/react';
import { sql } from '@databricks/appkit-ui/js';
import { Building2, Check, ListOrdered, Phone, Quote } from 'lucide-react';
import { bool, num, numOuNulo, ROTULO_INTENCAO, txt, useVersao, VENDEDORES } from '../lib/dados';
import { Cabecalho, Erro } from './Cabecalho';

type Lead = {
  posicao: number;
  vendedor: string;
  lead_id: string;
  nome: string;
  empresa: string;
  porte: string;
  canal: string;
  telefone: string;
  cargo: string;
  intencao: string;
  lead_score: number;
  componentes: { nome: string; peso: string; valor: number }[];
  produto: string;
  qtd: number | null;
  prazo: string;
  orcamento: boolean;
  concorrente: string;
  motivo: string;
  proximo_passo: string;
  mensagem: string;
  hora: string;
  contatado: boolean;
};

function normalizar(r: Record<string, unknown>): Lead {
  return {
    posicao: num(r.posicao),
    vendedor: txt(r.vendedor),
    lead_id: txt(r.lead_id),
    nome: txt(r.nome),
    empresa: txt(r.empresa),
    porte: txt(r.porte),
    canal: txt(r.canal),
    telefone: txt(r.telefone),
    cargo: txt(r.cargo),
    intencao: txt(r.intencao),
    lead_score: num(r.lead_score),
    componentes: [
      { nome: 'Intenção', peso: '50%', valor: num(r.c_intencao) },
      { nome: 'Perfil', peso: '25%', valor: num(r.c_perfil) },
      { nome: 'Sinais', peso: '15%', valor: num(r.c_sinais) },
      { nome: 'Recência', peso: '10%', valor: num(r.c_recencia) },
    ],
    produto: txt(r.produto),
    qtd: numOuNulo(r.qtd_licencas),
    prazo: txt(r.prazo),
    orcamento: bool(r.orcamento_aprovado),
    concorrente: txt(r.concorrente_citado),
    motivo: txt(r.motivo),
    proximo_passo: txt(r.proximo_passo),
    mensagem: txt(r.mensagem),
    hora: txt(r.recebido_hora),
    contatado: bool(r.contatado),
  };
}

function Chip({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <span className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
      {rotulo}: <b className="text-foreground">{valor}</b>
    </span>
  );
}

function CardLead({ lead, onContatar, enviando }: { lead: Lead; onContatar: () => void; enviando: boolean }) {
  const entidades = [
    lead.produto && { rotulo: 'Produto', valor: lead.produto },
    lead.qtd !== null && { rotulo: 'Licenças', valor: String(lead.qtd) },
    lead.prazo && { rotulo: 'Prazo', valor: lead.prazo },
    lead.orcamento && { rotulo: 'Orçamento', valor: 'aprovado' },
    lead.concorrente && { rotulo: 'Concorrente', valor: lead.concorrente },
  ].filter(Boolean) as { rotulo: string; valor: string }[];

  return (
    <Card>
      <CardContent className="pt-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">#{lead.posicao}</span>
            <span className="text-xl font-semibold text-foreground">{lead.nome}</span>
            <Badge className={lead.intencao === 'compra_imediata' ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>
              {ROTULO_INTENCAO[lead.intencao] ?? lead.intencao}
            </Badge>
            <Badge variant="secondary">{lead.vendedor}</Badge>
            {lead.contatado && (
              <Badge className="bg-success text-success-foreground">
                <Check className="h-3 w-3" /> Contatado
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {lead.empresa || 'Empresa não cadastrada'}
              {lead.porte && ` · ${lead.porte}`}
            </span>
            {lead.cargo && <span>{lead.cargo}</span>}
            <span>canal: {lead.canal}</span>
            {lead.telefone && <span>{lead.telefone}</span>}
            {lead.hora && <span>chegou às {lead.hora}</span>}
          </div>
          <p className="font-medium text-foreground">{lead.motivo}</p>
          {entidades.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {entidades.map((e) => (
                <Chip key={e.rotulo} rotulo={e.rotulo} valor={e.valor} />
              ))}
            </div>
          )}
          <div className="flex gap-3 rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
            <Quote className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{lead.mensagem}</span>
          </div>
        </div>
        <div className="space-y-3 lg:border-l lg:pl-6">
          <div className="text-sm text-muted-foreground">Nota de prioridade</div>
          <div className="text-5xl font-bold text-foreground">{lead.lead_score}</div>
          {lead.componentes.map((c) => (
            <div key={c.nome} className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {c.nome} ({c.peso})
                </span>
                <span>{c.valor}</span>
              </div>
              <Progress value={c.valor} />
            </div>
          ))}
          <div className="rounded-lg bg-brand/10 p-3 text-sm text-foreground">
            <b>Próximo passo:</b> {lead.proximo_passo}
          </div>
          <Button className="w-full" variant={lead.contatado ? 'outline' : 'default'} disabled={lead.contatado || enviando} onClick={onContatar}>
            <Phone className="h-4 w-4" />
            {lead.contatado ? 'Contatado' : enviando ? 'Registrando…' : 'Marcar como contatado'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function FilaPage() {
  const { versao, renovar } = useVersao();
  const [vendedor, setVendedor] = useState('todos');
  const [enviando, setEnviando] = useState<string | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const { data, loading, error } = useAnalyticsQuery('fila', { v: sql.string(versao) });

  const leads = (data ?? []).map((r) => normalizar(r as Record<string, unknown>));
  const visiveis = vendedor === 'todos' ? leads : leads.filter((l) => l.vendedor === vendedor);
  const contatados = visiveis.filter((l) => l.contatado).length;

  async function contatar(lead: Lead) {
    setEnviando(lead.lead_id);
    setErroEnvio(null);
    try {
      const r = await fetch('/api/contatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: lead.lead_id, vendedor: lead.vendedor }),
      });
      const corpo = (await r.json().catch(() => ({}))) as { ok?: boolean; erro?: string };
      if (!r.ok || !corpo.ok) throw new Error(corpo.erro ?? `HTTP ${r.status}`);
      renovar();
    } catch (e) {
      setErroEnvio(e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Cabecalho trilha="Operação → Fila do Dia" titulo="Fila do Dia" icone={<ListOrdered className="h-8 w-8" />}>
        Os 20 leads de maior nota, 5 por vendedor. Cada card mostra por que o lead está na fila e o que fazer na ligação.
      </Cabecalho>

      <div className="flex flex-wrap items-end gap-8">
        <div className="space-y-2">
          <Label htmlFor="vendedor">Vendedor</Label>
          <Select value={vendedor} onValueChange={setVendedor}>
            <SelectTrigger id="vendedor" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os vendedores</SelectItem>
              {VENDEDORES.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!loading && (
          <span className="text-muted-foreground pb-2">
            {contatados} de {visiveis.length} contatados
          </span>
        )}
      </div>

      {erroEnvio && <Erro mensagem={erroEnvio} />}
      {error && <Erro mensagem={String(error)} />}
      {loading &&
        [0, 1, 2].map((i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}
      {!loading && !error && visiveis.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Nenhum lead na fila</EmptyTitle>
            <EmptyDescription>O pipeline ainda não processou o CSV do dia.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {!loading &&
        visiveis.map((l) => (
          <CardLead key={l.lead_id} lead={l} enviando={enviando === l.lead_id} onContatar={() => contatar(l)} />
        ))}
    </div>
  );
}
