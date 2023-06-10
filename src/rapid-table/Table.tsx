import {
  ReactNode,
  Ref,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  TableObject,
  TableProps,
  TableData,
  TableConfig,
  TableCoreData,
  TableUpdates,
} from "./TableTypes";
import { TBody, THead } from "./components";
import { v4 } from "uuid";
import { useTableVirtualScroll } from "./components/hooks";

export function Table<T extends TableObject>(
  props: TableProps<T> & { tableRef: Ref<HTMLTableElement> }
) {
  const {
    data,
    updateFn,
    tableName,
    headers,
    headRenderer,
    bodyRenderer,
    styles,
    headStyles,
    bodyStyles,
    viewportRef,
    displayable,
  } = props;

  const common = {
    data,
    viewportRef,
    tableName,
    headers,
  };

  const core = useMemo(() => ({ data, updateFn }), [data, updateFn]);

  return (
    <table
      ref={props.tableRef}
      className={styles?.tableClassName}
      cellSpacing={0}
    >
      <THead
        core={core}
        headRenderer={headRenderer}
        {...common}
        {...headStyles}
      />
      <TBody
        core={core}
        bodyRenderer={bodyRenderer}
        updateFn={updateFn}
        displayable={displayable}
        {...common}
        {...bodyStyles}
      />
    </table>
  );
}

export function useTableData<T extends TableObject>(
  data: T[]
): TableCoreData<T> {
  const [tableData, setTableData] = useState<TableData<T>[]>(
    data.map((d) => ({ id: v4(), data: d }))
  );
  useEffect(() => {
    setTableData(data.map((d) => ({ id: v4(), data: d })));
  }, [data]);

  const updateAll = useCallback(
    (update: TableData<T>[]) => setTableData([...update]),
    []
  );

  const update = useCallback((update: TableData<T>) => {
    setTableData((tableData) => {
      const updated: TableData<T>[] = [];

      for (const d of tableData) {
        if (update.id !== d.id) updated.push(d);
        else updated.push({ data: update.data, id: v4() });
      }
      return updated;
    });
  }, []);

  const updateById = useCallback(
    (id: string, updateData: T) => update({ id, data: updateData }),
    []
  );

  const updateFn = useMemo(
    () => ({
      updateAll,
      update,
      updateById,
    }),
    []
  );

  return {
    data: tableData,
    updateFn,
  };
}

export function useTable<T extends TableObject>(
  initialData: T[],
  config: TableConfig<T>
): {
  table: ReactNode;
  data: ReadonlyArray<TableData<T>>;
  updateFn: TableUpdates<T>;
  recalculateDisplayable: () => void;
} {
  const data = useTableData(initialData);
  const ref = useRef<HTMLTableElement>(null);
  const { displayable, recalculateDisplayable } = useTableVirtualScroll(
    config,
    ref,
    data.data.length,
    config.virtualScrollInitial || initialData.length
  );

  return {
    table: (
      <Table tableRef={ref} {...data} {...config} displayable={displayable} />
    ),
    data: data.data,
    updateFn: data.updateFn,
    recalculateDisplayable,
  };
}
