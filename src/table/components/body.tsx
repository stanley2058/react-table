import { useStore } from "../../store";
import {
  TableBodyProps,
  TableBodyRowInfo,
  TableBodyRowProps,
  TableDisplayable,
} from "../TableTypes";
import { Td, Tr } from ".";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTableBodyDataStore } from "./hooks";

export function TableBodyRow<T extends TableDisplayable>(
  props: TableBodyRowProps<T>
) {
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
      const upstreamData = props.globalStore.getValue("data");
      upstreamData[rowData.order] = {
        ...upstreamData[rowData.order],
        ...updateVal.data,
      };
    }
  }, []);

  return rowData.visible ? (
    <Tr className={props.styleRenderer?.bodyTrClassName?.(rowData)}>
      {Object.keys(rowData.data).map(
        (k: keyof T, i) =>
          props.headers.has(k) && (
            <Td
              key={i}
              className={props.styleRenderer?.tdClassName?.(k, rowData)}
            >
              {props.bodyRenderer?.[k]?.(rowData, update) ||
                "" + rowData.data[k]}
            </Td>
          )
      )}
    </Tr>
  ) : null;
}

function extractHeaders<T extends TableDisplayable>(
  headers: (keyof T)[] | undefined,
  data: T[],
  current?: Set<keyof T>
): Set<keyof T> {
  const extracted = headers || (data.length > 0 ? Object.keys(data[0]) : []);
  if (current && extracted.every((h) => current.has(h))) {
    extracted.filter((h) => !current.has(h)).forEach((h) => current.delete(h));
    return current;
  }
  return new Set(extracted);
}

export function TBody<T extends TableDisplayable>(props: TableBodyProps<T>) {
  const { data } = props;
  const [headers, setHeaders] = useState(extractHeaders(props.headers, data));
  useEffect(() => {
    setHeaders((h) => extractHeaders(props.headers, data, h));
  }, [props.headers, data]);

  const dataStores = useTableBodyDataStore(data, props.tableName);
  const Row = useMemo(() => TableBodyRow, []);

  return (
    <tbody className={props.styleRenderer?.tbodyClassName}>
      {dataStores.map((s, i) => (
        <Row
          key={i}
          store={s}
          headers={headers}
          globalStore={props.globalStore}
          styleRenderer={props.styleRenderer}
          bodyRenderer={props.bodyRenderer}
        />
      ))}
    </tbody>
  );
}
