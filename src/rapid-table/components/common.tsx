import { HTMLProps, PropsWithChildren } from "react";

export function Tr(props: PropsWithChildren<HTMLProps<HTMLTableRowElement>>) {
  const { children, ...rest } = props;
  return <tr {...rest}>{children}</tr>;
}
export function Th(props: PropsWithChildren<HTMLProps<HTMLTableCellElement>>) {
  const { children, ...rest } = props;
  return <th {...rest}>{children}</th>;
}
export function Td(props: PropsWithChildren<HTMLProps<HTMLTableCellElement>>) {
  const { children, ...rest } = props;
  return <td {...rest}>{children}</td>;
}
