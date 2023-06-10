import { createElement, useCallback, useEffect, useState } from "react";
import { Store, useDerivedStore } from "../../store";
import {
  InternalTableBodyRowInfo,
  TableBodyRowInfo,
  TableData,
  TableDisplayable,
} from "../TableTypes";
import { v4 } from "uuid";
import { RawTableBodyRow, TableBodyRow } from "./body";

function tableDataTransformer<T extends TableDisplayable>(
  tableStore: Store<TableData<T>>,
  data: TableData<T>
): InternalTableBodyRowInfo<T>[] {
  const rows: InternalTableBodyRowInfo<T>[] = [];

  data.data.forEach((d) => {
    const id = v4();
    const info: TableBodyRowInfo<T> = {
      data: d,
      visible: true,
      selected: false,
      tableName: data.tableName,
    };
    const store = new Store(info);

    const element = <RawTableBodyRow tableStore={tableStore} store={store} />;

    rows.push({
      id,
      info,
      rowStore: store,
      element,
    });
  });

  return rows;
}

export function useTableBodyDataStore<T extends TableDisplayable>(
  store: Store<TableData<T>>
): ReadonlyArray<Store<TableBodyRowInfo<T>>> {
  const [dataStores, setDataStores] = useState(
    store.getValue("data").map(
      (d) =>
        new Store<TableBodyRowInfo<T>>({
          id: v4(),
          visible: true,
          selected: false,
          data: d,
          tableName: store.getValue("tableName"),
        })
    ) || []
  );

  useEffect(() => {
    return store.subscribe(
      ({ data, tableName }, fields) => {
        if (data.length < dataStores.length) {
          dataStores.length = data.length;
        }

        for (let i = 0; i < dataStores.length; i++) {
          const store = dataStores[i];
          const current = store.getValue("data");
          if (current === data[i]) continue;
          const updateData: Partial<TableBodyRowInfo<T>> = { data: data[i] };
          if (fields.has("tableName")) updateData.tableName = tableName;
          store.set(updateData);
        }

        if (data.length > dataStores.length) {
          for (let i = dataStores.length; i < data.length; i++) {
            dataStores.push(
              new Store<TableBodyRowInfo<T>>({
                id: v4(),
                visible: true,
                selected: false,
                data: data[i],
                tableName,
              })
            );
          }
        }
        setDataStores([...dataStores]);
      },
      "data",
      "tableName"
    );
  }, []);

  return dataStores;
}

export function useTableSort<T extends TableDisplayable>(
  store: Store<TableData<T>>
) {
  useEffect(() => {
    return store.subscribe(
      (state) => {
        const data = store.getValue("data");
        const { sortBy, sorter, sortDir } = state;
        const sortFn = sortBy && sorter?.[sortBy];
        if (!sortFn) return;
        const dir = sortDir === "DESC" ? -1 : 1;
        store.set({
          data: [...data.sort((a, b) => sortFn(a, b) * dir)],
        });
      },
      "sortBy",
      "sorter",
      "sortDir"
    );
  }, []);
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
export function useTableHeaders<T extends TableDisplayable>(
  store: Store<TableData<T>>
): Set<keyof T> {
  const [headers, setHeaders] = useState(
    extractHeaders(store.getValue("headers"), store.getValue("data"))
  );

  useEffect(() => {
    return store.subscribe(
      (state) => {
        setHeaders((h) => extractHeaders(state.headers, state.data, h));
      },
      "headers",
      "data"
    );
  }, []);

  return headers;
}
