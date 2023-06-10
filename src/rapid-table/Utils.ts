export type ComparatorFn<T> = (a: T, b: T) => number;

export function shellSort<T>(arr: T[], comparator?: ComparatorFn<T>): T[] {
  const n = arr.length;
  let gap = Math.floor(n / 2);

  while (gap > 0) {
    for (let i = gap; i < n; i++) {
      const temp = arr[i];
      let j = i;

      while (j >= gap && compare(arr[j - gap], temp) > 0) {
        arr[j] = arr[j - gap];
        j -= gap;
      }

      arr[j] = temp;
    }

    gap = Math.floor(gap / 2);
  }

  return arr;

  function compare(a: T, b: T): number {
    if (comparator) {
      return comparator(a, b);
    }
    if (a === b) {
      return 0;
    }
    return a < b ? -1 : 1;
  }
}
