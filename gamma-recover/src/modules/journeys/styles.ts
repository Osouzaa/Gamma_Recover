import styled from 'styled-components';
import { Select } from '../../components/ui';
export const SimulationSelect = styled(Select)`
  max-width: 100%;
  min-width: 0;
  width: 100%;
`;
export const StepEditor = styled.fieldset`
  min-width: 0;
  margin: 0;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.border.default};
  border-radius: ${({ theme }) => theme.radius.sm};
  label {
    min-width: 0;
    max-width: 100%;
  }
  input,
  select {
    max-width: 100%;
    min-width: 0;
  }
`;
export const Steps = styled.ol`
  list-style: none;
  padding: 18px;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: 16px;
  li {
    border-top: 3px solid ${({ theme }) => theme.status.success};
    padding-top: 12px;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  p {
    margin: 8px 0;
  }
  small {
    color: ${({ theme }) => theme.text.secondary};
  }
`;
