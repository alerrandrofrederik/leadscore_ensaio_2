import type { ReactNode } from 'react';

export function Cabecalho({
  trilha,
  titulo,
  descricao,
  icone,
}: {
  trilha: string;
  titulo: string;
  descricao?: ReactNode;
  icone?: ReactNode;
}) {
  return (
    <div className="mb-8 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{trilha}</p>
      <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {icone}
        {titulo}
      </h1>
      {descricao && <p className="max-w-3xl text-muted-foreground">{descricao}</p>}
    </div>
  );
}
