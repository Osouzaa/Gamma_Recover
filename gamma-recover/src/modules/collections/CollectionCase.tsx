import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Database, Debt } from '../../types/domain';
import { useWorkspace } from '../../app/providers/Context';
import { creditorOf, isSuspended } from '../../services/domain';
import { date, money } from '../../utils/format';
import { ContactChannels } from '../../components/ContactChannels';
import { SectionTabs } from '../../components/SectionTabs';
import { ContactTimeline } from '../../components/ContactTimeline';
import {
  Alert,
  Button,
  Muted,
  Panel,
  PanelBody,
  PanelHeader,
  Row,
  Stack,
} from '../../components/ui';
import { DebtorContactForm } from '../debtors/DebtorContactForm';
import { ContactForm } from './ContactForm';
import { CaseTasks } from './CaseTasks';
import { CaseSummary, CaseSection } from './styles';

export function CollectionCase({
  db,
  debt,
  onSaved,
}: {
  db: Database;
  debt: Debt;
  onSaved: () => void;
}) {
  const { scope } = useWorkspace();
  const [recording, setRecording] = useState(false);
  const [tab, setTab] = useState('Contato');
  const [editing, setEditing] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const debtor = db.debtors.find((d) => d.id === debt.debtorId)!;
  const company = db.creditors.find((c) => c.id === creditorOf(db, debt))!;
  const reason =
    scope.role === 'Financeiro'
      ? 'Seu perfil permite somente consulta e conciliação.'
      : debtor.blocked
        ? 'Pessoa bloqueada para atendimento.'
        : debt.disputed
          ? 'Contrato contestado.'
          : isSuspended(debt)
            ? 'Cobrança deste contrato suspensa.'
            : '';
  const contacts = db.contacts.filter((c) => c.debtId === debt.id);
  const legacy = db.contacts.filter(
    (c) => !c.debtId && c.debtorId === debtor.id && c.creditorId === company.id,
  );
  const close = () => {
    setRecording(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  return (
    <Panel aria-label="Ficha de atendimento">
      <PanelHeader>
        <div>
          <h2>{debtor.name}</h2>
          <Muted>
            {company.name} · Contrato {debt.reference}
          </Muted>
        </div>
        <Button
          ref={trigger}
          $variant="primary"
          disabled={!!reason || (recording && tab === 'Contato')}
          aria-expanded={recording}
          aria-controls="registro-atendimento"
          onClick={() => {
            setTab('Contato');
            setRecording(true);
          }}
        >
          Registrar atendimento
        </Button>
      </PanelHeader>
      <PanelBody>
        <Stack>
          <CaseSummary>
            <div>
              <dt>Valor original</dt>
              <dd>{money(debt.amount)}</dd>
            </div>
            <div>
              <dt>Vencimento</dt>
              <dd>{date(debt.dueDate)}</dd>
            </div>
            <div>
              <dt>Documento</dt>
              <dd>{debtor.document}</dd>
            </div>
          </CaseSummary>
          {!!reason && <Alert $error>{reason}</Alert>}
          <SectionTabs
            label="Detalhes do atendimento"
            options={['Contato', 'Histórico', 'Tarefas']}
            value={tab}
            onChange={setTab}
            panelId="case-panel"
          />
          <div id="case-panel" role="tabpanel" aria-label={tab}>
            <div hidden={tab !== 'Contato'}>
              <Stack>
                {recording && (
                  <CaseSection
                    id="registro-atendimento"
                    role="region"
                    aria-label="Registrar atendimento"
                  >
                    <div>
                      <h3>Registrar atendimento</h3>
                      <Muted>
                        Contrato {debt.reference}. Retornos e promessas geram uma tarefa.
                      </Muted>
                    </div>
                    <ContactForm
                      debtorId={debtor.id}
                      debtId={debt.id}
                      disabled={!!reason}
                      guardNavigation
                      onCancel={close}
                      onSaved={() => {
                        close();
                        setTab('Histórico');
                        onSaved();
                      }}
                    />
                  </CaseSection>
                )}
                {!recording && (
                  <Muted>
                    Consulte os canais abaixo. Após o contato, use Registrar atendimento para salvar
                    o resultado e agendar o retorno.
                  </Muted>
                )}
                <details open={!recording}>
                  <summary>Canais de contato</summary>
                  <Stack>
                    <ContactChannels debtor={debtor} debtId={debt.id} disabled={!!reason} />
                    <Button disabled={scope.role === 'Financeiro'} onClick={() => setEditing(true)}>
                      Editar canais
                    </Button>
                  </Stack>
                </details>
              </Stack>
            </div>
            <div hidden={tab !== 'Histórico'}>
              <section aria-label="Histórico do contrato">
                <Stack>
                  <h3>Histórico deste contrato</h3>
                  <ContactTimeline contacts={contacts} />
                </Stack>
              </section>
              {!!legacy.length && (
                <details>
                  <summary>Registros anteriores sem contrato ({legacy.length})</summary>
                  <Stack>
                    <Muted>
                      Histórico da pessoa com esta empresa. O contrato não foi informado na época.
                    </Muted>
                    <ContactTimeline contacts={legacy} />
                  </Stack>
                </details>
              )}
            </div>
            <div hidden={tab !== 'Tarefas'}>
              <CaseTasks db={db} debt={debt} />
            </div>
          </div>
          <CaseSection aria-label="Consultar e negociar">
            <Row>
              <Link to={`/devedores/${debtor.id}`}>Abrir cadastro do devedor →</Link>
              {!reason && (
                <Link to={`/negociacoes?divida=${debt.id}`}>Encaminhar para negociação →</Link>
              )}
            </Row>
          </CaseSection>
        </Stack>
      </PanelBody>
      {editing && (
        <DebtorContactForm debtor={debtor} debtId={debt.id} onClose={() => setEditing(false)} />
      )}
    </Panel>
  );
}
