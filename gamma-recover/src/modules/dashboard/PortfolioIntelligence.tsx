import { useState } from 'react';
import { Download } from 'lucide-react';
import type { Database } from '../../types/domain';
import {
  analysisCSV,
  defaultAnalysisFilters,
  portfolioAnalytics,
  type AnalysisBasis,
  type Maturity,
} from '../../services/portfolioAnalytics';
import { date, download, money } from '../../utils/format';
import { MetricCard } from '../../components/MetricCard';
import { DataTable } from '../../components/DataTable';
import { Button, Empty, Panel, PanelHeader, Select } from '../../components/ui';
import { AnalysisCharts } from './AnalysisCharts';
import { GeographyPanel } from './GeographyPanel';
import { Analysis, AnalysisFilters, Context, Details, Heading } from './analysisStyles';
import { PrimaryMetrics, Note } from './pages/Dashboard/styles';
import { Link } from 'react-router-dom';
export function PortfolioIntelligence({ db, creditorId }: { db: Database; creditorId: string }) {
  const [basis, setBasis] = useState<AnalysisBasis>('combined');
  const [maturity, setMaturity] = useState<Maturity>('all');
  const [portfolioId, setPortfolioId] = useState('');
  const [city, setCity] = useState('');
  const data = portfolioAnalytics(db, {
    ...defaultAnalysisFilters,
    creditorId,
    basis,
    maturity,
    portfolioId,
    city,
  });
  const percent = (value?: number) =>
    value === undefined ? '—' : `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  const unit = basis === 'debts' ? 'dívidas' : basis === 'installments' ? 'parcelas' : 'registros';
  return (
    <Analysis aria-label="Análise de carteira e território">
      <Heading>
        <div>
          <h2>Carteira, vencimentos e território</h2>
          <p>
            Posição em {date(data.asOf)} ·{' '}
            {basis === 'combined'
              ? 'Dívidas sem acordo + parcelas em aberto, sem dupla contagem'
              : basis === 'debts'
                ? 'Dívidas sem acordo não cancelado'
                : 'Parcelas não pagas de acordos em acompanhamento'}
          </p>
        </div>
        <Button onClick={() => download('analise-carteira.csv', analysisCSV(data))}>
          <Download size={16} />
          Exportar análise
        </Button>
      </Heading>
      <AnalysisFilters>
        <label>
          Base analisada
          <Select
            aria-label="Base da análise"
            value={basis}
            onChange={(e) => {
              setBasis(e.target.value as AnalysisBasis);
              setCity('');
            }}
          >
            <option value="combined">Visão consolidada</option>
            <option value="debts">Dívidas sem acordo</option>
            <option value="installments">Parcelas em aberto</option>
          </Select>
        </label>
        <label>
          Carteira
          <Select
            aria-label="Carteira da análise"
            value={portfolioId}
            onChange={(e) => {
              setPortfolioId(e.target.value);
              setCity('');
            }}
          >
            <option value="">Todas as carteiras</option>
            {db.portfolios
              .filter((p) => !creditorId || p.creditorId === creditorId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </Select>
        </label>
        <label>
          Vencimento
          <Select
            aria-label="Vencimento da análise"
            value={maturity}
            onChange={(e) => setMaturity(e.target.value as Maturity)}
          >
            <option value="all">Todos os vencimentos</option>
            <option value="upcoming">A vencer e hoje</option>
            <option value="overdue">Todos os vencidos</option>
            <option value="under5">Vencidos há menos de 5 anos</option>
            <option value="older5">Vencidos há 5 anos ou mais</option>
          </Select>
        </label>
        <label>
          Cidade / UF
          <Select
            aria-label="Cidade da análise"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">Todas as localidades</option>
            {data.cities.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
        <Button
          onClick={() => {
            setBasis('combined');
            setPortfolioId('');
            setCity('');
            setMaturity('all');
          }}
        >
          Limpar filtros da análise
        </Button>
      </AnalysisFilters>
      <PrimaryMetrics aria-label="Indicadores de vencimento">
        <MetricCard
          label="Valor em análise"
          value={money(data.total)}
          description={`${data.rows.length} ${unit} · ${data.contracts} contratos`}
          explanation={
            basis === 'combined'
              ? 'Dívidas sem acordo não cancelado somadas às parcelas não pagas de acordos não cancelados e não rompidos. Não duplica dívida e acordo. Bloqueios operacionais não apagam valores. Não representa o saldo oficial no ERP.'
              : basis === 'debts'
                ? 'Valores originais somente de dívidas sem acordo não cancelado. Inclui bloqueadas, suspensas e carteiras inativas. Não soma valores já convertidos em acordos.'
                : 'Parcelas não pagas de acordos não cancelados e não rompidos. Não soma a dívida original; não é previsão de recebimento.'
          }
        />
        <MetricCard
          label="Valor vencido"
          value={money(data.overdue)}
          description={`${percent(data.overdueShare)} do valor em análise`}
          explanation="Vencimentos estritamente anteriores à data de referência. Percentual = valor vencido / valor em análise, após todos os filtros desta seção."
          emphasis
        />
        <MetricCard
          label="Valor a vencer"
          value={money(data.upcoming)}
          description={`${money(data.dueToday)} vencem hoje`}
          explanation="Vencimentos iguais ou posteriores a hoje. Inclui hoje, discriminado abaixo do valor. Vencido + a vencer = valor em análise."
        />
        <MetricCard
          label="Vencidos há menos de 5 anos"
          value={money(data.under5)}
          description={`Vencidos há 5 anos ou mais: ${money(data.older5)}`}
          explanation={`Vencimento posterior a ${date(data.cutoff)} e anterior a hoje. Cinco anos completos ficam no grupo de cinco anos ou mais. É um recorte temporal, sem conclusão jurídica sobre prescrição. Na base de parcelas, usa o vencimento da parcela.`}
        />
      </PrimaryMetrics>
      <Context aria-label="Contexto da carteira">
        <span>
          <strong>{data.people}</strong> {data.people === 1 ? 'pessoa única' : 'pessoas únicas'}
        </span>
        <span>
          <strong>{money(data.next30)}</strong> vencem em até 30 dias, incluindo hoje
        </span>
        <span>
          <strong>{percent(data.locationCoverage)}</strong> do valor com cidade/UF
        </span>
        {basis !== 'installments' && (
          <span>
            <strong>{money(data.eligible)}</strong> elegíveis para negociar
          </span>
        )}
      </Context>
      {!data.rows.length && (
        <Empty>
          Sem registros para os filtros selecionados. Limpe os filtros ou escolha outra base.
        </Empty>
      )}
      <AnalysisCharts data={data} />
      <GeographyPanel data={data} onCity={setCity} />
      <Panel>
        <PanelHeader>
          <h2>Registros que compõem a análise</h2>
          <span>
            {data.rows.length} {unit}
          </span>
        </PanelHeader>
        <Details>
          <summary>Consultar contratos, vencimentos e valores</summary>
          <DataTable
            rows={data.rows}
            rowKey={(r) => r.id}
            pageSize={8}
            columns={[
              {
                key: 'person',
                label: 'Devedor',
                render: (r) => <Link to={`/devedores/${r.debtorId}`}>{r.name}</Link>,
              },
              {
                key: 'reference',
                label: 'Contrato / parcela',
                render: (r) => `${r.reference}${r.installment ? ` · ${r.installment}` : ''}`,
              },
              { key: 'company', label: 'Empresa', render: (r) => r.company },
              { key: 'city', label: 'Cidade / UF', render: (r) => r.city },
              {
                key: 'dueDate',
                label: 'Vencimento',
                render: (r) => date(r.dueDate),
                sortValue: (r) => r.dueDate,
              },
              {
                key: 'amount',
                label: 'Valor',
                numeric: true,
                render: (r) => money(r.amount),
                sortValue: (r) => r.amount,
              },
              {
                key: 'state',
                label: 'Situação',
                render: (r) =>
                  r.dueDate < data.asOf
                    ? 'Vencido'
                    : r.dueDate === data.asOf
                      ? 'Vence hoje'
                      : 'A vencer',
              },
            ]}
          />
        </Details>
        <Note>
          Filtros desta seção se aplicam aos indicadores, gráficos, registros e exportação da
          análise. Recuperação e operação abaixo mantêm o filtro de período próprio.
        </Note>
      </Panel>
    </Analysis>
  );
}
