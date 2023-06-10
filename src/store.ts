import { useEffect, useMemo, useState } from "react";
import { debounce } from "lodash";

/**
 * @param state the current state of the stored object
 * @param updateFields the fields that triggered the update, empty if is fired by hot subscribe
 */
export type StoreEmitHandler<T> = (
  state: T,
  updatedFields: Set<keyof T>
) => void;
export type StoreUnsubscribeFn = () => void;

type UpdateQueueItem<T extends Record<string | symbol, unknown>> = readonly [
  emitFn: StoreEmitHandler<T>,
  state: T,
  fields: Set<keyof T>
];

export class Store<T extends Record<string | symbol, unknown>> {
  static updateQueue = new Map<StoreEmitHandler<any>, UpdateQueueItem<any>>();
  private static doUpdate = debounce(() => {
    if (Store.updateQueue.size === 0) return;
    Store.updateQueue.forEach(([fn, s, f]) => fn(s, f));
    Store.updateQueue.clear();
  });

  private store: T;
  private handlers: Map<keyof T | undefined, Set<StoreEmitHandler<T>>> =
    new Map();

  constructor(initialValue: T) {
    this.handlers.set(undefined, new Set());
    for (const k in initialValue) {
      this.handlers.set(k, new Set());
    }

    this.store = new Proxy(initialValue, {
      set: (object, key: keyof T, value: T[keyof T]) => {
        object[key] = value;

        const toCall = [
          ...(this.handlers.get(undefined) || []),
          ...(this.handlers.get(key) || []),
        ];
        for (const h of toCall) {
          const existing = Store.updateQueue.get(h);
          const keys = (existing?.[2] || new Set()).add(key);
          Store.updateQueue.set(h, [h, object, keys] as const);
        }
        Store.doUpdate();
        return true;
      },
    });
  }

  set(value: Partial<T>): void {
    let key: keyof T;
    for (key in value) {
      const val = value[key];
      if (!val) continue;
      this.store[key] = val;
    }
  }

  get(): T {
    return this.store;
  }

  getValue<K extends keyof T>(key: K): T[K] {
    return this.store[key];
  }

  subscribe(
    onEmit: StoreEmitHandler<T>,
    ...on: Array<keyof T>
  ): StoreUnsubscribeFn {
    const localEmitFn: StoreEmitHandler<T> = (s, f) => onEmit(s, f);
    if (on.length === 0) this.handlers.get(undefined)!.add(localEmitFn);

    for (const key of on) {
      if (!this.handlers.has(key)) this.handlers.set(key, new Set());
      this.handlers.get(key)!.add(localEmitFn);
    }

    return () => {
      this.handlers.get(undefined)?.delete(localEmitFn);
      for (const key of on) {
        this.handlers.get(key)?.delete(localEmitFn);
      }
    };
  }

  hotSubscribe(
    onEmit: StoreEmitHandler<T>,
    ...on: Array<keyof T>
  ): StoreUnsubscribeFn {
    onEmit(this.store, new Set());
    return this.subscribe(onEmit, ...on);
  }

  /**
   * Derive a store from another one
   * @param store to derive from
   * @param reducer transform object from `FT` to `T`
   * @param partialReducer provide this to prevent state syncing causing update on all fields
   */
  static deriveFrom<
    T extends Record<string | symbol, unknown>,
    FT extends Record<string | symbol, unknown>
  >(
    store: Store<FT>,
    reducer: (value: FT) => T,
    partialReducer?: (current: T, partialUpdate: Partial<FT>) => Partial<T>
  ): Store<T> {
    const newStore = new this(reducer(store.get()));
    store.subscribe((state, fields) => {
      if (!partialReducer) return newStore.set(reducer(state));
      const update: Partial<FT> = {};
      for (const key of fields) update[key] = state[key];
      newStore.set(partialReducer(newStore.get(), update));
    });
    return newStore;
  }
}

export function useStore<T extends Record<string | symbol, unknown>>(
  store: Store<T>,
  ...fields: (keyof T)[]
): T {
  const [state, setState] = useState(store.get());

  useEffect(() => {
    return store.subscribe((s) => setState({ ...s }), ...fields);
  }, []);

  return state;
}

export function useDerivedStore<
  T extends Record<string | symbol, unknown>,
  FT extends Record<string | symbol, unknown>
>(
  store: Store<FT>,
  reducer: (value: FT) => T,
  partialReducer?: (current: T, partialUpdate: Partial<FT>) => Partial<T>
): T {
  return useStore(Store.deriveFrom(store, reducer, partialReducer));
}

export function useStoreWithInitial<T extends Record<string | symbol, unknown>>(
  initValue: T,
  ...fields: (keyof T)[]
): readonly [T, Store<T>] {
  const store = useMemo(() => new Store(initValue), []);
  const state = useStore(store, ...fields);
  return [state, store] as const;
}
