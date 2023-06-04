import { TableComponentProps, TableData, TableDisplayable } from "./TableTypes";
import { THead } from "./components/head";
import { TBody } from "./components";
import { ReactNode, useMemo } from "react";
import { Store, useStore } from "../store";
import { useTableSort } from "./components/hooks";

export function useTable<T extends TableDisplayable>(
  props: TableData<T>
): readonly [
  table: ReactNode,
  tableStore: Store<TableData<T>>,
  updateFn: (value: Partial<TableData<T>>) => void
] {
  const store = useMemo(() => new Store(props), []);
  useTableSort(store);

  return [<Table tableStore={store} />, store, (u) => store.set(u)] as const;
}

export function Table<T extends TableDisplayable>(
  props: TableComponentProps<T>
) {
  const { styleRenderer } = useStore(props.tableStore, "styleRenderer");
  return (
    <table className={styleRenderer?.tableClassName}>
      <THead {...props} />
      <TBody {...props} />
    </table>
  );
}
