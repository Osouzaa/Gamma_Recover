import type { ReactNode } from 'react';
export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  numeric?: boolean;
}
export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  empty?: string;
  pageSize?: number;
  selectedRowKey?: string;
}
