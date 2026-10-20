import styled from 'styled-components';
export const Wrapper = styled.span`
  display: inline-flex;
  align-items: center;
`;
export const Trigger = styled.button`
  display: grid;
  place-items: center;
  min-width: 24px;
  min-height: 24px;
  border: 0;
  border-radius: 4px;
  padding: 2px;
  background: transparent;
  color: ${({ theme }) => theme.text.secondary};
  &:hover {
    background: ${({ theme }) => theme.background.hover};
  }
`;
export const Bubble = styled.span<{ $left: number; $top: number }>`
  position: fixed;
  z-index: 80;
  left: ${({ $left }) => $left}px;
  top: ${({ $top }) => $top}px;
  width: 260px;
  max-width: calc(100vw - 24px);
  padding: 10px 12px;
  background: ${({ theme }) => theme.brand.primary};
  color: ${({ theme }) => theme.text.inverse};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: 12px;
  font-weight: 400;
  line-height: 1.6;
  box-shadow: ${({ theme }) => theme.shadows.overlay};
`;
