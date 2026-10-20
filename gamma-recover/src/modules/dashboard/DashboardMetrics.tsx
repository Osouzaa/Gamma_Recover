import type { DashboardOverview } from '../../services/dashboard';
import { money } from '../../utils/format';
import { MetricCard } from '../../components/MetricCard';
import { PrimaryMetrics, SecondaryMetrics } from './pages/Dashboard/styles';
const percent = (value: number | undefined) =>
  value === undefined ? '—' : `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
export function PrimaryDashboardMetrics({ overview: o }: { overview: DashboardOverview }) {
  return (
    <PrimaryMetrics aria-label="Indicadores financeiros">
      <MetricCard
        label="Carteira administrada"
        value={money(o.current.managed)}
        description={`${o.current.debts.length} contratos na base`}
        explanation="Soma dos valores originais dos contratos no credor selecionado. Posição atual: não há snapshots para comparação histórica."
      />
      <MetricCard
        label="Saldo elegível"
        value={money(o.current.eligible)}
        description="Disponível para negociação"
        explanation="Saldo sem acordo vigente, bloqueio ou contestação, em carteiras ativas. Não representa todo o saldo em aberto."
      />
      <MetricCard
        label="Recuperação no período"
        value={money(o.current.received)}
        description="Recebimentos confirmados ao credor"
        explanation="Parcelas explicitamente conciliadas pela data do recebimento. A variação usa a janela imediatamente anterior, com o mesmo número de dias, quando há registros anteriores."
        change={o.receivedVariation}
        note="Sem base anterior para comparar"
        emphasis
      />
      <MetricCard
        label="Taxa de recuperação"
        value={o.current.managed ? percent(o.current.recovery) : '—'}
        description="Recebido / carteira administrada"
        explanation="Recebimentos no período divididos pelo saldo original atual. Sem comparação de taxa histórica, pois a base não possui snapshots da carteira."
        note="Base: saldo original atual"
      />
    </PrimaryMetrics>
  );
}
export function SecondaryDashboardMetrics({ overview: o }: { overview: DashboardOverview }) {
  return (
    <SecondaryMetrics aria-label="Indicadores operacionais">
      <MetricCard
        label="Valor negociado"
        value={money(o.current.negotiated)}
        description="Formalizado no período selecionado"
        explanation="Soma dos acordos não cancelados pela data de formalização. A comparação considera registros existentes na janela anterior equivalente."
        change={o.negotiatedVariation}
        note="Sem base anterior para comparar"
      />
      <MetricCard
        label="Acordos ativos"
        value={String(o.active)}
        description="Sem parcelas vencidas"
        explanation="Acordos ativos na posição atual, sem cancelamento, rompimento ou parcelas vencidas. Não há histórico de mudanças de estado para comparação."
      />
      <MetricCard
        label="Inadimplência dos acordos"
        value={percent(o.delinquency)}
        description={`${o.late} em atraso · ${o.active + o.late} em acompanhamento`}
        explanation="Quantidade de acordos em atraso dividida pela soma de Ativos e Em atraso. Rompidos, cumpridos, cancelados e pendentes são mostrados separadamente no gráfico de situações."
      />
      <MetricCard
        label="Eficiência operacional"
        value={percent(o.efficiency)}
        description={`${o.reached.length} ${o.reached.length === 1 ? 'contato efetivo' : 'contatos efetivos'} / ${o.contacts.length} ${o.contacts.length === 1 ? 'atendimento' : 'atendimentos'}`}
        explanation="Contatos realizados, retornos agendados e promessas divididos pelos atendimentos registrados no período. Não mede recuperação financeira nem atribui recebimentos aos contatos. A variação é em pontos percentuais."
        change={
          o.efficiency !== undefined && o.previousEfficiency !== undefined
            ? o.efficiency - o.previousEfficiency
            : undefined
        }
        unit="p.p."
        note={o.contacts.length ? 'Sem atendimentos anteriores' : 'Sem atendimentos no período'}
      />
    </SecondaryMetrics>
  );
}
