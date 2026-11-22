import { createContext, useContext } from 'react';

/** O warehouse devolve booleanos e números como texto: normalize antes de usar. */
export const bool = (v: unknown): boolean => v === true || v === 'true';
export const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
export const numOuNulo = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null;
export const txt = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

export const VENDEDORES = ['Ana Ribeiro', 'Bruno Carvalho', 'Carla Mendes', 'Diego Rocha'];

export const ROTULO_INTENCAO: Record<string, string> = {
  compra_imediata: 'Compra imediata',
  avaliando: 'Avaliando',
  suporte: 'Suporte',
  spam: 'Spam',
};

/** Versão dos contatos: trocada a cada "Contatado" para furar o cache das consultas. */
export const VersaoContext = createContext<{ versao: string; renovar: () => void }>({
  versao: '0',
  renovar: () => {},
});
export const useVersao = () => useContext(VersaoContext);
