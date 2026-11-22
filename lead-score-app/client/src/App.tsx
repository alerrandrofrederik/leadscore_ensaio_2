import { createBrowserRouter, RouterProvider, NavLink, Outlet } from 'react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button } from '@databricks/appkit-ui/react';
import { Bot, Layers, LayoutGrid, ListOrdered, Moon, Sun, Target } from 'lucide-react';
import { VersaoContext } from './lib/dados';
import { GestorPage } from './pages/GestorPage';
import { FilaPage } from './pages/FilaPage';
import { AgentePage } from './pages/AgentePage';
import { FontePage } from './pages/FontePage';

type Item = { to: string; titulo: string; sub: string; Icone: typeof Bot };
const SECOES: { nome: string; itens: Item[] }[] = [
  {
    nome: 'Operação',
    itens: [
      { to: '/', titulo: 'Visão do Gestor', sub: 'Funil · Intenção · Canal', Icone: LayoutGrid },
      { to: '/fila', titulo: 'Fila do Dia', sub: '20 leads · 5 por vendedor', Icone: ListOrdered },
    ],
  },
  { nome: 'Inteligência', itens: [{ to: '/agente', titulo: 'Agente', sub: 'AI/BI Genie', Icone: Bot }] },
  {
    nome: 'Plataforma',
    itens: [{ to: '/fonte', titulo: 'Da fonte à decisão', sub: 'SDP · UC · AI Functions', Icone: Layers }],
  },
];

function useTema() {
  const [escuro, setEscuro] = useState(false);
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle('dark', escuro);
    raiz.classList.toggle('light', !escuro);
  }, [escuro]);
  return { escuro, alternar: () => setEscuro((e) => !e) };
}

function Sidebar() {
  const { escuro, alternar } = useTema();
  return (
    <aside className="hidden md:flex w-72 shrink-0 flex-col bg-sidebar text-sidebar-foreground p-5 gap-6 min-h-screen sticky top-0">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-brand text-white flex items-center justify-center">
          <Target className="h-6 w-6" />
        </div>
        <div>
          <div className="text-lg font-semibold leading-tight">Lead Score</div>
          <div className="text-xs opacity-75">Atlas Software · Comercial</div>
        </div>
      </div>
      <nav className="flex flex-col gap-5">
        {SECOES.map((s) => (
          <div key={s.nome} className="space-y-1">
            <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] opacity-60">{s.nome}</div>
            {s.itens.map(({ to, titulo, sub, Icone }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent/60'
                  }`
                }
              >
                <Icone className="h-4 w-4 mt-1 shrink-0" />
                <span>
                  <span className="block font-medium">{titulo}</span>
                  <span className="block text-xs opacity-70">{sub}</span>
                </span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="mt-auto space-y-4">
        <div className="grid grid-cols-2 gap-y-2 text-xs">
          {['SQL Warehouse', 'Genie', 'AI Functions', 'Unity Catalog'].map((r) => (
            <span key={r} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              {r}
            </span>
          ))}
        </div>
        <Button
          variant="outline"
          className="w-full bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={alternar}
        >
          {escuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {escuro ? 'Tema claro' : 'Tema escuro'}
        </Button>
      </div>
    </aside>
  );
}

function Layout() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="border-b px-6 py-3 flex items-center gap-4">
          <span className="md:hidden font-semibold text-foreground">Lead Score</span>
          <nav className="md:hidden flex gap-3 text-sm">
            <NavLink to="/">Gestor</NavLink>
            <NavLink to="/fila">Fila</NavLink>
            <NavLink to="/agente">Agente</NavLink>
          </nav>
          <Badge className="ml-auto bg-warning text-warning-foreground">Demo · dados 100% sintéticos</Badge>
        </header>
        <main className="flex-1 p-4 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <GestorPage /> },
      { path: '/fila', element: <FilaPage /> },
      { path: '/agente', element: <AgentePage /> },
      { path: '/fonte', element: <FontePage /> },
    ],
  },
]);

export default function App() {
  const [versao, setVersao] = useState('0');
  const renovar = useCallback(() => setVersao(String(Date.now())), []);
  const valor = useMemo(() => ({ versao, renovar }), [versao, renovar]);
  return (
    <VersaoContext.Provider value={valor}>
      <RouterProvider router={router} />
    </VersaoContext.Provider>
  );
}
