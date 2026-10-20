import styled from 'styled-components';
export const TabList = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  border-bottom: 1px solid ${({ theme }) => theme.border.default};
  button {
    flex-shrink: 0;
    border: 0;
    border-bottom: 2px solid transparent;
    background: transparent;
    padding: 10px 14px;
    color: ${({ theme }) => theme.text.secondary};
    font-size: 13px;
    white-space: nowrap;
    min-height: 40px;
    transition:
      background ${({ theme }) => theme.motion.fast},
      color ${({ theme }) => theme.motion.fast};
  }
  button:hover {
    background: ${({ theme }) => theme.background.hover};
  }
  button[aria-selected='true'] {
    color: ${({ theme }) => theme.text.primary};
    border-bottom-color: ${({ theme }) => theme.status.success};
    font-weight: 600;
  }
  @media (max-width: 760px) {
    button {
      min-height: 44px;
    }
  }
`;
