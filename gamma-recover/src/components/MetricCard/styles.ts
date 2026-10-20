import styled from 'styled-components';
export const Card = styled.div<{ $emphasis?: boolean }>`
  padding: 16px 18px;
  min-width: 0;
  background: ${({ theme, $emphasis }) => ($emphasis ? theme.brand.primary : theme.background.surface)};
  color: ${({ theme, $emphasis }) => ($emphasis ? theme.text.inverse : theme.text.primary)};
  border-right: 1px solid ${({ theme }) => theme.border.subtle};
  header {
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme, $emphasis }) => ($emphasis ? theme.text.sidebar : theme.text.secondary)};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
  }
  h2 {
    font-size: inherit;
    font-weight: 500;
    color: inherit;
  }
  header button {
    color: inherit;
  }
  strong {
    display: block;
    margin: 7px 0 4px;
    font-size: ${({ theme }) => theme.typography.metric};
    line-height: 1.3;
    letter-spacing: -0.7px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  p {
    font-size: 12px;
    color: ${({ theme, $emphasis }) => ($emphasis ? theme.text.sidebar : theme.text.secondary)};
    margin-bottom: 10px;
  }
  footer {
    font-size: 11px;
    color: ${({ theme, $emphasis }) => ($emphasis ? theme.text.sidebar : theme.text.secondary)};
    display: flex;
    align-items: center;
    gap: 5px;
    min-height: 18px;
  }
  footer svg {
    width: 12px;
    height: 12px;
  }
  @media (max-width: 760px) {
    padding: 14px 12px;
    strong {
      font-size: ${({ theme }) => theme.typography.metricCompact};
      letter-spacing: -0.5px;
    }
    header {
      align-items: flex-start;
    }
  }
`;
export const Trend = styled.span<{ $up: boolean; $emphasis?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
  color: ${({ theme, $up, $emphasis }) => ($emphasis ? theme.brand.accent : $up ? theme.status.success : theme.status.danger)};
`;
