import styled from 'styled-components';
import { Button } from '../ui';

export const Launcher = styled(Button)`
  position: fixed;
  right: max(24px, env(safe-area-inset-right));
  bottom: max(24px, env(safe-area-inset-bottom));
  z-index: 35;
  min-height: 48px;
  border-radius: 24px;
  box-shadow: ${({ theme }) => theme.shadows.overlay};
  @media (max-width: 760px) {
    right: 16px;
    bottom: max(16px, env(safe-area-inset-bottom));
  }
`;

export const Dialog = styled.dialog`
  position: fixed;
  inset: auto 24px 24px auto;
  margin: 0;
  padding: 0;
  width: 400px;
  max-width: calc(100vw - 32px);
  height: 600px;
  max-height: calc(100dvh - 48px);
  border: 1px solid ${({ theme }) => theme.border.default};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.background.surface};
  color: ${({ theme }) => theme.text.primary};
  box-shadow: ${({ theme }) => theme.shadows.overlay};
  overflow: hidden;
  &[open] {
    display: flex;
    flex-direction: column;
  }
  &::backdrop {
    background: ${({ theme }) => theme.brand.primary}29;
  }
  header,
  form {
    padding: 16px;
    flex-shrink: 0;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid ${({ theme }) => theme.border.subtle};
  }
  small {
    color: ${({ theme }) => theme.text.secondary};
  }
  form {
    display: grid;
    gap: 8px;
    border-top: 1px solid ${({ theme }) => theme.border.subtle};
  }
  form > div {
    display: flex;
    gap: 8px;
  }
  @media (max-width: 760px) {
    right: 16px;
    bottom: max(16px, env(safe-area-inset-bottom));
  }
`;

export const Conversation = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  ol {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 16px;
  }
  li {
    overflow-wrap: anywhere;
  }
  li[data-author='Você'] {
    background: ${({ theme }) => theme.background.subtle};
    padding: 12px;
    border-radius: ${({ theme }) => theme.radius.sm};
  }
  li small {
    display: block;
    margin-bottom: 4px;
  }
  li a {
    display: inline-block;
    margin-top: 8px;
  }
`;

export const Suggestions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  button {
    white-space: normal;
    text-align: left;
    justify-content: flex-start;
  }
`;
