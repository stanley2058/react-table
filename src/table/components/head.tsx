import { Th, Tr } from ".";
import { useMemo } from "react";
import { TableHeadProps, TableObject } from "../TableTypes";
import { useTableHead } from "./hooks";

export function THead<T extends TableObject>(props: TableHeadProps<T>) {
  const columns = useTableHead(props.headers, props.data);
  const mappedData = useMemo(() => props.data.map((d) => d.data), [props.data]);

  return (
    <thead className={props?.theadClassName}>
      <Tr className={props?.headTrClassName?.(mappedData)}>
        {columns.map((k, i) => (
          <Th key={i} className={props?.thClassName?.(k, mappedData)}>
            {props.headRenderer?.[k]?.(props.core, mappedData) || k.toString()}
          </Th>
        ))}
      </Tr>
    </thead>
  );
}
