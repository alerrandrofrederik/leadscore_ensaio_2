import type { ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@databricks/appkit-ui/react';
import { AlertCircle } from 'lucide-react';

export function Cabecalho({ trilha, titulo, icone, children }: { trilha: string; titulo: string; icone?: ReactNode; children?: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">{trilha}</div>
      <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
        {icone}
        {titulo}
      </h1>
      {children && <p className="text-muted-foreground max-w-3xl">{children}</p>}
    </div>
  );
}

export function Erro({ mensagem }: { mensagem: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Não foi possível carregar os dados</AlertTitle>
      <AlertDescription>{mensagem}</AlertDescription>
    </Alert>
  );
}
