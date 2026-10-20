import { StepEditor } from './styles';
import { useState } from 'react';
import type { Database } from '../../types/domain';
import { useWorkspace } from '../../app/providers/Context';
import { useAction } from '../../hooks/useDatabase';
import { JourneyService } from '../../services/journeys';
import { journeyChannels, type Journey, type JourneyInput } from '../../services/journeySchema';
import { Modal } from '../../components/Modal';
import { Feedback } from '../../components/Feedback';
import { Button, Field, Form, Input, Row, Select } from '../../components/ui';
export function JourneyForm({
  db,
  journey,
  onClose,
}: {
  db: Database;
  journey?: Journey;
  onClose: () => void;
}) {
  const { scope } = useWorkspace();
  const action = useAction();
  const [value, setValue] = useState<JourneyInput>(
    journey
      ? { ...journey, steps: journey.steps.map((s) => ({ ...s })) }
      : {
          creditorId: scope.creditorId || db.creditors[0]?.id || '',
          name: '',
          active: true,
          steps: [
            { offset: 0, channel: 'Tarefa interna', note: 'Revisar contrato no vencimento.' },
          ],
        },
  );
  const updateStep = (index: number, changes: Partial<JourneyInput['steps'][number]>) =>
    setValue({
      ...value,
      steps: value.steps.map((s, i) => (i === index ? { ...s, ...changes } : s)),
    });
  return (
    <Modal title={journey ? 'Editar régua' : 'Nova régua'} wide onClose={onClose}>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          action.mutate(() => JourneyService.save(scope, value, journey?.id, journey?.revision), {
            onSuccess: onClose,
          });
        }}
      >
        <Field>
          Nome da régua
          <Input
            autoFocus
            required
            minLength={3}
            maxLength={100}
            value={value.name}
            onChange={(e) => setValue({ ...value, name: e.target.value })}
          />
        </Field>
        <Field>
          Empresa
          <Select
            aria-label="Empresa da régua"
            disabled={!!scope.creditorId || !!journey}
            value={value.creditorId}
            onChange={(e) => setValue({ ...value, creditorId: e.target.value })}
          >
            {db.creditors
              .filter((c) => !scope.creditorId || c.id === scope.creditorId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>
        </Field>
        <label>
          <input
            type="checkbox"
            checked={value.active}
            onChange={(e) => setValue({ ...value, active: e.target.checked })}
          />
          Régua ativa para simulação
        </label>
        <p>
          Dias relativos ao vencimento: negativos antes, zero no dia e positivos depois. Nenhuma
          etapa envia mensagens ou cria tarefas automaticamente.
        </p>
        {value.steps.map((step, index) => (
          <StepEditor key={index}>
            <legend>Etapa {index + 1}</legend>
            <Row>
              <Field>
                Dias relativos
                <Input
                  type="number"
                  aria-label={`Dias da etapa ${index + 1}`}
                  min={-90}
                  max={365}
                  required
                  value={step.offset}
                  onChange={(e) => updateStep(index, { offset: e.target.valueAsNumber })}
                />
              </Field>
              <Field>
                Canal
                <Select
                  aria-label={`Canal da etapa ${index + 1}`}
                  value={step.channel}
                  onChange={(e) =>
                    updateStep(index, {
                      channel: e.target.value as JourneyInput['steps'][number]['channel'],
                    })
                  }
                >
                  {journeyChannels.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Button
                type="button"
                disabled={value.steps.length === 1}
                onClick={() =>
                  setValue({ ...value, steps: value.steps.filter((_, i) => i !== index) })
                }
              >
                Remover etapa {index + 1}
              </Button>
            </Row>
            <Field>
              Ação prevista
              <Input
                aria-label={`Ação da etapa ${index + 1}`}
                required
                minLength={5}
                maxLength={500}
                value={step.note}
                onChange={(e) => updateStep(index, { note: e.target.value })}
              />
            </Field>
          </StepEditor>
        ))}
        <Button
          type="button"
          disabled={value.steps.length >= 10}
          onClick={() =>
            setValue({
              ...value,
              steps: [
                ...value.steps,
                { offset: 7, channel: 'Tarefa interna', note: 'Revisar próxima ação do contrato.' },
              ],
            })
          }
        >
          Adicionar etapa
        </Button>
        <Feedback error={action.error} />
        <Button $variant="primary" disabled={action.isPending}>
          Salvar régua
        </Button>
        <Button type="button" onClick={onClose}>
          Cancelar
        </Button>
      </Form>
    </Modal>
  );
}
