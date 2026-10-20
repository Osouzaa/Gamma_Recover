import { useState } from 'react';
import { ArrowDownUp, ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Empty, Row } from '../ui';
import { Scroll, Table, Footer } from './styles';
import type { DataTableProps } from './types';
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  empty = 'Nenhum registro encontrado. Ajuste os filtros ou cadastre um registro.',
  pageSize = 8,
  selectedRowKey,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: '', direction: 1 });
  const column = columns.find((c) => c.key === sort.key);
  const sorted = column?.sortValue
    ? [...rows].sort((a, b) => {
        const av = column.sortValue!(a),
          bv = column.sortValue!(b);
        return (
          (typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv), 'pt-BR')) * sort.direction
        );
      })
    : rows;
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const shown = sorted.slice((current - 1) * pageSize, current * pageSize);
  if (!rows.length)
    return (
      <Empty>
        <h2>Nenhum registro</h2>
        <p>{empty}</p>
      </Empty>
    );
  return (
    <>
      <Scroll tabIndex={0} aria-label="Tabela de registros">
        <Table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  data-numeric={c.numeric}
                  aria-sort={
                    sort.key === c.key
                      ? sort.direction === 1
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  {c.sortValue ? (
                    <button
                      onClick={() => {
                        setSort({
                          key: c.key,
                          direction: sort.key === c.key ? -sort.direction : 1,
                        });
                        setPage(1);
                      }}
                    >
                      {c.label}
                      {sort.key === c.key ? (
                        sort.direction === 1 ? (
                          <ArrowUp size={12} />
                        ) : (
                          <ArrowDown size={12} />
                        )
                      ) : (
                        <ArrowDownUp size={12} />
                      )}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={rowKey(r)} data-selected={rowKey(r) === selectedRowKey}>
                {columns.map((c) => (
                  <td key={c.key} data-numeric={c.numeric}>
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </Scroll>
      <Footer>
        <span>
          {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, rows.length)} de{' '}
          {rows.length} registros
        </span>
        <Row>
          <Button
            aria-label="Página anterior"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft />
          </Button>
          <span>
            Página {current} de {pages}
          </span>
          <Button
            aria-label="Próxima página"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight />
          </Button>
        </Row>
      </Footer>
    </>
  );
}
