import { ProposalSummary } from './styles';
import { useState } from 'react';
import type { Database, Proposal } from '../../types/domain';
import type { Scope } from '../../services/store';
import { creditorOf, simulate } from '../../services/domain';
import { NegotiationService } from '../../services/operations';
import { useAction } from '../../hooks/useDatabase';
import { money } from '../../utils/format';
import {
  Alert,
  Button,
  Field,
  Form,
  Input,
  Panel,
  PanelBody,
  PanelHeader,
  Row,
  Split,
  Stack,
} from '../../components/ui';
import { Feedback } from '../../components/Feedback';
interface Props {
  db: Database;
  debtId: string;
  scope: Scope;
  initialProposal?: Proposal;
  onConfirmed?: (id: string) => void;
}
export function Simulator({ db, debtId, scope, initialProposal, onConfirmed }: Props) {
  const action = useAction();
  const [discount, setDiscount] = useState(initialProposal?.discount ?? 10);
  const [entry, setEntry] = useState((initialProposal?.entry ?? 0) / 100);
  const [count, setCount] = useState(initialProposal?.count ?? 1);
  const [accepted, setAccepted] = useState(false);
  const [draftId, setDraftId] = useState(initialProposal?.id || '');
  const draft = db.proposals.find((p) => p.id === draftId);
  const review = !!draft;
  const waiting = draft?.status === 'Aguardando aprovação';
  const debt = db.debts.find((d) => d.id === debtId)!;
  const creditor = db.creditors.find((c) => c.id === creditorOf(db, debt))!;
  const policy = creditor.policy;
  let calculation: ReturnType<typeof simulate> | undefined;
  let error = '';
  try {
    calculation = simulate(debt.amount, discount, Math.round(entry * 100), count, policy);
  } catch (e) {
    error = (e as Error).message;
  }
  const change = () => {
    setDraftId('');
    setAccepted(false);
    action.reset();
  };
  return (
    <Split>
      <Panel>
        <PanelHeader>
          <h2>Condições da proposta</h2>
        </PanelHeader>
        <PanelBody>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              if (calculation)
                action.mutate(
                  () =>
                    NegotiationService.propose(
                      scope,
                      debtId,
                      discount,
                      Math.round(entry * 100),
                      count,
                    ),
                  { onSuccess: (r) => setDraftId((r as Proposal).id) },
                );
            }}
          >
            <Alert>
              Política: até {policy.maxDiscount}% de desconto, {policy.maxInstallments} parcelas e
              mínimo de {money(policy.minInstallment)} por parcela. Descontos acima de{' '}
              {policy.approvalAbove ?? policy.maxDiscount}% exigem aprovação demonstrativa do
              administrador.
            </Alert>
            <Field>
              Desconto (%)
              <Input
                type="number"
                min="0"
                max={policy.maxDiscount}
                step="0.1"
                value={Number.isNaN(discount) ? '' : discount}
                onChange={(e) => {
                  setDiscount(e.target.valueAsNumber);
                  change();
                }}
                required
              />
            </Field>
            <Field>
              Entrada (R$)
              <Input
                type="number"
                min="0"
                step="0.01"
                value={Number.isNaN(entry) ? '' : entry}
                onChange={(e) => {
                  setEntry(e.target.valueAsNumber);
                  change();
                }}
                required
              />
            </Field>
            <Field>
              Parcelas após a entrada
              <Input
                type="number"
                min="1"
                max={policy.maxInstallments}
                value={Number.isNaN(count) ? '' : count}
                onChange={(e) => {
                  setCount(e.target.valueAsNumber);
                  change();
                }}
                required
              />
            </Field>
            {error && (
              <Alert $error role="alert">
                {error}
              </Alert>
            )}
            <Button disabled={!calculation || action.isPending || review} type="submit">
              Revisar proposta
            </Button>
          </Form>
        </PanelBody>
      </Panel>
      <Panel>
        <PanelHeader>
          <h2>{review ? 'Confirmação da proposta' : 'Resumo da simulação'}</h2>
        </PanelHeader>
        <PanelBody>
          <Stack>
            <ProposalSummary>
              <dt>Credor</dt>
              <dd>{creditor.name}</dd>
              <dt>Contrato</dt>
              <dd>{debt.reference}</dd>
              <dt>Valor original</dt>
              <dd>{money(debt.amount)}</dd>
              <dt>Desconto</dt>
              <dd>{calculation ? money(debt.amount - calculation.total) : '—'}</dd>
              <dt data-total>Total negociado</dt>
              <dd data-total>
                <strong>{calculation ? money(calculation.total) : '—'}</strong>
              </dd>
              <dt>Entrada</dt>
              <dd>{calculation ? money(calculation.entry) : '—'}</dd>
              <dt>Parcelamento</dt>
              <dd>
                {calculation ? `${count} × ${money(calculation.amounts[0])}` : '—'}
                {calculation && calculation.amounts.at(-1) !== calculation.amounts[0] && (
                  <small> · última: {money(calculation.amounts.at(-1)!)}</small>
                )}
              </dd>
            </ProposalSummary>
            <Alert>
              Pagamentos são destinados diretamente ao credor. A confirmação cria apenas acordo e
              parcelas demonstrativos, sem recebimento automático.
            </Alert>
            {waiting ? (
              <Alert role="status">
                Proposta salva e aguardando aprovação do administrador. A aprovação respeita o
                desconto máximo da política.
              </Alert>
            ) : (
              review && (
                <>
                  {draft.approvedBy && <Alert>Aprovada por {draft.approvedBy}.</Alert>}
                  <Row>
                    <input
                      id="accept-conditions"
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                    />
                    <label htmlFor="accept-conditions">
                      Confirmo o aceite destas condições demonstrativas.
                    </label>
                  </Row>
                  <Button
                    $variant="primary"
                    disabled={
                      !accepted || !calculation || action.isPending || draft.status === 'Aceita'
                    }
                    onClick={() =>
                      action.mutate(
                        () =>
                          NegotiationService.confirm(
                            scope,
                            debtId,
                            discount,
                            Math.round(entry * 100),
                            count,
                            draft.id,
                          ),
                        { onSuccess: (r) => onConfirmed?.((r as { id: string }).id) },
                      )
                    }
                  >
                    Confirmar acordo demonstrativo
                  </Button>
                </>
              )
            )}
            <Feedback error={action.error} />
          </Stack>
        </PanelBody>
      </Panel>
    </Split>
  );
}
