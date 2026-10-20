import { SectionTabs } from '../../../../components/SectionTabs';
import { PortfolioIntelligence } from '../../PortfolioIntelligence';
import { useState } from 'react';
import { CalendarRange, Download } from 'lucide-react';
import { useDatabase } from '../../../../hooks/useDatabase';
import { useWorkspace } from '../../../../app/providers/Context';
import { DashboardService } from '../../../../services/dashboard';
import type { DashboardPeriod } from '../../../../services/dashboardPeriods';
import { csvCell, date, download } from '../../../../utils/format';
import { LoadingState, ErrorState } from '../../../../components/Feedback';
import { Button, PageHeader, Select, Stack } from '../../../../components/ui';
import { PrimaryDashboardMetrics, SecondaryDashboardMetrics } from '../../DashboardMetrics';
import { RecoveryChart } from '../../RecoveryChart';
import { PortfolioDistribution } from '../../PortfolioDistribution';
import { OperationalPanels } from '../../OperationalPanels';
import { RecentAgreements } from '../../RecentAgreements';
import { WorkPanels } from '../../WorkPanels';
import * as S from './styles';
export default function Dashboard() {
  const { data: db, isLoading, refetch } = useDatabase();
  const { creditorId } = useWorkspace();
  const [view, setView] = useState('Carteira e território');
  const [period, setPeriod] = useState<DashboardPeriod>('6');
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const overview = DashboardService.overview(db, creditorId, period);
  const m = overview.current;
  const exportData = () =>
    download(
      'indicadores.csv',
      [
        ['Indicador', 'Valor', 'Unidade', 'Início', 'Fim'],
        ['Carteira administrada', m.managed / 100, 'BRL'],
        ['Saldo elegível', m.eligible / 100, 'BRL'],
        ['Recebido', m.received / 100, 'BRL'],
        ['Taxa de recuperação', m.managed ? m.recovery : '', '%'],
        ['Valor negociado', m.negotiated / 100, 'BRL'],
        ['Acordos ativos', overview.active, 'acordos'],
        ['Inadimplência', overview.delinquency ?? '', '%'],
        ['Eficiência operacional', overview.efficiency ?? '', '%'],
      ]
        .map((r, i) =>
          (i ? [...r, overview.window.start, overview.window.end] : r).map(csvCell).join(';'),
        )
        .join('\r\n'),
    );
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Recuperação de crédito · Visão financeira e operacional"
        actions={
          view === 'Recuperação e operação' && (
            <Button onClick={exportData}>
              <Download />
              Exportar indicadores
            </Button>
          )
        }
      />
      <Stack>
        <SectionTabs
          label="Visões dos indicadores"
          options={['Carteira e território', 'Recuperação e operação']}
          value={view}
          onChange={setView}
          panelId="dashboard-view"
        />
        <div id="dashboard-view" role="tabpanel" aria-label={view}>
          <div hidden={view !== 'Carteira e território'}>
            <PortfolioIntelligence key={creditorId} db={db} creditorId={creditorId} />
          </div>
          <div hidden={view !== 'Recuperação e operação'}>
            <Stack>
              <div>
                <h2>Recuperação e operação</h2>
                <p>Recebimentos confirmados, acordos e produtividade no período.</p>
              </div>
              <S.Filters>
                <label>
                  <CalendarRange size={15} />
                  Período
                  <Select
                    aria-label="Período dos indicadores"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as DashboardPeriod)}
                  >
                    <option value="1">Mês atual</option>
                    <option value="3">Últimos 3 meses</option>
                    <option value="6">Últimos 6 meses</option>
                    <option value="all">Todo o histórico</option>
                  </Select>
                </label>
                <p>
                  {date(overview.window.start)} – {date(overview.window.end)} ·{' '}
                  {creditorId
                    ? db.creditors.find((c) => c.id === creditorId)?.name
                    : 'Todos os credores'}
                </p>
              </S.Filters>
              <PrimaryDashboardMetrics overview={overview} />
              <S.ChartColumns>
                <RecoveryChart overview={overview} />
                <PortfolioDistribution overview={overview} />
              </S.ChartColumns>
              <SecondaryDashboardMetrics overview={overview} />
              <OperationalPanels overview={overview} />
              <S.ChartColumns $top>
                <RecentAgreements db={db} overview={overview} />
                <WorkPanels overview={overview} />
              </S.ChartColumns>
              <S.Note>
                Dados fictícios. Período aplicado a recebimentos, formalizações e atendimentos.
                Saldos, situações e pendências mostram a posição atual. Comparações indisponíveis
                são omitidas.
              </S.Note>
            </Stack>
          </div>
        </div>
      </Stack>
    </>
  );
}
