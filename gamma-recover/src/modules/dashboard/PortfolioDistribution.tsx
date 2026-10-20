import type { DashboardOverview } from '../../services/dashboard';
import { money } from '../../utils/format';
import { Empty, Panel, PanelHeader, Muted } from '../../components/ui';
import * as S from './pages/Dashboard/styles';
export function PortfolioDistribution({ overview }: { overview: DashboardOverview }) {
  return (
    <Panel>
      <PanelHeader>
        <h2>Composição da carteira</h2>
        <Muted>Posição atual</Muted>
      </PanelHeader>
      <S.Distribution>
        {overview.creditors.length ? (
          overview.creditors.map((c) => (
            <div key={c.id}>
              <h3>{c.name.replace(' · fictícia', '')}</h3>
              <p>
                <strong>{money(c.amount)}</strong>
                <small>{c.share.toFixed(1).replace('.', ',')}%</small>
              </p>
              <S.Track>
                <S.Fill $width={c.share} />
              </S.Track>
              <small>{c.count} contratos · credor fictício</small>
            </div>
          ))
        ) : (
          <Empty>Nenhum credor nesta seleção.</Empty>
        )}
      </S.Distribution>
      <S.Quality>
        <span>
          <strong>{overview.current.debts.length}</strong> contratos
        </span>
        <span>
          <strong>{overview.blocked}</strong> bloqueados
        </span>
        <span>
          <strong>{overview.disputed}</strong> contestados
        </span>
      </S.Quality>
      <S.Note>
        Participação sobre o saldo original. Bloqueios e contestações podem se sobrepor.
      </S.Note>
    </Panel>
  );
}
