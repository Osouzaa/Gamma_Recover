import styled from 'styled-components';
export const Timeline = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  li {
    min-width: 0;
    overflow-wrap: anywhere;
    position: relative;
    border-left: 1px solid ${({ theme }) => theme.border.default};
    padding: 0 0 20px 18px;
    margin-left: 5px;
  }
  li:last-child {
    padding-bottom: 0;
    border-left-color: transparent;
  }
  li:before {
    content: '';
    position: absolute;
    left: -4px;
    top: 6px;
    width: 7px;
    height: 7px;
    background: ${({ theme }) => theme.status.info};
    border-radius: 50%;
    border: 2px solid ${({ theme }) => theme.background.surface};
    box-sizing: content-box;
    transform: translateX(-2px);
  }
  header {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: baseline;
    flex-wrap: wrap;
    margin-bottom: 4px;
  }
  h3 {
    font-size: 12px;
    font-weight: 600;
  }
  time,
  small {
    font-size: 11px;
    color: ${({ theme }) => theme.text.secondary};
  }
  p {
    font-size: 13px;
    overflow-wrap: anywhere;
    line-height: 1.6;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    font-size: 11px;
    color: ${({ theme }) => theme.status.info};
    svg {
      width: 12px;
      height: 12px;
    }
  }
`;
