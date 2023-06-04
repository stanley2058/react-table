import { useEffect, useState } from "react";
import { Store } from "../../store";
import { TableBodyRowInfo, TableData, TableDisplayable } from "../TableTypes";

export function useTableBodyDataStore<T extends TableDisplayable>(
  data: T[],
  tableName?: string
): ReadonlyArray<Store<TableBodyRowInfo<T>>> {
  const [dataStores, setDataStores] = useState(
    data.map(
      (d, i) =>
        new Store<TableBodyRowInfo<T>>({
          order: i,
          visible: true,
          selected: false,
          data: d,
          tableName,
        })
    )
  );

  useEffect(() => {
    if (data.length < dataStores.length) {
      dataStores.length = data.length;
    }

    for (let i = 0; i < dataStores.length; i++) {
      const store = dataStores[i];
      const current = store.getValue("data");
      if (current === data[i]) continue;
      store.set({ data: data[i] });
    }

    if (data.length > dataStores.length) {
      for (let i = dataStores.length; i < data.length; i++) {
        dataStores.push(
          new Store<TableBodyRowInfo<T>>({
            order: i,
            visible: true,
            selected: false,
            data: data[i],
            tableName,
          })
        );
      }
    }
    setDataStores([...dataStores]);
  }, [data]);

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
