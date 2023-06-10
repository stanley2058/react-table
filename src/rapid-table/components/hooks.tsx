import {
  ReactNode,
  RefObject,
  createElement,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  TableBodyProps,
  TableConfig,
  TableData,
  TableDisplayableArea,
  TableObject,
  VirtualScrollSettings,
} from "../TableTypes";
import { Td, Tr } from ".";
import { debounce } from "lodash";

type TableRowElementProps<T extends TableObject> = TableBodyProps<T> & {
  tableData: TableData<T>;
  headers: (keyof T)[];
};
function TableRowElement<T extends TableObject>(
  props: TableRowElementProps<T>
) {
  const { tableData } = props;
  const { id, data } = tableData;
  const update = useCallback(
    (update: T) => props.updateFn.updateById(id, update),
    [props.updateFn.updateById, id]
  );

  return (
    <Tr className={props.bodyTrClassName?.(data)}>
      {props.headers.map((k) => (
        <Td
          key={`${id}-${k.toString()}`}
          className={props.tdClassName?.(k, data)}
        >
          {props.bodyRenderer?.[k]?.(props.tableName, data, update) ||
            "" + data[k]}
        </Td>
      ))}
    </Tr>
  );
}

export function useTableBodyRows<T extends TableObject>(
  props: TableBodyProps<T>
): ReadonlyArray<ReactNode> {
  const headers = useTableHead(props.headers, props.data);
  const map = useRef<Map<string, ReactNode>>(new Map());

  const elements = useMemo(() => {
    const rendered: ReactNode[] = [];
    const currentIds = new Set<string>();

    for (const d of props.data) {
      currentIds.add(d.id);
      let element = map.current.get(d.id);
      if (!element) {
        const prop = { ...props, tableData: d };
        element = createElement<TableRowElementProps<T>>(TableRowElement, {
          key: d.id,
          ...prop,
          headers,
        });
        map.current.set(d.id, element);
      }
      rendered.push(element);
    }

    for (const k of map.current.keys()) {
      if (currentIds.has(k)) continue;
      map.current.delete(k);
    }

    if (!props.displayable) return rendered;
    return rendered.slice(
      props.displayable.displayStart,
      props.displayable.displayEnd
    );
  }, [props]);

  return elements;
}

export function useTableHead<T extends TableObject>(
  headers: (keyof T)[] | undefined,
  data: ReadonlyArray<TableData<T>>
): (keyof T)[] {
  return useMemo(() => {
    if (headers) return headers;
    if (data.length === 0) return [];
    return Object.keys(data[0].data);
  }, [headers, data]);
}

const showTableHead = debounce((table: HTMLTableElement) => {
  const thead = table.querySelector("thead");
  if (thead) thead.style.visibility = "visible";
});
function updateVirtualScrollImpl(
  config: VirtualScrollSettings,
  scrollDom: HTMLElement,
  table: HTMLTableElement,
  tbody: HTMLTableSectionElement,
  totalDataLength: number,
  update: (displayable: TableDisplayableArea) => void
) {
  const elementHeight = tbody
    .querySelector<HTMLElement>(":first-child")
    ?.getBoundingClientRect().height;
  if (!elementHeight) return;

  const scrollTop = Math.max(
    scrollDom.scrollTop - (config.virtualScrollOffset || 0),
    0
  );
  const viewportHeight = scrollDom.getBoundingClientRect().height;
  const totalHeight = totalDataLength * elementHeight;
  const displayableCounts = Math.ceil(viewportHeight / elementHeight);

  const startAt = Math.floor(scrollTop / elementHeight);

  const displayStart = Math.max(
    startAt - (config.virtualScrollElementMarginTop || 0),
    0
  );
  const displayEnd = Math.min(
    startAt +
      displayableCounts +
      (config.virtualScrollElementMarginBottom || 0),
    totalDataLength
  );

  const topMargin = displayStart * elementHeight;
  const displayableHeight = (displayEnd - displayStart) * elementHeight;
  const bottomMargin = totalHeight - displayableHeight - topMargin;
  table.style.transform = `translateY(${topMargin}px)`;
  table.style.paddingBottom = `${bottomMargin}px`;
  update({ displayStart, displayEnd });

  if (config.hideHeaderDuringScrolling) showTableHead(table);
}

const updateVirtualScroll = debounce(updateVirtualScrollImpl);

export function useTableVirtualScroll<T extends TableObject>(
  config: TableConfig<T>,
  tableRef: RefObject<HTMLTableElement>,
  totalDataLength: number,
  defaultLength: number
): { displayable?: TableDisplayableArea; recalculateDisplayable: () => void } {
  const [displayable, setDisplayable] = useState<TableDisplayableArea>();

  const recalculateDisplayable = useCallback(() => {
    if (!config.viewportRef?.current || !tableRef.current) {
      setDisplayable({ displayStart: 0, displayEnd: defaultLength });
      return;
    }
    const tbody = tableRef.current.querySelector("tbody");
    if (!tbody) return;

    if (config.hideHeaderDuringScrolling && displayable?.displayStart !== 0) {
      const thead = tableRef.current.querySelector("thead");
      if (thead) thead.style.visibility = "hidden";
    }

    updateVirtualScroll(
      config,
      config.viewportRef.current,
      tableRef.current,
      tbody,
      totalDataLength,
      setDisplayable
    );
  }, [totalDataLength, defaultLength]);

  useLayoutEffect(
    () => recalculateDisplayable(),
    [totalDataLength, defaultLength]
  );

  return { displayable, recalculateDisplayable };
}
