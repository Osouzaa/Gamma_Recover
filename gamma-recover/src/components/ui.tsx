import styled from 'styled-components';
export { Button, Input, Select, Textarea } from './Controls/styles';
export const Panel = styled.section`
  min-width: 0;
  background: ${({ theme }) => theme.background.surface};
  border: 1px solid ${({ theme }) => theme.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
`;
export const PanelHeader = styled.div`
  padding: 14px 18px;
  border-bottom: 1px solid ${({ theme }) => theme.border.subtle};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;
export const PanelBody = styled.div`
  padding: 18px;
  min-width: 0;
`;
export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`;
export const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
`;
export const Split = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 20px;
  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
export const Muted = styled.span`
  color: ${({ theme }) => theme.text.secondary};
  font-size: ${({ theme }) => theme.typography.small};
`;
export const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 500;
  color: ${({ theme }) => theme.text.secondary};
  font-size: ${({ theme }) => theme.typography.small};
  input,
  select,
  textarea {
    font-size: ${({ theme }) => theme.typography.body};
  }
  small {
    color: ${({ theme }) => theme.status.danger};
  }
`;
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`;
export const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 18px;
  border-bottom: 1px solid ${({ theme }) => theme.border.subtle};
  input {
    width: 280px;
    max-width: 100%;
  }
  label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;
export const Alert = styled.div<{ $error?: boolean }>`
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme, $error }) => ($error ? theme.status.danger : theme.status.info)};
  background: ${({ theme, $error }) => ($error ? theme.status.dangerBg : theme.status.infoBg)};
  font-size: ${({ theme }) => theme.typography.body};
`;
export const Badge = styled.span<{ $tone?: 'success' | 'warning' | 'danger' | 'info' }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: ${({ theme }) => theme.typography.small};
  color: ${({ theme, $tone = 'info' }) => theme.status[$tone]};
  background: ${({ theme, $tone = 'info' }) => theme.status[`${$tone}Bg`]};
`;
export function Status({ children }: { children: string }) {
  const tone = ['Cumprido', 'Pago', 'Ativo', 'Simulada', 'Conciliado'].includes(children)
    ? 'success'
    : ['Em atraso', 'Vencida', 'Rompido', 'Bloqueado', 'Divergência'].includes(children)
      ? 'danger'
      : ['Pendente', 'A vencer', 'Rascunho'].includes(children)
        ? 'warning'
        : 'info';
  return <Badge $tone={tone}>{children}</Badge>;
}
export { PageHeader } from './PageHeader';
export const Metrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(175px, 1fr));
  border: 1px solid ${({ theme }) => theme.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.background.surface};
  overflow: hidden;
`;
export const Metric = styled.div`
  padding: 18px 20px;
  border-right: 1px solid ${({ theme }) => theme.border.subtle};
  min-width: 0;
  &:last-child {
    border: 0;
  }
  p {
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.small};
  }
  strong {
    display: block;
    margin: 8px 0 4px;
    font-size: ${({ theme }) => theme.typography.metric};
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.6px;
  }
  @media (max-width: 760px) {
    padding: 14px 12px;
    strong {
      font-size: 20px;
      letter-spacing: -0.4px;
    }
  }
`;
export const Empty = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: ${({ theme }) => theme.text.secondary};
  h2 {
    color: ${({ theme }) => theme.text.primary};
    margin-bottom: 4px;
  }
`;
export const DetailList = styled.dl`
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 10px;
  margin: 0;
  dt {
    color: ${({ theme }) => theme.text.secondary};
  }
  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
`;
export const ContextDetails = styled(DetailList)`
  grid-template-columns: minmax(0, 1fr);
  gap: 4px;
  dt {
    font-size: ${({ theme }) => theme.typography.small};
  }
  dd {
    margin-bottom: 10px;
  }
`;
