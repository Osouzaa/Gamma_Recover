import styled from 'styled-components';
import { DetailList, Split } from '../../../../components/ui';

export const ContactLayout = styled(Split)`
  grid-template-columns: minmax(360px, 0.85fr) minmax(0, 1.15fr);
  align-items: start;

  h3 {
    margin: 24px 0 0;
    padding-top: 20px;
    border-top: 1px solid ${({ theme }) => theme.border.subtle};
    font-size: ${({ theme }) => theme.typography.body};
    font-weight: 500;
  }

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const HistoryLayout = styled(Split)`
  align-items: start;
`;

export const ActionGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

export const ProfileDetails = styled(DetailList)`
  margin: 0 0 20px;
  grid-template-columns: 100px minmax(0, 1fr);
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
    dd {
      margin-bottom: 12px;
    }
  }
`;
