import styled from 'styled-components';
import { DetailList, Split } from '../../components/ui';
export const NegotiationSteps = styled.ol`
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 0;
  margin: 0;
  li {
    padding: 12px 0;
    border-bottom: 2px solid ${({ theme }) => theme.border.default};
    color: ${({ theme }) => theme.text.secondary};
  }
  li[aria-current='step'] {
    color: ${({ theme }) => theme.text.primary};
    border-color: ${({ theme }) => theme.brand.primary};
    font-weight: 600;
  }
  @media (max-width: 600px) {
    gap: 8px;
    li {
      font-size: ${({ theme }) => theme.typography.small};
    }
  }
`;
export const SimulationLayout = styled(Split)<{ $reviewing: boolean }>`
  align-items: start;
  ${({ $reviewing }) => $reviewing && 'grid-template-columns: minmax(0, 1fr);'}
`;
export const ProposalSummary = styled(DetailList)`
  grid-template-columns: minmax(100px, 0.9fr) minmax(0, 1fr);
  font-size: 13px;
  dt {
    padding: 5px 0;
  }
  dd {
    text-align: right;
    padding: 5px 0;
    font-variant-numeric: tabular-nums;
  }
  dt[data-total],
  dd[data-total] {
    padding: 12px 0;
    border-top: 1px solid ${({ theme }) => theme.border.default};
    color: ${({ theme }) => theme.text.primary};
  }
  dd[data-total] strong {
    font-size: 24px;
    letter-spacing: -0.5px;
    font-weight: 600;
  }
  dd[data-discount] {
    color: ${({ theme }) => theme.status.success};
  }
`;
