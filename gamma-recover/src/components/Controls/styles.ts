import styled, { css } from 'styled-components';
const fieldStates = css`
  &::placeholder {
    color: ${({ theme }) => theme.text.secondary};
    opacity: 0.8;
    font-weight: 400;
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.border.focus};
    outline-offset: 2px;
  }
  &:disabled {
    background: ${({ theme }) => theme.background.subtle};
    color: ${({ theme }) => theme.text.secondary};
    cursor: not-allowed;
  }
  &[aria-invalid='true'] {
    border-color: ${({ theme }) => theme.status.danger};
  }
  &[type='file'] {
    height: auto;
    padding: 6px;
  }
  &::file-selector-button {
    border: 0;
    border-radius: 4px;
    padding: 7px 10px;
    margin-right: 10px;
    background: ${({ theme }) => theme.background.subtle};
    color: ${({ theme }) => theme.text.primary};
    font: inherit;
    cursor: pointer;
  }
`;
export const Button = styled.button<{ $variant?: 'primary' | 'danger' | 'ghost' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: ${({ theme }) => theme.dimensions.control};
  padding: 7px 13px;
  border: 1px solid
    ${({ theme, $variant }) => ($variant === 'primary' ? theme.brand.accent : $variant === 'danger' ? theme.status.danger : theme.border.default)};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme, $variant }) => ($variant === 'primary' ? theme.brand.accent : $variant === 'danger' ? theme.status.dangerBg : $variant === 'ghost' ? 'transparent' : theme.background.surface)};
  color: ${({ theme, $variant }) => ($variant === 'danger' ? theme.status.danger : theme.text.primary)};
  font-weight: 500;
  white-space: nowrap;
  transition:
    background ${({ theme }) => theme.motion.fast},
    border-color ${({ theme }) => theme.motion.fast};
  &:active:not(:disabled) {
    transform: translateY(1px);
  }
  &:hover:not(:disabled) {
    background: ${({ theme, $variant }) => ($variant === 'primary' ? theme.brand.accentHover : theme.background.subtle)};
  }
  svg {
    width: 16px;
    height: 16px;
  }
  @media (max-width: 760px) {
    min-height: 44px;
  }
`;
export const Input = styled.input`
  ${fieldStates}
  width: 100%;
  min-width: 0;
  height: ${({ theme }) => theme.dimensions.control};
  padding: 7px 10px;
  border: 1px solid ${({ theme }) => theme.border.default};
  transition: border-color ${({ theme }) => theme.motion.fast};
  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.border.focus};
  }
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.background.surface};
  color: ${({ theme }) => theme.text.primary};
  @media (max-width: 760px) {
    height: 44px;
  }
`;
export const Select = styled.select`
  ${fieldStates}
  min-width: 0;
  max-width: 100%;
  height: ${({ theme }) => theme.dimensions.control};
  padding: 6px 30px 6px 10px;
  border: 1px solid ${({ theme }) => theme.border.default};
  transition: border-color ${({ theme }) => theme.motion.fast};
  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.border.focus};
  }
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.background.surface};
  color: ${({ theme }) => theme.text.primary};
  @media (max-width: 760px) {
    height: 44px;
  }
`;
export const Textarea = styled.textarea`
  ${fieldStates}
  width: 100%;
  min-height: 88px;
  resize: vertical;
  padding: 10px;
  border: 1px solid ${({ theme }) => theme.border.default};
  transition: border-color ${({ theme }) => theme.motion.fast};
  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.border.focus};
  }
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.text.primary};
  background: ${({ theme }) => theme.background.surface};
`;
