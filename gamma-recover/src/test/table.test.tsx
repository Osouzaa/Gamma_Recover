import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { describe, expect, it } from 'vitest';
import { theme } from '../theme';
import { DataTable } from '../components/DataTable';
describe('tabela operacional', () => {
  it('ordena e pagina com navegação acessível', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider theme={theme}>
        <DataTable
          rows={[
            { id: 'b', name: 'Beatriz' },
            { id: 'a', name: 'Ana' },
            { id: 'c', name: 'Camila' },
          ]}
          rowKey={(r) => r.id}
          pageSize={2}
          columns={[
            { key: 'name', label: 'Nome', render: (r) => r.name, sortValue: (r) => r.name },
          ]}
        />
      </ThemeProvider>,
    );
    expect(screen.getByText('Beatriz')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Nome' }));
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Ana');
    await user.click(screen.getByRole('button', { name: 'Próxima página' }));
    expect(screen.getByText('Camila')).toBeInTheDocument();
    expect(screen.queryByText('Ana')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Página anterior' }));
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });
});
