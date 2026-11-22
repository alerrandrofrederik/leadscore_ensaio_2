import { useState } from 'react';
import { Button, Card, CardContent, GenieChat } from '@databricks/appkit-ui/react';
import { Bot, Check, Copy, Flame, Radio, Swords, Target, UserCheck } from 'lucide-react';
import { Cabecalho } from './Cabecalho';

const PERGUNTAS = [
  { titulo: 'Leads quentes de hoje', pergunta: 'Quantos leads de compra imediata chegaram hoje?', Icone: Flame },
  { titulo: 'Melhor canal', pergunta: 'Qual canal trouxe mais leads de compra imediata?', Icone: Radio },
  { titulo: 'Concorrência', pergunta: 'Quais leads citaram concorrente?', Icone: Swords },
  { titulo: 'Meus contatos', pergunta: 'Quantos leads da minha fila eu já contatei?', Icone: UserCheck },
  { titulo: 'Quem ficou de fora', pergunta: 'Quais leads de compra imediata ficaram fora da fila de hoje?', Icone: Target },
];

export function AgentePage() {
  const [copiada, setCopiada] = useState<string | null>(null);
  const copiar = async (p: string) => {
    await navigator.clipboard?.writeText(p).catch(() => undefined);
    setCopiada(p);
    setTimeout(() => setCopiada(null), 1500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <Cabecalho trilha="Inteligência → Agente · AI/BI Genie" titulo="Agente Comercial" icone={<Bot className="h-8 w-8" />}>
        Pergunte em português sobre os leads, a fila e os contatos. O agente consulta as tabelas Gold governadas pelo Unity
        Catalog e mostra o SQL que usou.
      </Cabecalho>
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Perguntas do roteiro</div>
          {PERGUNTAS.map(({ titulo, pergunta, Icone }) => (
            <Card key={titulo}>
              <CardContent className="pt-5 space-y-2">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Icone className="h-4 w-4" /> {titulo}
                </div>
                <p className="text-sm text-muted-foreground">{pergunta}</p>
                <Button variant="ghost" size="sm" onClick={() => copiar(pergunta)}>
                  {copiada === pergunta ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiada === pergunta ? 'Copiada' : 'Copiar pergunta'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-[min(760px,78vh)] border rounded-xl overflow-hidden bg-card">
          <GenieChat alias="default" />
        </div>
      </div>
    </div>
  );
}
