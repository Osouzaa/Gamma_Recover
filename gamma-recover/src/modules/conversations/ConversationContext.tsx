import type { Database, Debt } from '../../types/domain';
import { contactBlocked } from '../../services/domain';
import { locationLabel } from '../../services/location';
import { date, money } from '../../utils/format';
import { ContextDetails, Panel, PanelBody, PanelHeader, Status } from '../../components/ui';
export function ConversationContext({ db, debt }: { db: Database; debt?: Debt }) {
  if (!debt) return null;
  const person = db.debtors.find((d) => d.id === debt.debtorId)!;
  const portfolio = db.portfolios.find((p) => p.id === debt.portfolioId)!;
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
        </ContextDetails>
      </PanelBody>
    </Panel>
  );
}
