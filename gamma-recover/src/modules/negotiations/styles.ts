import styled from 'styled-components';
import { DetailList } from '../../components/ui';
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
