import styled from 'styled-components';
export const Scroll = styled.div`
  width: 100%;
  min-width: 0;
  overflow-x: auto;
`;
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
  th,
  td {
    padding: 10px 16px;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.border.subtle};
  }
  th {
    background: ${({ theme }) => theme.background.subtle};
    font-size: ${({ theme }) => theme.typography.small};
    color: ${({ theme }) => theme.text.secondary};
    font-weight: 600;
  }
  th button {
    border: 0;
    background: none;
    color: inherit;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0;
    min-height: 24px;
  }
  td {
    font-variant-numeric: tabular-nums;
    transition: background ${({ theme }) => theme.motion.fast};
  }
  tr:hover td {
    background: ${({ theme }) => theme.background.subtle};
  }
  th[data-numeric='true'] button {
    margin-left: auto;
  }
  td a {
    color: ${({ theme }) => theme.status.info};
    text-decoration: none;
    font-weight: 500;
  }
  td a:hover {
    text-decoration: underline;
  }
  td button {
    min-height: 30px;
    padding: 4px 9px;
    font-size: ${({ theme }) => theme.typography.small};
  }
  tr[data-selected='true'] td {
    background: ${({ theme }) => theme.background.accent};
  }
  @media (max-width: 760px) {
    td button {
      min-height: 44px;
      min-width: 44px;
    }
    td a {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
    }
  }
  tbody tr:last-child td {
    border-bottom: 0;
  }
  [data-numeric='true'] {
    text-align: right;
  }
  td small {
    display: block;
    color: ${({ theme }) => theme.text.secondary};
  }
`;
export const Footer = styled.div`
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  color: ${({ theme }) => theme.text.secondary};
  font-size: ${({ theme }) => theme.typography.small};
`;

export const Caption = styled.caption`
  text-align: left;
  padding: 10px 16px;
  color: ${({ theme }) => theme.text.secondary};
  font-size: ${({ theme }) => theme.typography.small};
  border-bottom: 1px solid ${({ theme }) => theme.border.subtle};
`;
