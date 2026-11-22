import { Card, CardContent, CardHeader, CardTitle } from '@databricks/appkit-ui/react';
import { ArrowRight, Layers } from 'lucide-react';
import { Cabecalho } from './Cabecalho';

const ETAPAS = [
  { nome: 'Volume raw', detalhe: 'CSVs do dia (leads, empresas, histórico) no Unity Catalog', tabela: 'landing.raw' },
  { nome: 'Bronze', detalhe: 'Auto Loader: cada arquivo lido uma vez, _rescued_data para datas ruins', tabela: 'bronze.leads_raw' },
  { nome: 'Silver', detalhe: 'E-mail e CNPJ normalizados, dígito verificador, dedup e junção', tabela: 'silver.leads_enriquecidos' },
  { nome: 'Gold · IA', detalhe: 'ai_classify (intenção) + ai_extract (entidades), só em linhas novas', tabela: 'gold.leads_ia' },
  { nome: 'Gold · Score', detalhe: '0,50 intenção + 0,25 perfil + 0,15 sinais + 0,10 recência', tabela: 'gold.leads_classificados' },
  { nome: 'Fila + App', detalhe: '20 leads, 5 por vendedor; feedback e agente Genie', tabela: 'gold.fila_do_dia' },
];

export function FontePage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Cabecalho trilha="Plataforma → Da fonte à decisão" titulo="Da fonte à decisão" icone={<Layers className="h-8 w-8" />}>
        Pipeline declarativo (Lakeflow SDP) em SQL, governado pelo Unity Catalog, com AI Functions rodando onde o dado já está.
      </Cabecalho>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ETAPAS.map((e, i) => (
          <Card key={e.nome}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-full bg-brand text-white text-sm flex items-center justify-center">{i + 1}</span>
                {e.nome}
                {i < ETAPAS.length - 1 && <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{e.detalhe}</p>
              <code className="text-xs text-foreground">lh_leadscore_ensaio2.{e.tabela}</code>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
