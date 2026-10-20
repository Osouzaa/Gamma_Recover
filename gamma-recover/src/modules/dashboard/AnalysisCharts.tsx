import { useTheme } from 'styled-components';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PortfolioAnalysis } from '../../services/portfolioAnalytics';
import { money } from '../../utils/format';
import { DataTable } from '../../components/DataTable';
import { Empty, Panel, PanelHeader } from '../../components/ui';
import { OperationsColumns, Note } from './pages/Dashboard/styles';
import { Chart, Details } from './analysisStyles';
const compact = (value: number) =>
  new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value / 100,
  );
export function AnalysisCharts({ data }: { data: PortfolioAnalysis }) {
  const theme = useTheme();
  const points = data.forecast.map((p) => ({
    ...p,
    name: new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC',
    }).format(new Date(`${p.month}-01T12:00:00Z`)),
  }));
  const tick = { fill: theme.text.secondary, fontSize: 11 };
  return (
    <OperationsColumns>
      <Panel>
        <PanelHeader>
          <h2>Distribuição por tempo de atraso</h2>
          <span>R$</span>
        </PanelHeader>
        {data.rows.length ? (
          <Chart
            $height={320}
            role="img"
            aria-label="Gráfico de valores por faixa de atraso; dados exatos disponíveis a seguir"
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={data.aging}
                layout="vertical"
                margin={{ left: 0, right: 16, top: 8, bottom: 8 }}
                accessibilityLayer
              >
                <CartesianGrid stroke={theme.chart.grid} horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={compact}
                  tick={tick}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={135}
                  tick={tick}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => money(Number(value))}
                  cursor={{ fill: theme.background.hover }}
                />
                <Bar
                  name="Valor"
                  dataKey="amount"
                  fill={theme.chart.current}
                  radius={[0, 3, 3, 0]}
                  isAnimationActive={false}
                  maxBarSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </Chart>
        ) : (
          <Empty>Nenhum registro para esta seleção.</Empty>
        )}
        <Note>
          Faixas exclusivas pela data de vencimento. Cinco anos completos ficam na última faixa.
        </Note>
        <Details>
          <summary>Ver valores das faixas de atraso</summary>
          <DataTable
            rows={data.aging}
            rowKey={(r) => r.name}
            columns={[
              { key: 'name', label: 'Faixa', render: (r) => r.name },
              { key: 'count', label: 'Registros', numeric: true, render: (r) => r.count },
              { key: 'amount', label: 'Valor', numeric: true, render: (r) => money(r.amount) },
            ]}
          />
        </Details>
      </Panel>
      <Panel>
        <PanelHeader>
          <h2>Agenda de vencimentos</h2>
          <span>Próximos 6 meses · R$</span>
        </PanelHeader>
        {points.some((p) => p.amount) ? (
          <Chart
            $height={320}
            role="img"
            aria-label="Gráfico de valores a vencer por mês; dados exatos disponíveis a seguir"
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={points}
                margin={{ left: 0, right: 8, top: 20, bottom: 8 }}
                accessibilityLayer
              >
                <CartesianGrid stroke={theme.chart.grid} vertical={false} />
                <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} />
                <YAxis
                  width={65}
                  tickFormatter={compact}
                  tick={tick}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => money(Number(value))}
                  cursor={{ fill: theme.background.hover }}
                />
                <Bar
                  name="A vencer"
                  dataKey="amount"
                  fill={theme.status.info}
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={false}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          </Chart>
        ) : (
          <Empty>Sem vencimentos de hoje até o fim dos próximos seis meses nesta seleção.</Empty>
        )}
        <Note>
          Agenda contratual, sem previsão de recebimento. Mês atual inclui somente hoje e datas
          futuras.
        </Note>
        <Details>
          <summary>Ver valores dos vencimentos mensais</summary>
          <DataTable
            rows={points}
            rowKey={(r) => r.month}
            columns={[
              { key: 'month', label: 'Mês', render: (r) => r.name },
              { key: 'count', label: 'Registros', numeric: true, render: (r) => r.count },
              { key: 'amount', label: 'A vencer', numeric: true, render: (r) => money(r.amount) },
            ]}
          />
        </Details>
      </Panel>
    </OperationsColumns>
  );
}
