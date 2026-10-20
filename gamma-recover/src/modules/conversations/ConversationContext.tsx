import type { Database, Debt } from '../../types/domain';
import { agreementStatus, contactBlocked } from '../../services/domain';
import { Link } from 'react-router-dom';
import { locationLabel } from '../../services/location';
import { date, money } from '../../utils/format';
import { ContextDetails, Panel, PanelBody, PanelHeader, Status } from '../../components/ui';
export function ConversationContext({ db, debt }: { db: Database; debt?: Debt }) {
  if (!debt) return null;
  const person = db.debtors.find((d) => d.id === debt.debtorId)!;
  const portfolio = db.portfolios.find((p) => p.id === debt.portfolioId)!;
  const agreements = db.agreements.filter((agreement) => agreement.debtId === debt.id);
  const nextTask = (db.tasks || [])
    .filter((task) => task.debtId === debt.id && !task.completedAt)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  return (
    <Panel aria-label="Contexto do contrato na conversa">
      <PanelHeader>
        <h2>Contexto do contrato</h2>
      </PanelHeader>
      <PanelBody>
        <ContextDetails>
          <dt>Contrato</dt>
          <dd>{debt.reference}</dd>
          <dt>Empresa</dt>
          <dd>{db.creditors.find((c) => c.id === portfolio.creditorId)?.name}</dd>
          <dt>Carteira</dt>
          <dd>{portfolio.name}</dd>
          <dt>Valor original</dt>
          <dd>{money(debt.amount)}</dd>
          <dt>Vencimento</dt>
          <dd>{date(debt.dueDate)}</dd>
          <dt>Localização</dt>
          <dd>{locationLabel(person.location)}</dd>
          <dt>Contato</dt>
          <dd>
            <Status>
              {contactBlocked(db, debt)
                ? 'Bloqueado neste contrato'
                : 'Sujeito à validação do canal'}
            </Status>
          </dd>
          <dt>Acordos</dt>
          <dd>
            {agreements.length
              ? agreements.map((agreement) => (
                  <div key={agreement.id}>
                    <Link to={`/acordos?acordo=${agreement.id}`}>
                      {agreementStatus(db, agreement)} · {money(agreement.total)}
                    </Link>
                  </div>
                ))
              : 'Nenhum acordo'}
          </dd>
          <dt>Próxima tarefa</dt>
          <dd>
            {nextTask ? (
              <Link to="/tarefas">
                {nextTask.title} · {date(nextTask.dueDate)}
              </Link>
            ) : (
              'Nenhuma tarefa pendente'
            )}
          </dd>
        </ContextDetails>
      </PanelBody>
    </Panel>
  );
}
