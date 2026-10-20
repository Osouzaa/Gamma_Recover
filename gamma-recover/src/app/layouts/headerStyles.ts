import styled from 'styled-components';
export const Header = styled.header`
  min-height: ${({ theme }) => theme.dimensions.header};
  padding: 10px 24px;
  background: ${({ theme }) => theme.background.surface};
  border-bottom: 1px solid ${({ theme }) => theme.border.default};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  select {
    max-width: 256px;
    border: 0;
    background: ${({ theme }) => theme.background.subtle};
    font-size: 12px;
  }
  small {
    font-size: 12px;
    color: ${({ theme }) => theme.text.secondary};
  }
  @media (max-width: 760px) {
    padding: 12px 16px;
    flex-wrap: wrap;
    select {
      max-width: 220px;
    }
  }
`;
export const Breadcrumb = styled.nav`
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }
  a {
    color: ${({ theme }) => theme.text.secondary};
    text-decoration: none;
  }
  li:last-child {
    color: ${({ theme }) => theme.text.primary};
    font-weight: 500;
  }
  svg {
    color: ${({ theme }) => theme.text.secondary};
  }
`;
export const Content = styled.main`
  padding: 24px 24px 96px;
  min-width: 0;
  @media (max-width: 760px) {
    padding: 20px 16px 96px;
  }
`;
export const DemoBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 24px;
  font-size: 11px;
  color: ${({ theme }) => theme.status.warning};
  background: ${({ theme }) => theme.status.warningBg};
  border-bottom: 1px solid ${({ theme }) => theme.border.default};
  svg {
    width: 12px;
    height: 12px;
  }
  @media (max-width: 760px) {
    padding: 8px 16px;
    align-items: flex-start;
  }
`;
export const Avatar = styled.span`
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 11px;
  background: ${({ theme }) => theme.status.infoBg};
  color: ${({ theme }) => theme.status.info};
  border: 1px solid ${({ theme }) => theme.border.default};
`;
export const MobileButton = styled.div`
  display: none;
  @media (max-width: 760px) {
    display: block;
  }
`;
export const DesktopButton = styled.div`
  @media (max-width: 760px) {
    display: none;
  }
`;
export const Backdrop = styled.button`
  display: none;
  @media (max-width: 760px) {
    display: block;
    position: fixed;
    inset: 0;
    border: 0;
    z-index: 25;
    background: ${({ theme }) => theme.brand.primary}55;
  }
`;
export const SkipLink = styled.a`
  position: fixed;
  left: 16px;
  top: -80px;
  z-index: 100;
  padding: 10px 16px;
  background: ${({ theme }) => theme.background.surface};
  color: ${({ theme }) => theme.text.primary};
  &:focus {
    top: 12px;
  }
`;
