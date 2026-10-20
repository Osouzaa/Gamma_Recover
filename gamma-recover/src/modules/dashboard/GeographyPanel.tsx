import { useTheme } from 'styled-components';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PortfolioAnalysis } from '../../services/portfolioAnalytics';
import { money } from '../../utils/format';
import { Button, Empty, Panel, PanelHeader } from '../../components/ui';
import { DataTable } from '../../components/DataTable';
import { Chart, Details } from './analysisStyles';
import { Note } from './pages/Dashboard/styles';
export function GeographyPanel({
  data,
  onCity,
}: {
  data: PortfolioAnalysis;
  onCity: (key: string) => void;
}) {
  const theme = useTheme();
  const top = data.geography.slice(0, 7);
  const remaining = data.geography.slice(7);
  const chart = [
    ...top,
    ...(remaining.length
      ? [
          {
            key: 'others',
            name: 'Demais localidades',
            amount: remaining.reduce((s, r) => s + r.amount, 0),
          },
        ]
      : []),
  ];
  return (
    <Panel>
      <PanelHeader>
        <h2>Onde está concentrada a carteira</h2>
        <span>Valor por cidade / UF · R$</span>
      </PanelHeader>
      {data.rows.length ? (
        <Chart
          $height={Math.max(200, chart.length * 36 + 45)}
          role="img"
          aria-label="Distribuição de valores por cidade; todas as cidades estão na tabela a seguir"
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={chart}
              layout="vertical"
              margin={{ top: 8, right: 20, bottom: 8 }}
              accessibilityLayer
            >
              <CartesianGrid stroke={theme.chart.grid} horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(value) =>
                  new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(value / 100)
                }
                tick={{ fill: theme.text.secondary, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={155}
                tick={{ fill: theme.text.secondary, fontSize: 11 }}
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
                fill={theme.status.info}
                maxBarSize={20}
                radius={[0, 3, 3, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </Chart>
      ) : (
        <Empty>Nenhum registro para distribuir por cidade.</Empty>
      )}
      <Note>
        Localização do cadastro da pessoa. Sem cidade/UF, o valor permanece em “Localização não
        informada”. Até sete localidades em destaque; as demais são agrupadas.
      </Note>
      <Details open>
        <summary>Comparar cidades e detalhar os registros</summary>
        <DataTable
          rows={data.geography}
          rowKey={(r) => r.key}
          pageSize={5}
          columns={[
            {
              key: 'city',
              label: 'Cidade / UF',
              render: (r) => (
                <Button onClick={() => onCity(r.key)} aria-label={`Filtrar cidade ${r.name}`}>
                  {r.name}
                </Button>
              ),
            },
            { key: 'people', label: 'Pessoas', numeric: true, render: (r) => r.people },
            {
              key: 'amount',
              label: 'Valor',
              numeric: true,
              render: (r) => money(r.amount),
              sortValue: (r) => r.amount,
            },
            {
              key: 'overdue',
              label: 'Vencido',
              numeric: true,
              render: (r) => money(r.overdue),
              sortValue: (r) => r.overdue,
            },
            {
              key: 'share',
              label: '% do valor',
              numeric: true,
              render: (r) => `${r.share.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`,
            },
          ]}
        />
      </Details>
    </Panel>
  );
}
