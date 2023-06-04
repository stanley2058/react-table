import { TableDisplayable, TableHeadProps } from "../TableTypes";
import { Th, Tr } from ".";

export function TableHeadRow<T extends TableDisplayable>(
  props: TableHeadProps<T>
) {
  const keys: (keyof T)[] =
    props.headers || (props.data.length > 0 ? Object.keys(props.data[0]) : []);

  return (
    <Tr className={props.styleRenderer?.headTrClassName?.(props.data)}>
      {keys.map((k, i) => (
        <Th
          key={i}
          className={props.styleRenderer?.thClassName?.(k, props.data)}
        >
          {props.headRenderer?.[k]?.(
            props.data,
            props.globalStore,
            props.tableName
          ) || k.toString()}
        </Th>
      ))}
    </Tr>
  );
}

export function THead<T extends TableDisplayable>(props: TableHeadProps<T>) {
  return (
    <thead className={props.styleRenderer?.theadClassName}>
      <TableHeadRow {...props} />
    </thead>
  );
}
