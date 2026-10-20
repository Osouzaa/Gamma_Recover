import styled from 'styled-components';
export const PrimaryMetrics = styled.section`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid ${({ theme }) => theme.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 380px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
export const SecondaryMetrics = styled(PrimaryMetrics)`
  strong {
    font-size: 22px;
  }
  footer {
    margin-top: 4px;
  }
  @media (max-width: 760px) {
    strong {
      font-size: 20px;
    }
  }
`;
export const ChartColumns = styled.div<{ $top?: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1.9fr) minmax(0, 1fr);
  gap: 16px;
  align-items: ${({ $top }) => ($top ? 'start' : 'stretch')};
  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
export const OperationsColumns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  @media (max-width: 1000px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
export const Filters = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: ${({ theme }) => theme.background.surface};
  border: 1px solid ${({ theme }) => theme.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: ${({ theme }) => theme.text.secondary};
  }
  select {
    font-size: 12px;
  }
  p {
    font-size: 12px;
    color: ${({ theme }) => theme.text.secondary};
  }
`;
export { ChartFrame, Legend, ChartTooltip, SummaryLine } from '../../chartStyles';
export const Distribution = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px;
  h3 {
    font-weight: 500;
    font-size: 12px;
  }
  p {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
  small {
    color: ${({ theme }) => theme.text.secondary};
  }
`;
export const Track = styled.div`
  height: 6px;
  background: ${({ theme }) => theme.border.subtle};
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
`;
export const Fill = styled.div<{ $width: number; $muted?: boolean }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: ${({ theme, $muted }) => ($muted ? theme.chart.previous : theme.brand.primary)};
`;
export const Quality = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border.subtle};
  padding: 12px 18px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 11px;
  color: ${({ theme }) => theme.text.secondary};
  strong {
    color: ${({ theme }) => theme.text.primary};
    font-weight: 600;
  }
`;
export const Funnel = styled.ol`
  list-style: none;
  margin: 0;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  li > div:first-child {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
  }
  strong {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
  small {
    color: ${({ theme }) => theme.text.secondary};
    font-weight: 400;
    margin-left: 8px;
  }
`;
export const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 12px 18px;
  min-height: 205px;
  @media (max-width: 380px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
export const StatusLegend = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
  font-size: 12px;
  li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  strong {
    margin-left: auto;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
`;
export const Dot = styled.span<{ $color: string }>`
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;
export const WorkList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  li {
    border-bottom: 1px solid ${({ theme }) => theme.border.subtle};
    padding: 12px 16px;
  }
  li:last-child {
    border: 0;
  }
  a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    text-decoration: none;
    font-size: 12px;
  }
  a:hover {
    text-decoration: underline;
  }
  small {
    display: block;
    color: ${({ theme }) => theme.text.secondary};
    margin-top: 3px;
  }
  strong {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  h3 {
    font-size: 12px;
  }
`;
export const Note = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.text.secondary};
  padding: 0 18px 14px;
`;
