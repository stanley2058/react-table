import {
  Dispatch,
  ReactNode,
  RefObject,
  SetStateAction,
  createElement,
  useCallback,
  useEffect,
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

function getRenderingData<T extends TableObject>(
  props: TableBodyProps<T>
): ReadonlyArray<TableData<T>> {
  if (!props.displayable) return props.data;
  return props.data.slice(
    props.displayable.displayStart,
    props.displayable.displayEnd
  );
}

export function useTableBodyRows<T extends TableObject>(
  props: TableBodyProps<T>
): ReadonlyArray<ReactNode> {
  const headers = useTableHead(props.headers, props.data);
  const map = useRef<Map<string, ReactNode>>(new Map());

  const elements = useMemo(() => {
    const rendered: ReactNode[] = [];
    const currentIds = new Set<string>(props.data.map((d) => d.id));

    const data = getRenderingData(props);
    for (const d of data) {
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

    return rendered;
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
  rowHeight: number,
  scrollDom: HTMLElement,
  table: HTMLTableElement,
  topSpacer: HTMLElement,
  bottomSpacer: HTMLElement,
  totalDataLength: number,
  update: Dispatch<SetStateAction<TableDisplayableArea>>
) {
  const scrollTop = Math.max(
    scrollDom.scrollTop - (config.virtualScrollOffset || 0),
    0
  );
  const viewportHeight = scrollDom.getBoundingClientRect().height;
  const totalHeight = totalDataLength * rowHeight;

  const topElements =
    Math.round((scrollTop / totalHeight) * totalDataLength) -
    (config.virtualScrollElementMarginTop || 0);
  const displayableElements =
    Math.round((viewportHeight / totalHeight) * totalDataLength) +
    (config.virtualScrollElementMarginTop || 0) +
    (config.virtualScrollElementMarginBottom || 0);
  const bottomElements = totalDataLength - topElements - displayableElements;

  const topMargin = Math.max(topElements, 0) * rowHeight;
  const bottomMargin = Math.max(bottomElements, 0) * rowHeight;
  topSpacer.style.height = `${topMargin}px`;
  bottomSpacer.style.height = `${bottomMargin}px`;

  update({
    displayStart: Math.max(topElements + 1, 0),
    displayEnd: Math.min(topElements + displayableElements, totalDataLength),
  });

  console.log(totalDataLength, rowHeight, bottomMargin);

  if (config.hideHeaderDuringScrolling) showTableHead(table);
}

const updateVirtualScroll = debounce(updateVirtualScrollImpl);

export type TableRefs = {
  tableRef: RefObject<HTMLTableElement>;
  topRef: RefObject<HTMLDivElement>;
  bottomRef: RefObject<HTMLDivElement>;
};
export function useTableVirtualScroll<T extends TableObject>(
  config: TableConfig<T>,
  refs: TableRefs,
  rowHeight: number,
  totalDataLength: number,
  defaultLength: number
): { displayable?: TableDisplayableArea; recalculateDisplayable: () => void } {
  const [displayable, setDisplayable] = useState<TableDisplayableArea>({
    displayStart: 0,
    displayEnd: defaultLength,
  });
  const displayableRef = useRef(displayable);
  displayableRef.current = displayable;

  const recalculateDisplayable = useCallback(() => {
    if (
      !config.viewportRef?.current ||
      !refs.tableRef.current ||
      !refs.topRef.current ||
      !refs.bottomRef.current
    ) {
      setDisplayable({ displayStart: 0, displayEnd: defaultLength });
      return;
    }

    if (
      config.hideHeaderDuringScrolling &&
      displayableRef.current?.displayStart !== 0
    ) {
      const thead = refs.tableRef.current.querySelector("thead");
      if (thead) thead.style.visibility = "hidden";
    }

    updateVirtualScroll(
      config,
      rowHeight,
      config.viewportRef.current,
      refs.tableRef.current,
      refs.topRef.current,
      refs.bottomRef.current,
      totalDataLength,
      setDisplayable
    );
  }, [totalDataLength, defaultLength, rowHeight]);

  useEffect(() => {
    setDisplayable({
      displayStart: 0,
      displayEnd: defaultLength,
    });
  }, [totalDataLength, defaultLength]);
  useLayoutEffect(
    () => recalculateDisplayable(),
    [totalDataLength, defaultLength, rowHeight]
  );

  useEffect(() => {
    if (!config.viewportRef?.current) return;
    const observer = new ResizeObserver(() => {
      if (!displayableRef.current) return;
      recalculateDisplayable();
    });
    observer.observe(config.viewportRef.current);
    return () => observer.disconnect();
  }, [recalculateDisplayable]);
  return { displayable, recalculateDisplayable };
}
