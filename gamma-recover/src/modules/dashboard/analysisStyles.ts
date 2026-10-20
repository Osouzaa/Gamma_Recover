import styled from 'styled-components';
import { Filters } from './pages/Dashboard/styles';
export const AnalysisFilters = styled(Filters)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 185px), 1fr));
  align-items: end;
  label {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  select {
    width: 100%;
    min-width: 0;
  }
  button {
    white-space: normal;
  }
`;
export const Analysis = styled.section`
  display: grid;
  gap: 16px;
  min-width: 0;
`;
export const Heading = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  h2 {
    font-size: ${({ theme }) => theme.typography.section};
  }
  p {
    color: ${({ theme }) => theme.text.secondary};
    font-size: 12px;
    margin-top: 4px;
  }
`;
export const Context = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px 24px;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.background.surface};
  font-size: 12px;
  color: ${({ theme }) => theme.text.secondary};
  strong {
    color: ${({ theme }) => theme.text.primary};
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
`;
export const Details = styled.details`
  border-top: 1px solid ${({ theme }) => theme.border.subtle};
  summary {
    padding: 12px 16px;
    cursor: pointer;
    font-size: 12px;
  }
  summary:focus-visible {
    outline: 3px solid ${({ theme }) => theme.brand.accent};
    outline-offset: -3px;
  }
`;
export const Chart = styled.div<{ $height?: number }>`
  height: ${({ $height }) => $height || 280}px;
  min-width: 0;
  padding: 12px 16px 0 0;
  @media (max-width: 760px) {
    padding-left: 0;
  }
`;
