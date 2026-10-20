import styled from 'styled-components';
export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
`;
export const PageHeading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  p {
    color: ${({ theme }) => theme.text.secondary};
    margin-top: 4px;
  }
`;
