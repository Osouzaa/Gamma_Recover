import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspace } from '../../../../app/providers/Context';
import { useDatabase } from '../../../../hooks/useDatabase';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';
import { scopedDebts } from '../../../../services/operations';
import { activeAgreement, isSuspended } from '../../../../services/domain';
import { money } from '../../../../utils/format';
import { ErrorState, LoadingState } from '../../../../components/Feedback';
import { SectionTabs } from '../../../../components/SectionTabs';
import {
  Alert,
  Button,
  Field,
  Muted,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  Row,
  Select,
  Stack,
} from '../../../../components/ui';
import { Simulator } from '../../Simulator';
import { ProposalHistory } from '../../ProposalHistory';
import { NegotiationSteps } from '../../styles';

export default function Negotiations() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { scope } = useWorkspace();
  const { data: db, isLoading, refetch } = useDatabase();
  const [proposalId, setProposalId] = useState('');
  const [resumeVersion, setResumeVersion] = useState(0);
  const [selected, setSelected] = useState(params.get('divida') || '');
  const [tab, setTab] = useState(
    scope.role === 'Financeiro' ? 'Histórico de propostas' : 'Nova negociação',
  );
  const [step, setStep] = useState(params.get('divida') ? 2 : 1);
  const [resumeStep, setResumeStep] = useState(2);
  const [unsaved, setUnsaved] = useState(false);
  useUnsavedChanges(unsaved, 'Descartar as condições ainda não revisadas e sair da negociação?');
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const eligible = scopedDebts(db, scope).filter(
    (d) =>
      !activeAgreement(db, d.id) &&
      !d.disputed &&
      !isSuspended(d) &&
      !db.debtors.find((v) => v.id === d.debtorId)?.blocked &&
      db.portfolios.find((p) => p.id === d.portfolioId)?.active,
  );
  const debt = selected ? eligible.find((d) => d.id === selected) : eligible[0];
  const person = db.debtors.find((d) => d.id === debt?.debtorId);
  return (
    <>
      <PageHeader
        title="Negociações"
        description="Escolha o contrato, monte a proposta e confirme o acordo após o aceite."
      />
      <Stack>
        <SectionTabs
          label="Área de negociações"
          options={['Nova negociação', 'Histórico de propostas']}
          value={tab}
          onChange={setTab}
          panelId="negotiations-panel"
        />
        <div id="negotiations-panel" role="tabpanel" aria-label={tab}>
          <div hidden={tab !== 'Nova negociação'}>
            <Stack>
              <NegotiationSteps aria-label="Etapas da negociação">
                {['Escolher contrato', 'Montar proposta', 'Confirmar acordo'].map(
                  (label, index) => (
                    <li
                      key={label}
                      aria-current={step === index + 1 ? 'step' : undefined}
                      data-complete={step > index + 1}
                    >
                      {index + 1}. {label}
                    </li>
                  ),
                )}
              </NegotiationSteps>
              {scope.role === 'Financeiro' ? (
                <Alert>
                  Seu perfil permite consultar propostas no histórico. Negociar exige perfil
                  Operador ou Administrador.
                </Alert>
              ) : (
                <>
                  <Panel hidden={step !== 1}>
                    <PanelHeader>
                      <h2>Escolher contrato</h2>
                    </PanelHeader>
                    <PanelBody>
                      <Stack>
                        <Field>
                          Contrato para negociação
                          <Select
                            aria-label="Dívida para negociação"
                            value={debt?.id || ''}
                            onChange={(e) => {
                              if (
                                unsaved &&
                                !window.confirm(
                                  'Descartar as condições ainda não revisadas e trocar de contrato?',
                                )
                              )
                                return;
                              setSelected(e.target.value);
                              setProposalId('');
                              setResumeStep(2);
                              setUnsaved(false);
                            }}
                          >
                            <option value="" disabled>
                              Selecione um contrato
                            </option>
                            {eligible.map((d) => (
                              <option key={d.id} value={d.id}>
                                {db.debtors.find((v) => v.id === d.debtorId)?.name} · {d.reference}{' '}
                                · {money(d.amount)}
                              </option>
                            ))}
                          </Select>
                        </Field>
                        <Muted>
                          A lista inclui contratos disponíveis para negociar, respeitando bloqueios,
                          suspensões e acordos existentes.
                        </Muted>
                        <Row>
                          <Button
                            $variant="primary"
                            disabled={!debt}
                            onClick={() => setStep(resumeStep)}
                          >
                            Continuar negociação
                          </Button>
                        </Row>
                      </Stack>
                    </PanelBody>
                  </Panel>
                  {!debt ? (
                    <Alert>
                      O contrato não está disponível para negociação neste contexto. Escolha outro
                      contrato ou consulte os acordos.
                      {step !== 1 && (
                        <Button
                          onClick={() => {
                            setSelected('');
                            setProposalId('');
                            setStep(1);
                            setResumeStep(2);
                            setUnsaved(false);
                          }}
                        >
                          Escolher outro contrato
                        </Button>
                      )}
                    </Alert>
                  ) : (
                    <div hidden={step === 1}>
                      <Stack>
                        <Row>
                          <div>
                            <h2>{person?.name}</h2>
                            <Muted>
                              Contrato {debt.reference} · Valor original {money(debt.amount)}
                            </Muted>
                          </div>
                          <Button onClick={() => setStep(1)}>Trocar contrato</Button>
                        </Row>
                        <Simulator
                          key={`${debt.id}:${proposalId}:${resumeVersion}`}
                          db={db}
                          debtId={debt.id}
                          scope={scope}
                          initialProposal={db.proposals.find(
                            (p) => p.id === proposalId && p.debtId === debt.id,
                          )}
                          onReviewChange={(review) => {
                            const next = review ? 3 : 2;
                            setResumeStep(next);
                            setStep(next);
                          }}
                          onUnsavedChange={setUnsaved}
                          onHistory={() => setTab('Histórico de propostas')}
                          onConfirmed={(id) => navigate(`/acordos?acordo=${id}`)}
                        />
                      </Stack>
                    </div>
                  )}
                </>
              )}
            </Stack>
          </div>
          <div hidden={tab !== 'Histórico de propostas'}>
            <ProposalHistory
              db={db}
              scope={scope}
              eligibleIds={eligible.map((d) => d.id)}
              onResume={(proposal) => {
                if (
                  unsaved &&
                  !window.confirm(
                    'Descartar as condições ainda não revisadas e retomar esta proposta?',
                  )
                )
                  return;
                setSelected(proposal.debtId);
                setProposalId(proposal.id);
                setResumeVersion((version) => version + 1);
                setStep(3);
                setResumeStep(3);
                setUnsaved(false);
                setTab('Nova negociação');
              }}
            />
          </div>
        </div>
      </Stack>
    </>
  );
}
