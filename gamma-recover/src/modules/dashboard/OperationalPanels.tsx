import { Link } from 'react-router-dom';
import { useTheme } from 'styled-components';
import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTip } from 'recharts';
import { Tooltip } from '../../components/Tooltip';
import type { DashboardOverview } from '../../services/dashboard';
import { Empty, Muted, Panel, PanelHeader } from '../../components/ui';
import * as S from './pages/Dashboard/styles';
export function OperationalPanels({ overview }: { overview: DashboardOverview }) {
  const theme = useTheme();
  const colors: Record<string, string> = {
    Ativo: theme.brand.accent,
    'Em atraso': theme.status.warning,
    Cumprido: theme.status.success,
    Rompido: theme.status.danger,
    Pendente: theme.status.info,
    Cancelado: theme.chart.muted,
  };
  const states = overview.states.filter((s) => s.count > 0);
  const total = states.reduce((n, s) => n + s.count, 0);
  return (
    <S.OperationsColumns>
      <Panel>
        <PanelHeader>
          <h2>Cobertura da operação</h2>
          <Tooltip label="funil operacional">
            Pessoas únicas no credor selecionado. Etapas cumulativas: base, pessoas com atendimento,
            com contato efetivo e com contato e acordo registrados no período. A sobreposição não
            atribui causalidade ao atendimento.
          </Tooltip>
        </PanelHeader>
        <S.Funnel>
          {overview.funnel.map((stage, i) => (
            <li key={stage.name}>
              <div>
                <span>{stage.name}</span>
                <strong>
                  {stage.count}
                  <small>
                    {overview.funnel[0].count
                      ? ((stage.count / overview.funnel[0].count) * 100).toFixed(0)
                      : 0}
                    % da base
                  </small>
                </strong>
              </div>
              <S.Track>
                <S.Fill
                  $width={
                    overview.funnel[0].count ? (stage.count / overview.funnel[0].count) * 100 : 0
                  }
                  $muted={i > 1}
                />
              </S.Track>
            </li>
          ))}
        </S.Funnel>
        <S.Note>
          {overview.contacts.length}{' '}
          {overview.contacts.length === 1 ? 'atendimento' : 'atendimentos'} ·{' '}
          {overview.contacts.filter((c) => c.result === 'Promessa de pagamento').length} promessas
          registradas. <Link to="/cobranca">Abrir fila de cobrança →</Link>
        </S.Note>
      </Panel>
      <Panel>
        <PanelHeader>
          <h2>Acordos por situação</h2>
          <Muted>Posição atual</Muted>
        </PanelHeader>
        {total ? (
          <S.StatusGrid>
            <div>
              <ResponsiveContainer width="100%" height={160} minWidth={0}>
                <PieChart accessibilityLayer>
                  <Pie
                    data={states}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={65}
                    paddingAngle={2}
                    stroke={theme.background.surface}
                    isAnimationActive={false}
                  >
                    {states.map((s) => (
                      <Cell key={s.name} fill={colors[s.name]} />
                    ))}
                    <Label
                      value={total}
                      position="center"
                      fontSize={24}
                      fontWeight={600}
                      fill={theme.text.primary}
                    />
                  </Pie>
                  <ChartTip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <S.ChartTooltip>
                          {payload[0].name}: <strong>{payload[0].value} acordo(s)</strong>
                        </S.ChartTooltip>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <S.StatusLegend aria-label="Situações dos acordos">
              {overview.states.map((s) => (
                <li key={s.name}>
                  <S.Dot $color={colors[s.name]} />
                  {s.name}
                  <strong>{s.count}</strong>
                </li>
              ))}
            </S.StatusLegend>
          </S.StatusGrid>
        ) : (
          <Empty>
            <h2>Nenhum acordo nesta seleção</h2>
            <Link to="/negociacoes">Abrir negociação</Link>
          </Empty>
        )}
        <S.Note>Inclui cancelados para preservar a leitura do histórico operacional.</S.Note>
      </Panel>
    </S.OperationsColumns>
  );
}
