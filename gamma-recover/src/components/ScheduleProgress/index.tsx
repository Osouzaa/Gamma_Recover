import type { Installment } from '../../types/domain';
import { Progress } from './styles';
export function ScheduleProgress({ installments }: { installments: Installment[] }) {
  const paid = installments.filter((i) => i.paidAt).length;
  return (
    <Progress>
      <div>
        <strong>Recebimentos confirmados</strong>
        <span>
          {paid} de {installments.length} itens
        </span>
      </div>
      <progress
        aria-label="Itens do cronograma recebidos"
        max={installments.length || 1}
        value={paid}
      />
    </Progress>
  );
}
