import { collectionQueue } from '../../../../services/collectionQueue';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDatabase } from '../../../../hooks/useDatabase';
import { useWorkspace } from '../../../../app/providers/Context';
import { creditorOf } from '../../../../services/domain';
import { date, money } from '../../../../utils/format';
import { Feedback, ErrorState, LoadingState } from '../../../../components/Feedback';
import {
  Empty,
  Input,
  PageHeader,
  Panel,
  PanelHeader,
  Select,
  Muted,
  Stack,
} from '../../../../components/ui';
import { CollectionCase } from '../../CollectionCase';
import { QueueFilters, QueueItem, QueueList, Workbench } from '../../styles';
export default function Collections() {
  const [params, setParams] = useSearchParams();
  const debtId = params.get('divida') || '';
  const search = params.get('busca') || '';
  const order = params.get('ordem') || 'vencimento';
  const caseRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (debtId && window.matchMedia('(max-width: 900px)').matches) {
      caseRef.current?.scrollIntoView({ block: 'start' });
    }
  }, [debtId]);
  const updateParam = (key: string, value: string) => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  };
  const [saved, setSaved] = useState(false);
  const { data: db, isLoading, refetch } = useDatabase();
  const { scope } = useWorkspace();
  if (isLoading) return <LoadingState />;
  if (!db) return <ErrorState retry={refetch} />;
  const queue = collectionQueue(db, scope).filter((d) => {
    const person = db.debtors.find((v) => v.id === d.debtorId);
    const company = db.creditors.find((c) => c.id === creditorOf(db, d));
    return `${person?.name} ${person?.document} ${d.reference} ${company?.name}`
      .toLocaleLowerCase('pt-BR')
      .includes(search.toLocaleLowerCase('pt-BR'));
  });
  queue.sort((a, b) =>
    order === 'valor'
      ? b.amount - a.amount
      : order === 'nome'
        ? (db.debtors.find((d) => d.id === a.debtorId)?.name || '').localeCompare(
            db.debtors.find((d) => d.id === b.debtorId)?.name || '',
            'pt-BR',
          )
        : a.dueDate.localeCompare(b.dueDate),
  );
  const selected =
    queue.find((d) => d.id === debtId) ||
    queue.find((d) => d.debtorId === params.get('devedor')) ||
    queue[0];
  return (
    <>
      <PageHeader
        title="Operação de cobrança"
        description="Escolha um caso na fila, faça o contato e registre o resultado."
      />
      <Stack>
        <Feedback success={saved ? 'Atendimento registrado. Histórico atualizado.' : undefined} />
        <Workbench>
          <Panel aria-label="Fila de atendimento">
            <PanelHeader>
              <h2>Fila de atendimento</h2>
              <Muted>{queue.length} contratos na fila</Muted>
            </PanelHeader>
            <QueueFilters>
              <Input
                aria-label="Buscar na fila"
                value={search}
                onChange={(e) => updateParam('busca', e.target.value)}
                placeholder="Nome, documento ou contrato"
              />
              <Select
                aria-label="Ordenar fila"
                value={order}
                onChange={(e) => updateParam('ordem', e.target.value)}
              >
                <option value="vencimento">Vencimento mais antigo</option>
                <option value="nome">Nome de A a Z</option>
                <option value="valor">Maior valor original</option>
              </Select>
            </QueueFilters>
            {queue.length ? (
              <QueueList aria-label="Contratos para atendimento">
                {queue.map((debt) => {
                  const person = db.debtors.find((d) => d.id === debt.debtorId)!;
                  const company = db.creditors.find((c) => c.id === creditorOf(db, debt));
                  return (
                    <li key={debt.id}>
                      <QueueItem
                        type="button"
                        aria-pressed={selected?.id === debt.id}
                        aria-label={`Atender ${person.name}, contrato ${debt.reference}`}
                        onClick={() => {
                          setSaved(false);
                          updateParam('divida', debt.id);
                        }}
                      >
                        <strong>{person.name}</strong>
                        <span>{debt.reference}</span>
                        <small>{company?.name}</small>
                        <span>
                          {money(debt.amount)} <small>· Vencimento {date(debt.dueDate)}</small>
                        </span>
                        {(person.blocked || debt.disputed) && <small>Contato indisponível</small>}
                      </QueueItem>
                    </li>
                  );
                })}
              </QueueList>
            ) : (
              <Empty>Nenhum contrato. Revise a busca ou a empresa.</Empty>
            )}
          </Panel>
          <div ref={caseRef}>
            {selected ? (
              <CollectionCase
                key={`${scope.creditorId}:${selected.id}`}
                db={db}
                debt={selected}
                onSaved={() => setSaved(true)}
              />
            ) : (
              <Empty>Nenhum contrato nesta fila. Revise a busca ou a empresa selecionada.</Empty>
            )}
          </div>
        </Workbench>
      </Stack>
    </>
  );
}
