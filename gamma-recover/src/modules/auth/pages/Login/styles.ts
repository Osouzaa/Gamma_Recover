import styled from 'styled-components';
export const Page = styled.main`
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  background: ${({ theme }) => theme.background.surface};
  @media (max-width: 860px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto 1fr;
  }
`;
export const BrandPanel = styled.aside`
  background: ${({ theme }) => theme.brand.primary};
  color: ${({ theme }) => theme.text.inverse};
  padding: clamp(32px, 5vw, 80px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 56px;
  min-width: 0;
  footer {
    font-size: ${({ theme }) => theme.typography.small};
    color: ${({ theme }) => theme.text.sidebar};
  }
  @media (max-width: 860px) {
    padding: 24px;
    gap: 0;
    footer {
      display: none;
    }
  }
`;
export const Introduction = styled.div`
  max-width: 440px;
  h2 {
    font-size: clamp(32px, 3.2vw, 46px);
    line-height: 1.15;
    font-weight: 500;
    letter-spacing: -1.2px;
  }
  > p {
    color: ${({ theme }) => theme.text.sidebar};
    font-size: ${({ theme }) => theme.typography.body};
    line-height: 1.8;
    max-width: 370px;
    margin-top: 24px;
  }
  @media (max-width: 860px) {
    display: none;
  }
`;
export const Workflow = styled.ul`
  list-style: none;
  margin: 40px 0 0;
  padding: 0;
  li {
    padding: 16px 0;
    border-top: 1px solid ${({ theme }) => theme.background.active};
  }
  span {
    display: block;
    font-size: ${({ theme }) => theme.typography.body};
  }
  small {
    display: block;
    margin-top: 4px;
    font-size: ${({ theme }) => theme.typography.small};
    color: ${({ theme }) => theme.text.sidebar};
  }
`;
export const FormArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 64px 32px;
  @media (max-width: 860px) {
    padding: 40px 24px;
    align-items: flex-start;
  }
`;
export const AccessLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.small};
  color: ${({ theme }) => theme.text.secondary};
  margin: 0 0 12px;
`;
export const Content = styled.div`
  width: 100%;
  max-width: 400px;
  h1 {
    font-size: ${({ theme }) => theme.typography.title};
    letter-spacing: -0.6px;
    font-weight: 500;
    margin-bottom: 12px;
    line-height: 1.3;
  }
  header > p:last-child {
    color: ${({ theme }) => theme.text.secondary};
    margin-bottom: 32px;
  }
  form {
    gap: 20px;
  }
  form input {
    min-height: 48px;
  }
  button[type='submit'] {
    width: 100%;
    min-height: 48px;
    margin-top: 4px;
    justify-content: center;
  }
  footer {
    margin-top: 24px;
    font-size: ${({ theme }) => theme.typography.small};
    color: ${({ theme }) => theme.text.secondary};
    line-height: 1.7;
  }
`;
export const DemoAccess = styled.details`
  margin-top: 28px;
  border-top: 1px solid ${({ theme }) => theme.border.default};
  padding-top: 20px;
  font-size: ${({ theme }) => theme.typography.small};
  color: ${({ theme }) => theme.text.secondary};
  summary {
    cursor: pointer;
    color: ${({ theme }) => theme.text.primary};
    padding: 6px 0;
  }
  > p {
    margin-top: 12px;
    line-height: 1.6;
  }
  strong {
    color: ${({ theme }) => theme.text.primary};
    font-weight: 500;
  }
`;
export const ProfileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  button {
    text-align: left;
    border: 1px solid ${({ theme }) => theme.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.background.surface};
    padding: 12px 14px;
    color: ${({ theme }) => theme.text.primary};
    cursor: pointer;
    font: inherit;
  }
  button:hover {
    background: ${({ theme }) => theme.background.subtle};
  }
  button[aria-pressed='true'] {
    border-color: ${({ theme }) => theme.brand.accent};
    background: ${({ theme }) => theme.background.accent};
  }
  button:disabled {
    cursor: wait;
    opacity: ${({ theme }) => theme.states.disabled};
  }
  span {
    display: block;
    font-size: ${({ theme }) => theme.typography.body};
  }
  small {
    display: block;
    color: ${({ theme }) => theme.text.secondary};
    margin-top: 4px;
    overflow-wrap: anywhere;
  }
`;
export const Password = styled.div`
  position: relative;
  input {
    padding-right: 52px;
  }
  button {
    position: absolute;
    right: 2px;
    top: 2px;
    bottom: 2px;
    display: grid;
    place-items: center;
    width: 44px;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.text.secondary};
    border-radius: ${({ theme }) => theme.radius.sm};
    cursor: pointer;
  }
`;
