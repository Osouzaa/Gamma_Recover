import styled from 'styled-components';

export const Workbench = styled.div`
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  min-width: 0;
  > div {
    min-width: 0;
    scroll-margin-top: 16px;
  }
  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
export const QueueFilters = styled.div`
  padding: 16px;
  display: grid;
  gap: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.border.subtle};
  input,
  select {
    width: 100%;
    min-width: 0;
  }
`;
export const QueueList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 620px;
  overflow-y: auto;
  @media (max-width: 900px) {
    max-height: 240px;
  }
`;
export const QueueItem = styled.button`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 16px;
  text-align: left;
  border: 0;
  border-bottom: 1px solid ${({ theme }) => theme.border.subtle};
  color: ${({ theme }) => theme.text.primary};
  background: ${({ theme }) => theme.background.surface};
  overflow-wrap: anywhere;
  strong {
    font-weight: 600;
  }
  small {
    color: ${({ theme }) => theme.text.secondary};
  }
  &:hover {
    background: ${({ theme }) => theme.background.hover};
  }
  &[aria-pressed='true'] {
    background: ${({ theme }) => theme.background.accent};
  }
  &:focus-visible {
    outline-offset: -3px;
  }
`;

export const CaseSummary = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
  padding-bottom: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.border.subtle};
  dt {
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.small};
  }
  dd {
    margin: 4px 0 0;
    overflow-wrap: anywhere;
  }
  @media (max-width: 480px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
`;
export const CaseSection = styled.section`
  border-top: 1px solid ${({ theme }) => theme.border.subtle};
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
export const TaskList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  li {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid ${({ theme }) => theme.border.subtle};
  }
  li:last-child {
    border-bottom: 0;
  }
  p {
    overflow-wrap: anywhere;
  }
`;
