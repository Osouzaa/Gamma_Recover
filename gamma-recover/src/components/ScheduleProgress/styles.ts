import styled from 'styled-components';
export const Progress = styled.div`
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.border.subtle};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.background.subtle};
  div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
    color: ${({ theme }) => theme.text.secondary};
    margin-bottom: 8px;
  }
  strong {
    color: ${({ theme }) => theme.text.primary};
    font-weight: 500;
  }
  progress {
    display: block;
    width: 100%;
    height: 5px;
    border: 0;
    border-radius: 3px;
    accent-color: ${({ theme }) => theme.status.success};
  }
  progress::-webkit-progress-bar {
    background: ${({ theme }) => theme.border.default};
    border-radius: 3px;
  }
  progress::-webkit-progress-value {
    background: ${({ theme }) => theme.status.success};
    border-radius: 3px;
  }
`;
