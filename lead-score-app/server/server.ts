import { createApp, analytics, genie, server, getExecutionContext, getWarehouseId } from '@databricks/appkit';

const VENDEDORES = ['Ana Ribeiro', 'Bruno Carvalho', 'Carla Mendes', 'Diego Rocha'];
const TABELA_FEEDBACK = 'lh_leadscore_ensaio2.gold.feedback_contatos';

createApp({
  plugins: [analytics(), genie(), server()],
  onPluginsReady(appkit) {
    appkit.server.extend((app) => {
      // RF-14: botão "Contatado" grava em gold.feedback_contatos
      app.post('/api/contatos', async (req, res) => {
        const body = (req.body ?? {}) as { lead_id?: unknown; vendedor?: unknown; resultado?: unknown };
        const leadId = typeof body.lead_id === 'string' ? body.lead_id.trim() : '';
        const vendedor = typeof body.vendedor === 'string' ? body.vendedor.trim() : '';
        const resultado = typeof body.resultado === 'string' && body.resultado.trim() ? body.resultado.trim() : 'contatado';

        if (!/^L\d{8}-\d{4}$/.test(leadId) || !VENDEDORES.includes(vendedor)) {
          res.status(400).json({ ok: false, erro: 'lead_id ou vendedor inválido' });
          return;
        }

        try {
          const { client } = getExecutionContext();
          const warehouseId = await getWarehouseId();
          const r = await client.statementExecution.executeStatement({
            warehouse_id: warehouseId,
            statement: `INSERT INTO ${TABELA_FEEDBACK} (lead_id, vendedor, contatado_em, resultado)
                        VALUES (:lead_id, :vendedor, current_timestamp(), :resultado)`,
            parameters: [
              { name: 'lead_id', value: leadId, type: 'STRING' },
              { name: 'vendedor', value: vendedor, type: 'STRING' },
              { name: 'resultado', value: resultado, type: 'STRING' },
            ],
            wait_timeout: '30s',
          });
          const estado = r.status?.state;
          if (estado !== 'SUCCEEDED') {
            res.status(500).json({ ok: false, erro: r.status?.error?.message ?? `estado ${estado}` });
            return;
          }
          res.json({ ok: true, lead_id: leadId });
        } catch (e) {
          res.status(500).json({ ok: false, erro: e instanceof Error ? e.message : String(e) });
        }
      });
    });
  },
}).catch(console.error);
