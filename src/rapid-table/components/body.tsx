import { TableBodyProps, TableObject } from "../TableTypes";
import { useTableBodyRows } from "./hooks";

export function TBody<T extends TableObject>(props: TableBodyProps<T>) {
  const rows = useTableBodyRows(props);

  return <tbody className={props?.tbodyClassName}>{rows}</tbody>;
}
