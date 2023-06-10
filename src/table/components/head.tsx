import { TableComponentProps, TableDisplayable } from "../TableTypes";
import { Th, Tr } from ".";
import { useStore } from "../../store";
import { useTableHeaders } from "./hooks";
import { useMemo } from "react";

export function TableHeadRow<T extends TableDisplayable>(
  props: TableComponentProps<T>
) {
  const headers = useTableHeaders(props.tableStore);
  const keys = useMemo(() => [...headers], [headers]);
  const { styleRenderer, headRenderer, data, tableName } = useStore(
    props.tableStore,
    "styleRenderer",
    "headRenderer",
    "data",
    "tableName"
  );

  return (
    <Tr className={styleRenderer?.headTrClassName?.(data)}>
      {keys.map((k, i) => (
        <Th key={i} className={styleRenderer?.thClassName?.(k, data)}>
          {headRenderer?.[k]?.(data, props.tableStore, tableName) ||
            k.toString()}
        </Th>
      ))}
    </Tr>
  );
}

export function THead<T extends TableDisplayable>(
  props: TableComponentProps<T>
) {
  const { styleRenderer } = useStore(props.tableStore, "styleRenderer");
  return (
    <thead className={styleRenderer?.theadClassName}>
      <TableHeadRow {...props} />
    </thead>
  );
}
