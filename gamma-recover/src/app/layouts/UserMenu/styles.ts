import styled from 'styled-components';
export const Trigger = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.text.secondary};
  min-height: 36px;
  padding: 0 0 0 8px;
  border-left: 1px solid ${({ theme }) => theme.border.default};
`;
export const Menu = styled.div`
  inset: 58px 20px auto auto;
  margin: 0;
  padding: 8px;
  min-width: 244px;
  border: 1px solid ${({ theme }) => theme.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.shadows.overlay};
  color: ${({ theme }) => theme.text.primary};
  background: ${({ theme }) => theme.background.surface};
  h3,
  p {
    padding: 4px 8px;
  }
  p {
    font-size: 12px;
    color: ${({ theme }) => theme.text.secondary};
    margin-bottom: 8px;
  }
  a {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 8px;
    text-decoration: none;
    font-size: 13px;
    border-radius: 4px;
  }
  a:hover {
    background: ${({ theme }) => theme.background.subtle};
  }
`;
