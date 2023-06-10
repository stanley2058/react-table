import { Store, useStore } from "../../store";
import {
  TableBodyRowInfo,
  TableBodyRowProps,
  TableComponentProps,
  TableData,
  TableDisplayable,
} from "../TableTypes";
import { Td, Tr } from ".";
import { useCallback, useMemo } from "react";
import { useTableBodyDataStore, useTableHeaders } from "./hooks";

export function RawTableBodyRow<T extends TableDisplayable>(props: {
  tableStore: Store<TableData<T>>;
  store: Store<TableBodyRowInfo<T>>;
}) {
  const { styleRenderer, bodyRenderer } = useStore(
    props.tableStore,
    "styleRenderer",
    "bodyRenderer"
  );
  const headers = useTableHeaders(props.tableStore);
  const rowData = useStore(props.store);
  const update = useCallback((value: Partial<TableBodyRowInfo<T>>) => {}, []);

  return rowData.visible ? (
    <Tr className={styleRenderer?.bodyTrClassName?.(rowData)}>
      {Object.keys(rowData.data).map(
        (k: keyof T, i) =>
          headers.has(k) && (
            <Td key={i} className={styleRenderer?.tdClassName?.(k, rowData)}>
              {bodyRenderer?.[k]?.(rowData, update) || "" + rowData.data[k]}
            </Td>
          )
      )}
    </Tr>
  ) : null;
}

export function TableBodyRow<T extends TableDisplayable>(
  props: TableBodyRowProps<T>
) {
  const { styleRenderer, bodyRenderer } = useStore(
    props.tableStore,
    "styleRenderer",
    "bodyRenderer"
  );
  const headers = useTableHeaders(props.tableStore);
  const rowData = useStore(props.store);
  const update = useCallback((value: Partial<TableBodyRowInfo<T>>) => {
    const { data, ...rest } = value;
    const updateVal: Partial<TableBodyRowInfo<T>> = rest;
    // making sure the data field is updated with a new object
    // because we use this to identify if a row is dirty
    if (data) updateVal.data = { ...data };
    props.store.set(updateVal);

    // emit state update upwards without triggering rerender
    if (updateVal.data) {
      // TODO: send update
    }
  }, []);

  return rowData.visible ? (
    <Tr className={styleRenderer?.bodyTrClassName?.(rowData)}>
      {Object.keys(rowData.data).map(
        (k: keyof T, i) =>
          headers.has(k) && (
            <Td key={i} className={styleRenderer?.tdClassName?.(k, rowData)}>
              {bodyRenderer?.[k]?.(rowData, update) || "" + rowData.data[k]}
            </Td>
          )
      )}
    </Tr>
  ) : null;
}

export function TBody<T extends TableDisplayable>(
  props: TableComponentProps<T>
) {
  const { styleRenderer } = useStore(props.tableStore, "styleRenderer");
  const dataStores = useTableBodyDataStore(props.tableStore);
  const Row = useMemo(() => TableBodyRow, []);

  return (
    <tbody className={styleRenderer?.tbodyClassName}>
      {dataStores.map((s) => (
        <Row key={s.getValue("id")} store={s} {...props} />
      ))}
    </tbody>
  );
}
