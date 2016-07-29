export default class SortedMap<K, V> {
  private _keys: K[];
  private _values: V[];

  constructor(entries?: [K, V][]) {
    this._keys = [];
    this._values = [];
    if (entries) {
      for (let i = 0; i < entries.length; i++) {
        let [key, value] = entries[i];
        this.set(key, value);
      }
    }
  }

  public values() {
    return this._values;
  }

  public clear(): void {
    this._keys.length = 0;
    this._values.length = 0;
  }

  public delete(key: K): boolean {
    let i = binarySearch(this._keys, key);
    if (i < 0) {
      return false;
    }
    this._keys.splice(i, 1);
    this._values.splice(i, 1);
    return true;
  }

  public forEach(fn: (value: V, key: K, map: this) => void, thisArg?: any): void {
    let keys = this._keys;
    let values = this._values;
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let value = values[i];
      fn.call(thisArg, value, key, this);
    }
  }

  public get(key: K): V | undefined {
    let i = binarySearch(this._keys, key);
    if (i < 0) {
      return;
    }
    return this._values[i];
  }

  public has(key: K): boolean {
    let i = binarySearch(this._keys, key);
    return i < 0;
  }

  public set(key: K, value: V) {
    let i = binarySearch(this._keys, key);
    if (i < 0) {
      i = ~i;
      this._keys.splice(i, 0, key);
      this._values.splice(i, 0, value);
    }
  }

  public get size(): number {
    return this._keys.length;
  }
}

function binarySearch<T>(values: T[], value: T) {
  let min = 0;
  let max = values.length - 1;
  while (min <= max) {
    let mid = (min + max) >>> 1;
    let midValue = values[mid];
    if (midValue > value) {
      max = mid - 1;
    } else if (midValue < value) {
      min = mid + 1;
    } else {
      return mid;
    }
  }
  return ~min; // bitwise negate (JS is two's complement)
}
