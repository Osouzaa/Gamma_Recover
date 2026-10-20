import { useState } from 'react';
import type { Database, Debt } from '../../types/domain';
import { useWorkspace } from '../../app/providers/Context';
import { useAction } from '../../hooks/useDatabase';
import { taskRows, TaskService } from '../../services/tasks';
import { date } from '../../utils/format';
import { Button, Muted, Row } from '../../components/ui';
import { Feedback } from '../../components/Feedback';
import { TaskForm } from '../tasks/TaskForm';
import { CaseSection, TaskList } from './styles';

export function CaseTasks({ db, debt }: { db: Database; debt: Debt }) {
  const { scope } = useWorkspace();
  const action = useAction();
  const [creating, setCreating] = useState(false);
  const tasks = taskRows(db, scope.creditorId).filter(
    (t) => t.debtId === debt.id && !t.completedAt,
  );
  return (
    <CaseSection aria-label="Próximas ações do contrato">
      <Row>
        <h3>Próximas ações</h3>
        <Button disabled={scope.role === 'Financeiro'} onClick={() => setCreating(true)}>
          Nova tarefa
        </Button>
      </Row>
      <Feedback
        error={action.error}
        success={
          action.isSuccess
            ? 'Tarefa concluída. O contrato e os pagamentos foram preservados.'
            : undefined
        }
      />
      {tasks.length ? (
        <TaskList>
          {tasks.map((task) => (
            <li key={task.id}>
              <div>
                <p>{task.title}</p>
                <Muted>
                  {date(task.dueDate)} · {task.status} · {task.responsible}
                </Muted>
              </div>
              <Button
                aria-label={`Concluir tarefa: ${task.title}`}
                disabled={scope.role === 'Financeiro' || action.isPending}
                onClick={() => action.mutate(() => TaskService.complete(scope, task.id))}
              >
                Concluir
              </Button>
            </li>
          ))}
        </TaskList>
      ) : (
        <Muted>Nenhuma ação pendente para este contrato.</Muted>
      )}
      {creating && <TaskForm db={db} initialDebtId={debt.id} onClose={() => setCreating(false)} />}
    </CaseSection>
  );
}
