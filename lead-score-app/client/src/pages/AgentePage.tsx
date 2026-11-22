import { useEffect, useState, type ReactNode } from 'react';
import { Badge, Button, Card, CardContent, GenieChat } from '@databricks/appkit-ui/react';
import { Bot, Check, Copy, Flame, MessageSquareQuote, Radio, Swords, Target, UserCheck } from 'lucide-react';
import { Cabecalho } from '../components/Cabecalho';

const PERGUNTAS: { titulo: string; pergunta: string; icone: ReactNode }[] = [
  { titulo: 'Leads quentes de hoje', pergunta: 'Quantos leads de compra imediata chegaram hoje?', icone: <Flame className="h-4 w-4" /> },
  { titulo: 'Melhor canal', pergunta: 'Qual canal trouxe mais leads de compra imediata?', icone: <Radio className="h-4 w-4" /> },
  { titulo: 'Concorrentes', pergunta: 'Quais leads citaram concorrente?', icone: <Swords className="h-4 w-4" /> },
  { titulo: 'Minha fila', pergunta: 'Quantos leads da minha fila eu já contatei?', icone: <UserCheck className="h-4 w-4" /> },
  { titulo: 'Quem ficou de fora', pergunta: 'Quais leads de compra imediata ficaram fora da fila de hoje?', icone: <Target className="h-4 w-4" /> },
];

function CardPergunta({ titulo, pergunta, icone }: { titulo: string; pergunta: string; icone: ReactNode }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(pergunta);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      setCopiado(false);
    }
  }
  return (
    <Card>
      <CardContent className="space-y-2 pt-5">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          {icone}
          {titulo}
        </p>
        <p className="text-sm text-muted-foreground">{pergunta}</p>
        <Button variant="ghost" size="sm" className="-ml-2" onClick={copiar}>
          {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiado ? 'Copiado' : 'Copiar pergunta'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function AgentePage() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/whoami')
      .then((r) => (r.ok ? r.json() : null))
      .then((me: { email?: string | null } | null) => setEmail(me?.email ?? null))
      .catch(() => setEmail(null));
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <Cabecalho
        trilha="Inteligência → Agente · AI/BI Genie"
        titulo="Agente Comercial"
        icone={<Bot className="h-8 w-8" aria-hidden />}
        descricao="Pergunte em português sobre os leads, a fila e os contatos. O agente consulta as tabelas Gold governadas pelo Unity Catalog e mostra o SQL que usou."
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Perguntas do roteiro</p>
          {PERGUNTAS.map((p) => (
            <CardPergunta key={p.pergunta} {...p} />
          ))}
        </aside>

        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{email ?? 'Usuário do workspace'}</Badge>
            <span>
              As consultas rodam com as <b>suas</b> permissões no Unity Catalog (on-behalf-of-user, escopo
              dashboards.genie).
            </span>
          </div>
          <div className="h-[min(680px,75vh)] overflow-hidden rounded-xl border">
            <GenieChat alias="default" placeholder="Pergunte sobre os leads de hoje…" />
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquareQuote className="h-3.5 w-3.5" aria-hidden />
            Respostas geradas por IA a partir dos dados via Genie. Confira o SQL gerado antes de decidir.
          </p>
        </section>
      </div>
    </div>
  );
}
