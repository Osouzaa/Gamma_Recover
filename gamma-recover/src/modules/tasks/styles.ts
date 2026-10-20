import styled from 'styled-components';
import { FilterBar } from '../../components/ui';
export const TaskFilters = styled(FilterBar)`
  input[type='checkbox'] {
    width: auto;
  }
`;
export const TaskLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 16px;
  align-items: start;
  min-width: 0;
  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
