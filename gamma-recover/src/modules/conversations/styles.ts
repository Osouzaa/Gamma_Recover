import styled from 'styled-components';
export const ConversationWorkspace = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 16px;
  align-items: start;
  min-width: 0;
  @media (max-width: 1150px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
export const ChatLayout = styled.div`
  display: grid;
  align-items: start;
  grid-template-columns: 250px minmax(0, 1fr);
  min-width: 0;
  gap: 16px;
  @media (max-width: 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
export const ConversationList = styled.div`
  max-height: 640px;
  overflow-y: auto;
  @media (max-width: 760px) {
    max-height: 260px;
  }
`;
export const ConversationButton = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.border.subtle};
  background: ${({ theme }) => theme.background.surface};
  color: ${({ theme }) => theme.text.primary};
  font: inherit;
  cursor: pointer;
  overflow-wrap: anywhere;
  &[aria-pressed='true'] {
    background: ${({ theme }) => theme.background.accent};
  }
  &:hover {
    background: ${({ theme }) => theme.background.subtle};
  }
  span,
  small {
    display: block;
  }
  small {
    color: ${({ theme }) => theme.text.secondary};
    margin-top: 4px;
  }
`;
export const DraftList = styled.ol`
  list-style: none;
  padding: 20px;
  margin: 0;
  min-height: 240px;
  max-height: 430px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: ${({ theme }) => theme.background.subtle};
  li {
    align-self: flex-end;
    width: min(100%, 560px);
    padding: 16px;
    border: 1px solid ${({ theme }) => theme.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.background.accent};
    overflow-wrap: anywhere;
  }
  p {
    white-space: pre-wrap;
    margin: 8px 0;
  }
  li > span,
  li > small {
    display: block;
  }
  small {
    color: ${({ theme }) => theme.text.secondary};
  }
`;
