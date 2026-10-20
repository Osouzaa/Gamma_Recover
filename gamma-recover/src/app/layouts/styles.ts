import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
export const Shell = styled.div`
  display: flex;
  min-height: 100dvh;
  min-width: 0;
`;
export const Sidebar = styled.aside<{ $open: boolean; $collapsed: boolean }>`
  width: ${({ theme, $collapsed }) => ($collapsed ? theme.dimensions.sidebarCollapsed : theme.dimensions.sidebar)};
  position: fixed;
  inset: 0 auto 0 0;
  background: ${({ theme }) => theme.background.sidebar};
  color: ${({ theme }) => theme.text.sidebar};
  display: flex;
  flex-direction: column;
  z-index: 30;
  overflow-y: auto;
  transition: width ${({ theme }) => theme.motion.fast};
  ${({ $collapsed }) => $collapsed && `[data-label],[data-brand-copy],[data-footer-copy]{display:none;}`}
  @media(max-width:760px) {
    display: ${({ $open }) => ($open ? 'flex' : 'none')};
    width: ${({ theme }) => theme.dimensions.sidebar};
    [data-label],
    [data-brand-copy],
    [data-footer-copy] {
      display: initial;
    }
  }
`;
export const Brand = styled.div`
  height: 76px;
  flex-shrink: 0;
  padding: 16px;
  display: flex;
  align-items: center;
`;
export const Group = styled.div`
  height: 30px;
  padding: 12px 20px 4px;
  color: ${({ theme }) => theme.text.sidebar};
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.7px;
  text-transform: uppercase;
`;
export const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
  margin: 2px 10px;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radius.sm};
  text-decoration: none;
  font-size: 12px;
  white-space: nowrap;
  color: ${({ theme }) => theme.text.sidebar};
  transition:
    background ${({ theme }) => theme.motion.fast},
    color ${({ theme }) => theme.motion.fast};
  svg {
    width: 17px;
    height: 17px;
    flex-shrink: 0;
  }
  &.active {
    color: ${({ theme }) => theme.text.inverse};
    background: ${({ theme }) => theme.background.active};
  }
  &.active svg {
    color: ${({ theme }) => theme.brand.accent};
  }
  &:hover {
    background: ${({ theme }) => theme.background.active};
    color: ${({ theme }) => theme.text.inverse};
    text-decoration: none;
  }
  @media (max-width: 760px) {
    min-height: 44px;
    font-size: 13px;
  }
`;
export const SidebarBottom = styled.div`
  margin-top: auto;
  padding: 20px 10px 14px;
  border-top: 1px solid ${({ theme }) => theme.background.active};
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 11px;
  button,
  a {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    text-decoration: none;
    color: ${({ theme }) => theme.text.sidebar};
    background: transparent;
    border: 0;
    font-size: 12px;
    white-space: nowrap;
  }
  button:hover,
  a:hover {
    color: ${({ theme }) => theme.text.inverse};
  }
  p {
    padding: 0 12px;
    color: ${({ theme }) => theme.text.sidebar};
    line-height: 1.7;
  }
`;
export const Workspace = styled.div<{ $collapsed: boolean }>`
  flex: 1;
  min-width: 0;
  margin-left: ${({ theme, $collapsed }) => ($collapsed ? theme.dimensions.sidebarCollapsed : theme.dimensions.sidebar)};
  transition: margin-left ${({ theme }) => theme.motion.fast};
  @media (max-width: 760px) {
    margin-left: 0;
  }
`;
export {
  Header,
  Breadcrumb,
  Content,
  DemoBar,
  Avatar,
  MobileButton,
  DesktopButton,
  Backdrop,
  SkipLink,
} from './headerStyles';
