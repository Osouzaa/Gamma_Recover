import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from 'styled-components';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardOverview } from '../../services/dashboard';
import { date, money } from '../../utils/format';
import { Empty, Panel, PanelHeader } from '../../components/ui';
import * as S from './pages/Dashboard/styles';
export function RecoveryChart({ overview }: { overview: DashboardOverview }) {
  const theme = useTheme();
  const [compare, setCompare] = useState(true);
  const hasPrevious = overview.series.some((s) => s.previous !== undefined);
  const hasData = overview.series.some((s) => s.received > 0 || (s.previous || 0) > 0);
  return (
    <Panel>
      <PanelHeader>
        <h2>Evolução dos recebimentos</h2>
        {hasPrevious && (
          <label>
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
            />{' '}
            Comparar período anterior
          </label>
        )}
      </PanelHeader>
      <S.SummaryLine>
        <strong>{money(overview.current.received)}</strong>
        <span>recebidos diretamente ao credor</span>
      </S.SummaryLine>
      {hasData ? (
        <S.ChartFrame>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart
              data={overview.series}
              margin={{ top: 18, right: 12, bottom: 8, left: 0 }}
              accessibilityLayer
            >
              <CartesianGrid stroke={theme.chart.grid} vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.text.secondary, fontSize: 11 }}
                minTickGap={16}
              />
              <YAxis
                width={58}
                tickLine={false}
                axisLine={false}
                tick={{ fill: theme.text.secondary, fontSize: 11 }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat('pt-BR', {
                    notation: 'compact',
                    maximumFractionDigits: 1,
                  }).format(value / 100)
                }
              />
              <Tooltip
                content={({ active, payload }) => {
                  const point = payload?.[0]?.payload as
                    DashboardOverview['series'][number] | undefined;
                  return active && point ? (
                    <S.ChartTooltip>
                      <p>
                        {date(point.start)} – {date(point.end)}
                      </p>
                      <div>
                        Recebido: <strong>{money(point.received)}</strong>
                      </div>
                      {compare && point.previous !== undefined && (
                        <div>
                          <p>
                            Anterior: {date(point.previousStart!)} – {date(point.previousEnd!)}
                          </p>
                          <strong>{money(point.previous)}</strong>
                        </div>
                      )}
                    </S.ChartTooltip>
                  ) : null;
                }}
              />
              {compare && hasPrevious && (
                <Area
                  name="Janela anterior"
                  dataKey="previous"
                  stroke={theme.chart.previous}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="none"
                  isAnimationActive={false}
                />
              )}
              <Area
                name="Recebido"
                dataKey="received"
                type="linear"
                stroke={theme.chart.current}
                strokeWidth={2.5}
                fill={theme.brand.accent}
                fillOpacity={0.09}
                activeDot={{ r: 4, stroke: theme.background.surface, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </S.ChartFrame>
      ) : (
        <Empty>
          <h2>Nenhum recebimento no período</h2>
          <p>Os valores aparecem após a conciliação de parcelas.</p>
          <Link to="/financeiro">Consultar financeiro</Link>
        </Empty>
      )}
      <S.Legend>
        <span>
          <i />
          Recebido no período
        </span>
        {hasPrevious && compare && (
          <span>
            <i data-previous />
            Janela anterior de {overview.window.days} dias
          </span>
        )}
        <span>Valores em R$</span>
      </S.Legend>
    </Panel>
  );
}
