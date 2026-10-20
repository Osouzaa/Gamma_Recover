import styled from 'styled-components';
import { Link } from 'react-router-dom';
export const PortalShell = styled.div`
  min-height: 100dvh;
  background: ${({ theme }) => theme.background.app};
`;
export const PortalHeader = styled.header`
  padding: 18px 24px;
  background: ${({ theme }) => theme.brand.primary};
  color: ${({ theme }) => theme.text.inverse};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  strong {
    font-size: 24px;
    letter-spacing: -1px;
  }
  span {
    color: ${({ theme }) => theme.brand.accent};
  }
  a {
    color: inherit;
  }
  button {
    background: ${({ theme }) => theme.background.surface};
  }
`;
export const PortalContent = styled.main`
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 24px;
  @media (max-width: 760px) {
    padding: 24px 16px;
  }
`;
export const PortalNav = styled.nav`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  border-bottom: 1px solid ${({ theme }) => theme.border.default};
  padding-bottom: 0;
  a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    padding: 10px 0;
    text-decoration: none;
    border-bottom: 2px solid transparent;
    font-size: 13px;
    color: ${({ theme }) => theme.text.secondary};
    transition: color ${({ theme }) => theme.motion.fast};
  }
  a.active {
    border-bottom-color: ${({ theme }) => theme.status.success};
    color: ${({ theme }) => theme.text.primary};
    font-weight: 600;
  }
  a:hover {
    color: ${({ theme }) => theme.status.info};
  }
`;
export const PortalLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: ${({ theme }) => theme.status.info};
`;
export const Access = styled.div`
  max-width: 480px;
  margin: 32px auto;
  h1 {
    margin-bottom: 12px;
  }
  p {
    margin-bottom: 20px;
    color: ${({ theme }) => theme.text.secondary};
  }
`;
