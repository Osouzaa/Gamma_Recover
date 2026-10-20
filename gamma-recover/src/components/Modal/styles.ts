import styled from 'styled-components';
export const Dialog = styled.dialog<{ $wide: boolean }>`
  width: ${({ $wide }) => ($wide ? '840px' : '600px')};
  max-width: calc(100vw - 32px);
  max-height: 90dvh;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: ${({ theme }) => theme.shadows.overlay};
  background: ${({ theme }) => theme.background.surface};
  color: ${({ theme }) => theme.text.primary};
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: ${({ theme }) => `${theme.border.focus} ${theme.background.subtle}`};
  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.background.subtle};
    border-radius: ${({ theme }) => theme.radius.md};
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.border.focus};
    border: 3px solid ${({ theme }) => theme.background.subtle};
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.text.secondary};
  }
  > div:first-child {
    position: sticky;
    top: 0;
    z-index: 1;
    background: ${({ theme }) => theme.background.surface};
  }
  &::backdrop {
    background: ${({ theme }) => theme.brand.primary}99;
  }
`;
