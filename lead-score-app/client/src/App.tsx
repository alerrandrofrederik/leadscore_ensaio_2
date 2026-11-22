import { createBrowserRouter, RouterProvider, NavLink, Outlet } from 'react-router';
import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  useIsMobile,
} from '@databricks/appkit-ui/react';
import { Bot, Layers, LayoutGrid, ListOrdered, Menu, Moon, PhoneCall, Sun, type LucideIcon } from 'lucide-react';
import { VersaoProvider } from './lib/versao';
import { GestorPage } from './pages/GestorPage';
import { FilaPage } from './pages/FilaPage';
import { AgentePage } from './pages/AgentePage';
import { ArquiteturaPage } from './pages/ArquiteturaPage';

type Item = { to: string; label: string; hint: string; icon: LucideIcon; end?: boolean };

const SECOES: { titulo: string; itens: Item[] }[] = [
  {
    titulo: 'Operação',
    itens: [
      { to: '/', label: 'Visão do Gestor', hint: 'Funil · Intenção · Canal', icon: LayoutGrid, end: true },
      { to: '/fila', label: 'Fila do Dia', hint: '20 leads · 5 por vendedor', icon: ListOrdered },
    ],
  },
  { titulo: 'Inteligência', itens: [{ to: '/agente', label: 'Agente', hint: 'AI/BI Genie', icon: Bot }] },
  {
    titulo: 'Plataforma',
    itens: [{ to: '/arquitetura', label: 'Da fonte à decisão', hint: 'SDP · UC · AI Functions', icon: Layers }],
  },
];

function Navegacao({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-6">
      {SECOES.map((secao) => (
        <div key={secao.titulo} className="flex flex-col gap-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/60">
            {secao.titulo}
          </p>
          {secao.itens.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/60'
                }`
              }
            >
              <item.icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="text-xs opacity-70">{item.hint}</span>
              </span>
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}

function Marca() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
        <PhoneCall className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <p className="text-base font-bold leading-tight">Lead Score</p>
        <p className="text-xs opacity-70">Atlas Software · Comercial</p>
      </div>
    </div>
  );
}

function useTema() {
  const [escuro, setEscuro] = useState(() => {
    try {
      const salvo = localStorage.getItem('tema');
      if (salvo) return salvo === 'escuro';
    } catch {
      /* sem armazenamento: segue o sistema */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });
  useEffect(() => {
    // AppKit-ui: `.dark` força o escuro; `.light` impede o escuro do sistema
    document.documentElement.classList.toggle('dark', escuro);
    document.documentElement.classList.toggle('light', !escuro);
    try {
      localStorage.setItem('tema', escuro ? 'escuro' : 'claro');
    } catch {
      /* armazenamento indisponível: o tema só não fica salvo */
    }
  }, [escuro]);
  return { escuro, alternar: () => setEscuro((e) => !e) };
}

function Status() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-sidebar-foreground/80">
      {['SQL Warehouse', 'Genie', 'AI Functions', 'Unity Catalog'].map((s) => (
        <span key={s} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
          {s}
        </span>
      ))}
    </div>
  );
}

function Layout() {
  const isMobile = useIsMobile();
  const [aberto, setAberto] = useState(false);
  const { escuro, alternar } = useTema();

  const rodape = (
    <div className="flex flex-col gap-4">
      <Status />
      <Button variant="outline" className="w-full bg-transparent text-sidebar-foreground" onClick={alternar}>
        {escuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {escuro ? 'Tema claro' : 'Tema escuro'}
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col justify-between bg-sidebar p-5 text-sidebar-foreground md:flex">
        <div className="flex flex-col gap-8">
          <Marca />
          <Navegacao />
        </div>
        {rodape}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b px-4 py-3 md:px-8">
          <div className="md:hidden">
            <Sheet open={aberto && isMobile} onOpenChange={setAberto}>
              <Button variant="ghost" size="icon" onClick={() => setAberto(true)}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir navegação</span>
              </Button>
              <SheetContent side="left" className="bg-sidebar text-sidebar-foreground">
                <SheetHeader>
                  <SheetTitle className="text-sidebar-foreground">
                    <Marca />
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-8 p-4">
                  <Navegacao onNavigate={() => setAberto(false)} />
                  {rodape}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <Badge variant="outline" className="ml-auto border-warning bg-warning/15 text-foreground">
            Demo · dados 100% sintéticos
          </Badge>
        </header>
        <main className="flex-1 px-4 py-8 md:px-10">
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
      { path: '/arquitetura', element: <ArquiteturaPage /> },
    ],
  },
]);

export default function App() {
  return (
    <VersaoProvider>
      <RouterProvider router={router} />
    </VersaoProvider>
  );
}
