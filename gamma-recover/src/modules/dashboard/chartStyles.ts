import styled from 'styled-components';
export const ChartFrame = styled.div`
  height: 248px;
  min-width: 0;
  width: 100%;
  padding: 8px 12px 0 0;
`;
export const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 0 18px 14px;
  font-size: 11px;
  color: ${({ theme }) => theme.text.secondary};
  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  i {
    width: 16px;
    height: 3px;
    background: ${({ theme }) => theme.chart.current};
  }
  i[data-previous] {
    background: none;
    border-top: 3px dashed ${({ theme }) => theme.chart.previous};
    height: 0;
  }
`;
export const ChartTooltip = styled.div`
  background: ${({ theme }) => theme.background.surface};
  border: 1px solid ${({ theme }) => theme.border.default};
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 12px;
  box-shadow: ${({ theme }) => theme.shadows.overlay};
  p {
    color: ${({ theme }) => theme.text.secondary};
    font-size: 11px;
    margin-bottom: 6px;
  }
  strong {
    font-weight: 600;
  }
  div + div {
    margin-top: 6px;
  }
`;
export const SummaryLine = styled.div`
  padding: 12px 18px 0;
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  strong {
    font-size: 20px;
    letter-spacing: -0.5px;
    font-variant-numeric: tabular-nums;
  }
  span {
    font-size: 12px;
    color: ${({ theme }) => theme.text.secondary};
  }
`;
