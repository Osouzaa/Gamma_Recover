import styled from 'styled-components';

export const CompanySection = styled.section`
  display: grid;
  gap: 16px;
  min-width: 0;
  & + & {
    padding-top: 24px;
    border-top: 1px solid ${({ theme }) => theme.border.subtle};
  }
  h3 {
    font-size: ${({ theme }) => theme.typography.section};
  }
  > p {
    color: ${({ theme }) => theme.text.secondary};
    margin-top: -10px;
  }
  label {
    min-width: 0;
  }
  label > small:empty {
    display: none;
  }
`;

export const CompanyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  @media (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const UploadArea = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border: 1px ${({ $selected }) => ($selected ? 'solid' : 'dashed')}
    ${({ theme }) => theme.border.focus};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.background.subtle};
  > svg {
    color: ${({ theme }) => theme.status.info};
  }
  > div {
    min-width: 0;
    flex: 1;
  }
  strong {
    font-weight: 500;
    overflow-wrap: anywhere;
  }
  p {
    color: ${({ theme }) => theme.text.secondary};
    font-size: ${({ theme }) => theme.typography.small};
    margin-top: 4px;
  }
  label {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 8px 12px;
    border: 1px solid ${({ theme }) => theme.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.background.surface};
    white-space: nowrap;
    &:hover {
      background: ${({ theme }) => theme.background.hover};
    }
    &:focus-within {
      outline: 3px solid ${({ theme }) => theme.brand.accent};
      outline-offset: 2px;
    }
    &:has(input:disabled) {
      opacity: 0.5;
    }
  }
  input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
  @media (max-width: 560px) {
    flex-wrap: wrap;
    padding: 16px;
    label {
      width: 100%;
    }
  }
`;

export const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.border.subtle};
`;
