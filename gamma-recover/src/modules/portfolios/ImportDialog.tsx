import { useState } from 'react';
import { useWorkspace } from '../../app/providers/Context';
import { useAction, useDatabase } from '../../hooks/useDatabase';
import { ImportService, parseCSV } from '../../services/import';
import { download, money } from '../../utils/format';
import { Modal } from '../../components/Modal';
import { Feedback } from '../../components/Feedback';
import { DataTable } from '../../components/DataTable';
import { Alert, Button, Field, Input, Stack } from '../../components/ui';
export function ImportDialog({
  portfolioId,
  onClose,
}: {
  portfolioId: string;
  onClose: () => void;
}) {
  const { scope } = useWorkspace();
  const action = useAction();
  const { data: db } = useDatabase();
  const portfolio = db?.portfolios.find((p) => p.id === portfolioId);
  const company = db?.creditors.find((c) => c.id === portfolio?.creditorId);
  const [text, setText] = useState('');
  const [filename, setFilename] = useState('');
  const [fileError, setFileError] = useState('');
  const preview = parseCSV(text);
  return (
    <Modal title="Importar contratos demonstrativos" onClose={onClose}>
      <Stack>
        <p>
          <strong>Empresa contratante:</strong> {company?.name} · {company?.document}
          <br />
          <strong>Carteira:</strong> {portfolio?.name}
        </p>
        <Alert>
          Use apenas dados fictícios com documento DEMO-… Valores em reais e datas AAAA-MM-DD.
          Importação atômica: nenhum registro será salvo se houver erro. O modelo ampliado inclui
          telefone, whatsapp e email; deixe os dados desconhecidos em branco. O formato antigo de
          cinco colunas continua aceito.
        </Alert>
        <Button
          onClick={() =>
            download(
              'modelo-carteira.csv',
              'documento;nome;contrato;valor;vencimento;telefone;whatsapp;email\nDEMO-9999;Pessoa Fictícia;CTR-IMPORT-9999;1250,50;2026-09-10;;;',
            )
          }
        >
          Baixar modelo CSV
        </Button>
        <Field>
          Arquivo CSV (até 1 MB)
          <Input
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              setText('');
              setFileError('');
              if (file) {
                if (file.size > 1000000) {
                  setFileError('Arquivo excede 1 MB.');
                  return;
                }
                try {
                  setFilename(file.name);
                  setText(await file.text());
                } catch {
                  setFileError('Não foi possível ler o arquivo.');
                }
              }
            }}
          />
        </Field>
        <Feedback error={fileError ? new Error(fileError) : action.error} />
        {text && (
          <>
            {preview.errors.length > 0 && (
              <Alert $error role="alert">
                {preview.errors.join(' ? ')}
              </Alert>
            )}
            <DataTable
              rows={preview.rows}
              rowKey={(r) => r.reference}
              pageSize={4}
              columns={[
                { key: 'name', label: 'Nome', render: (r) => r.name },
                { key: 'reference', label: 'Contrato', render: (r) => r.reference },
                {
                  key: 'channels',
                  label: 'Canais informados',
                  render: (r) =>
                    [r.phone && 'Telefone', r.whatsapp && 'WhatsApp', r.email && 'E-mail']
                      .filter(Boolean)
                      .join(' · ') || 'Nenhum',
                },
                { key: 'amount', label: 'Valor', render: (r) => money(r.amount) },
              ]}
            />
            <Button
              $variant="primary"
              disabled={!!preview.errors.length || action.isPending || action.isSuccess}
              onClick={() =>
                action.mutate(() => ImportService.commit(scope, portfolioId, text, filename))
              }
            >
              Confirmar importação de {preview.rows.length} contratos
            </Button>
          </>
        )}
        <Feedback
          success={
            action.isSuccess
              ? 'Importação concluída. Os módulos relacionados foram atualizados.'
              : undefined
          }
        />
      </Stack>
    </Modal>
  );
}
