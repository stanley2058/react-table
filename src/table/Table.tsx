import {
  ReactNode,
  Ref,
  RefObject,
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
  TableBodyRowRenderer,
} from "./TableTypes";
import { TBody, THead } from "./components";
import { v4 } from "uuid";
import { useTableVirtualScroll } from "./components/hooks";

export function Table<T extends TableObject>(
  props: TableProps<T> & {
    tableRef: Ref<HTMLTableElement>;
    topRef: Ref<HTMLTableColElement>;
    bottomRef: Ref<HTMLTableColElement>;
  }
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
    <table ref={props.tableRef} className={styles?.tableClassName}>
      <colgroup ref={props.topRef} style={{ display: "block" }} />
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
      <colgroup ref={props.bottomRef} style={{ display: "block" }} />
    </table>
  );
}

function toTableData<T extends TableObject>(data: T[]): TableData<T>[] {
  return data.map((d) => ({ id: v4(), data: d }));
}
export function useTableData<T extends TableObject>(
  data: T[]
): TableCoreData<T> {
  const [tableData, setTableData] = useState<TableData<T>[]>(toTableData(data));
  useEffect(() => setTableData(toTableData(data)), [data]);
  const resetToInitial = useCallback(
    () => setTableData(toTableData(data)),
    [data]
  );

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
      resetToInitial,
    }),
    [resetToInitial]
  );

  return {
    data: tableData,
    updateFn,
  };
}

function useRowHeight<T extends TableObject>(
  tableRef: RefObject<HTMLTableElement>,
  renderer: Partial<TableBodyRowRenderer<T>> | undefined
) {
  const [rowHeight, setRowHeight] = useState(0);

  useEffect(() => {
    const tbody = tableRef.current?.querySelector("tbody");
    if (!tbody) return;
    const observer = new MutationObserver(() => {
      if (!tableRef.current) return;
      const firstClild = tbody.querySelector(":first-child");
      if (!firstClild) return;
      const height = firstClild.getBoundingClientRect().height;
      if (height === rowHeight) return;
      setRowHeight(height);
    });

    observer.observe(tbody, {
      childList: true,
    });
    return () => observer.disconnect();
  }, [renderer]);

  return rowHeight;
}

export function useTable<T extends TableObject>(
  initialData: T[],
  config: TableConfig<T>
): {
  table: ReactNode;
  recalculateDisplayable: () => void;
} & TableCoreData<T> {
  const data = useTableData(initialData);
  const ref = useRef<HTMLTableElement>(null);
  const topRef = useRef<HTMLTableColElement>(null);
  const bottomRef = useRef<HTMLTableColElement>(null);
  const refs = useMemo(
    () => ({
      tableRef: ref,
      topRef,
      bottomRef,
    }),
    []
  );

  const rowHeight = useRowHeight(ref, config.bodyRenderer);

  const { displayable, recalculateDisplayable } = useTableVirtualScroll(
    config,
    refs,
    rowHeight,
    data.data.length,
    config.virtualScrollInitial || data.data.length
  );

  return {
    table: (
      <Table
        tableRef={ref}
        topRef={topRef}
        bottomRef={bottomRef}
        {...data}
        {...config}
        displayable={displayable}
      />
    ),
    recalculateDisplayable,
    ...data,
  };
}
