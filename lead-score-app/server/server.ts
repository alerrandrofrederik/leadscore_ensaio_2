import { createApp, analytics, genie, server, getExecutionContext, getWarehouseId } from '@databricks/appkit';
import { z } from 'zod';

const FEEDBACK_TABLE = 'lh_leadscore_ensaio2.gold.feedback_contatos';

const contatoSchema = z.object({
  lead_id: z.string().regex(/^L\d{8}-\d{4}$/),
  vendedor: z.string().min(1).max(80),
  resultado: z.enum(['contatado', 'sem_resposta', 'oportunidade', 'descartado']).default('contatado'),
});

createApp({
  plugins: [analytics(), genie(), server()],
  async onPluginsReady(appkit) {
    appkit.server.extend((app) => {

      // Quem está usando o app (cabeçalhos injetados pelo proxy do Databricks Apps)
      app.get('/api/whoami', (req, res) => {
        res.json({
          email: req.header('x-forwarded-email') ?? null,
          user: req.header('x-forwarded-user') ?? null,
        });
      });

      // RF-14 · "Marcar como contatado": grava em gold.feedback_contatos (INSERT parametrizado)
      app.post('/api/contatado', async (req, res) => {
        const parsed = contatoSchema.safeParse(req.body);
        if (!parsed.success) {
          res.status(400).json({ error: 'Dados inválidos', detalhes: parsed.error.flatten() });
          return;
        }
        const { lead_id, vendedor, resultado } = parsed.data;
        try {
          const { client } = getExecutionContext();
          const warehouseId = await getWarehouseId();
          const resp = await client.statementExecution.executeStatement({
            warehouse_id: warehouseId,
            wait_timeout: '30s',
            statement: `INSERT INTO ${FEEDBACK_TABLE} (lead_id, vendedor, contatado_em, resultado)
                        VALUES (:lead_id, :vendedor, current_timestamp(), :resultado)`,
            parameters: [
              { name: 'lead_id', value: lead_id, type: 'STRING' },
              { name: 'vendedor', value: vendedor, type: 'STRING' },
              { name: 'resultado', value: resultado, type: 'STRING' },
            ],
          });
          const state = resp.status?.state;
          if (state !== 'SUCCEEDED') {
            res.status(502).json({ error: `Falha ao gravar o contato (${state ?? 'sem status'})`, detalhe: resp.status?.error?.message });
            return;
          }
          res.status(201).json({ ok: true, lead_id });
        } catch (err) {
          console.error('Erro ao gravar contato', err);
          res.status(500).json({ error: 'Erro ao gravar o contato' });
        }
      });
    });
  },
}).catch(console.error);
