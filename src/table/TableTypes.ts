import { ReactNode } from "react";
import { Store } from "../store";

export type TableDisplayable = Record<string | symbol, unknown>;
export type TableBodyCellRenderer<T extends TableDisplayable> = (
  info: TableBodyRowInfo<T>,
  update: (value: Partial<TableBodyRowInfo<T>>) => void
) => ReactNode;
export type TableBodyRowRenderer<T extends TableDisplayable> = Record<
  keyof T,
  TableBodyCellRenderer<T>
>;

export type TableBodyRowInfo<T extends TableDisplayable> = {
  data: T;
  visible: boolean;
  selected: boolean;
  tableName?: string;
};
export type InternalTableBodyRowInfo<T extends TableDisplayable> = {
  id: string;
  info: TableBodyRowInfo<T>;
  rowStore: Store<TableBodyRowInfo<T>>;
  element: ReactNode;
};

export type TableBodyRowProps<T extends TableDisplayable> = {
  store: Store<TableBodyRowInfo<T>>;
} & TableComponentProps<T>;

export type TableHeadCellRenderer<T extends TableDisplayable> = (
  data: T[],
  globalStore: Store<TableData<T>>,
  tableName?: string
) => ReactNode;
export type TableHeadRowRenderer<T extends TableDisplayable> = Record<
  keyof T,
  TableHeadCellRenderer<T>
>;

export type TableStyleRenderer<T extends TableDisplayable> = {
  tableClassName?: string;
  theadClassName?: string;
  tbodyClassName?: string;
  thClassName?: (col: keyof T, data: T[]) => string;
  headTrClassName?: (data: T[]) => string;
  tdClassName?: (col: keyof T, data: TableBodyRowInfo<T>) => string;
  bodyTrClassName?: (data: TableBodyRowInfo<T>) => string;
};

export type TableSorterComperator<T extends TableDisplayable> = (
  a: T,
  b: T
) => number;
export type TableSorter<T extends TableDisplayable> = Partial<
  Record<keyof T, TableSorterComperator<T>>
>;

export type TableFilterFn<T extends TableDisplayable> = (
  row: T,
  i: number
) => boolean;
export type TableFilterer<T extends TableDisplayable> = Partial<
  Record<keyof T, TableFilterFn<T>>
>;

export type TableData<T extends TableDisplayable> = {
  data: T[];
  headers?: (keyof T)[];
  headRenderer?: Partial<TableHeadRowRenderer<T>>;
  bodyRenderer?: Partial<TableBodyRowRenderer<T>>;
  sortBy?: keyof T;
  sortDir?: "ASC" | "DESC";
  sorter?: TableSorter<T>;
  filterBy?: keyof T;
  filterer?: TableFilterer<T>;
  styleRenderer?: TableStyleRenderer<T>;
  tableName?: string;
};

export type TableComponentProps<T extends TableDisplayable> = {
  tableStore: Store<TableData<T>>;
};
