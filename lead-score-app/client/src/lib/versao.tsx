import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * "Versão" dos dados de contato. Cada contato marcado incrementa o número; as consultas que
 * dependem de gold.feedback_contatos recebem esse valor como parâmetro (:v), o que gera uma
 * nova chave de cache e força a releitura no warehouse.
 */
type Versao = { versao: string; novaVersao: () => void };

const VersaoContext = createContext<Versao>({ versao: '0', novaVersao: () => {} });

export function VersaoProvider({ children }: { children: ReactNode }) {
  const [n, setN] = useState(() => Date.now());
  const novaVersao = useCallback(() => setN(Date.now()), []);
  const valor = useMemo(() => ({ versao: String(n), novaVersao }), [n, novaVersao]);
  return <VersaoContext.Provider value={valor}>{children}</VersaoContext.Provider>;
}

export function useVersao() {
  return useContext(VersaoContext);
}
