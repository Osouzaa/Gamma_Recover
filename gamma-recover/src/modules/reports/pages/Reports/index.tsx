import { useState } from 'react';
import { Download } from 'lucide-react';
import { useDatabase } from '../../../../hooks/useDatabase';
import { useWorkspace } from '../../../../app/providers/Context';
import { ReportService, type ReportType } from '../../../../services/reports';
import { today } from '../../../../utils/format';
import { DataTable } from '../../../../components/DataTable';
import { ErrorState, LoadingState } from '../../../../components/Feedback';
import {
  Alert,
  Button,
  Field,
  FilterBar,
  Input,
  PageHeader,
  Panel,
  PanelHeader,
  Muted,
  Select,
  Stack,
} from '../../../../components/ui';
export default function Reports() {
  const { data: db, isLoading, refetch } = useDatabase();
  const { creditorId } = useWorkspace();
  const [type, setType] = useState<ReportType>('Recuperação');
  const [start, setStart] = useState('2020-01-01');
  const [end, setEnd] = useState(today());
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const invalid = !start || !end || start > end;
  const report = ReportService.generate(db, type, creditorId, start, end);
  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Consulte e exporte a mesma base de dados utilizada na operação."
        actions={
          <Button
            disabled={invalid || !report.rows.length}
            onClick={() => ReportService.export(report.headers, report.rows, type)}
          >
            <Download />
            Exportar CSV
          </Button>
        }
      />
      <Stack>
        <Panel>
          <PanelHeader>
            <h2>{type}</h2>
            <Muted>
              {invalid ? 'Revise o intervalo' : `${report.rows.length} registros na seleção`} · CSV
              com todas as linhas filtradas
            </Muted>
          </PanelHeader>
          <FilterBar>
            <Field>
              Relatório
              <Select value={type} onChange={(e) => setType(e.target.value as ReportType)}>
                {[
                  'Carteiras',
                  'Acordos',
                  'Recuperação',
                  'Pagamentos',
                  'Inadimplência',
                  'Produtividade',
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field>
              Início
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field>
              Fim
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </Field>
          </FilterBar>
          {invalid ? (
            <Alert $error>Informe um intervalo válido.</Alert>
          ) : (
            <DataTable<(string | number | undefined)[]>
              key={type}
              rows={report.rows}
              rowKey={(r) => String(r[0])}
              columns={report.headers.map((h, i) => ({
                key: h,
                label: h,
                render: (r) => String(r[i] ?? '—'),
                sortValue: (r) => String(r[i] ?? ''),
              }))}
            />
          )}
        </Panel>
        <Alert>
          Período aplicado ? criação de carteiras/acordos, data do recebimento, vencimento das
          parcelas ou atendimento, conforme o relatório. Recuperação usa o saldo original atual como
          denominador.
        </Alert>
      </Stack>
    </>
  );
}
