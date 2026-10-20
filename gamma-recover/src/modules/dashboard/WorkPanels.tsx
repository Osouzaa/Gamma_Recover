import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, GitCompareArrows, ShieldAlert } from 'lucide-react';
import type { DashboardOverview } from '../../services/dashboard';
import { date, money } from '../../utils/format';
import { Muted, Panel, PanelHeader } from '../../components/ui';
import * as S from './pages/Dashboard/styles';
export function WorkPanels({ overview }: { overview: DashboardOverview }) {
  return (
    <Panel>
      <PanelHeader>
        <h2>Atenção da operação</h2>
        <Muted>Posição atual</Muted>
      </PanelHeader>
      <S.WorkList>
        <li>
          <Link to="/financeiro?situacao=Divergência">
            <span>
              <h3>
                <GitCompareArrows size={13} /> Pendências de conciliação
              </h3>
              <small>{overview.divergences.length} divergências sem recebimento confirmado</small>
            </span>
            <strong>{overview.divergences.length}</strong>
          </Link>
        </li>
        <li>
          <Link to="/negociacoes">
            <span>
              <h3>
                <ShieldAlert size={13} /> Propostas para aprovação
              </h3>
              <small>Revisão de condições dentro da política</small>
            </span>
            <strong>{overview.pendingApprovals.length}</strong>
          </Link>
        </li>
        <li>
          <Link to="/financeiro?situacao=Vencida">
            <span>
              <h3>Parcelas vencidas</h3>
              <small>Saldo aberto em acordos em acompanhamento</small>
            </span>
            <strong>{money(overview.current.overdue)}</strong>
          </Link>
        </li>
      </S.WorkList>
      <PanelHeader>
        <h2>Próximos vencimentos</h2>
        <CalendarClock size={15} />
      </PanelHeader>
      <S.WorkList>
        {overview.nextDue.slice(0, 3).map((i) => (
          <li key={i.id}>
            <Link to={`/acordos?acordo=${i.agreementId}`}>
              <span>
                {i.number ? `Parcela ${i.number}` : 'Entrada'}
                <small>
                  {date(i.dueDate)} · {i.agreementId.slice(0, 12)}
                </small>
              </span>
              <strong>{money(i.amount)}</strong>
            </Link>
          </li>
        ))}
      </S.WorkList>
      <S.Note>
        {overview.nextDue.length
          ? `${overview.nextDue.length} parcelas abertas entre hoje e os próximos 7 dias.`
          : 'Nenhuma parcela aberta com vencimento nos próximos 7 dias.'}{' '}
        <Link to="/financeiro?situacao=A vencer">
          Ver financeiro <ArrowRight size={11} />
        </Link>
      </S.Note>
    </Panel>
  );
}
