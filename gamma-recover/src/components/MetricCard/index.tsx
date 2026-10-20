import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import { Card, Trend } from './styles';
export interface MetricCardProps {
  label: string;
  value: string;
  description: string;
  explanation: string;
  note?: string;
  change?: number;
  unit?: '%' | 'p.p.';
  emphasis?: boolean;
}
export function MetricCard({
  label,
  value,
  description,
  explanation,
  note = 'Posição atual',
  change,
  unit = '%',
  emphasis,
}: MetricCardProps) {
  return (
    <Card $emphasis={emphasis}>
      <header>
        <h2>{label}</h2>
        <Tooltip label={label}>{explanation}</Tooltip>
      </header>

      <strong>{value}</strong>
      <p>{description}</p>
      <footer>
        {change !== undefined ? (
          <>
            <Trend $up={change >= 0} $emphasis={emphasis}>
              {change === 0 ? <Minus /> : change > 0 ? <ArrowUpRight /> : <ArrowDownRight />}
              {change > 0 ? '+' : ''}
              {change.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
              {unit === '%' ? '%' : ' p.p.'}
            </Trend>
            <span>vs. período anterior</span>
          </>
        ) : (
          <>
            <Minus size={12} />
            {note}
          </>
        )}
      </footer>
    </Card>
  );
}
