import { ReactNode, RefObject } from "react";

export type TableObject = Record<string | number | symbol, unknown>;

export type TableData<T extends TableObject> = {
  id: string;
  data: T;
};

export type TableHeadCellRenderer<T extends TableObject> = (
  core: TableCoreData<T>,
  data: T[]
) => ReactNode;
export type TableHeadRowRenderer<T extends TableObject> = Record<
  keyof T,
  TableHeadCellRenderer<T>
>;

export type TableBodyCellRenderer<T extends TableObject> = (
  tableName: string,
  info: T,
  update: (value: T) => void
) => ReactNode;
export type TableBodyRowRenderer<T extends TableObject> = Record<
  keyof T,
  TableBodyCellRenderer<T>
>;

export type CommonStyles = {
  tableClassName?: string;
};
export type HeadStyles<T extends TableObject> = {
  theadClassName?: string;
  thClassName?: (col: keyof T, data: T[]) => string;
  headTrClassName?: (data: T[]) => string;
};
export type BodyStyles<T extends TableObject> = {
  tbodyClassName?: string;
  tdClassName?: (col: keyof T, data: T) => string;
  bodyTrClassName?: (data: T) => string;
};

export type VirtualScrollSettings = {
  virtualScrollOffset?: number;
  virtualScrollInitial?: number;
  virtualScrollElementMarginTop?: number;
  virtualScrollElementMarginBottom?: number;
  hideHeaderDuringScrolling?: boolean;
};

export type TableConfig<T extends TableObject> = {
  tableName: string;
  viewportRef?: RefObject<HTMLElement>;
  headers?: (keyof T)[];
  headRenderer?: Partial<TableHeadRowRenderer<T>>;
  bodyRenderer?: Partial<TableBodyRowRenderer<T>>;
  styles?: CommonStyles;
  headStyles?: HeadStyles<T>;
  bodyStyles?: BodyStyles<T>;
} & VirtualScrollSettings;

export type TableUpdates<T extends TableObject> = {
  update: (data: TableData<T>) => void;
  updateAll: (data: TableData<T>[]) => void;
  updateById: (id: string, data: T) => void;
};

export type TableCoreData<T extends TableObject> = {
  data: ReadonlyArray<TableData<T>>;
  updateFn: TableUpdates<T>;
};

export type TableProps<T extends TableObject> = TableCoreData<T> &
  TableConfig<T> & { displayable?: TableDisplayableArea };

export type TableHeadProps<T extends TableObject> = HeadStyles<T> &
  Pick<TableProps<T>, "data" | "tableName" | "headers" | "headRenderer"> & {
    core: TableCoreData<T>;
  };

export type TableBodyProps<T extends TableObject> = BodyStyles<T> &
  Pick<
    TableProps<T>,
    | "data"
    | "updateFn"
    | "tableName"
    | "headers"
    | "bodyRenderer"
    | "displayable"
  > & { core: TableCoreData<T> };

export type TableDisplayableArea = {
  displayStart: number;
  displayEnd: number;
};
