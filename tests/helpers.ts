import SortedMap from "../sorted_map";

declare function require(id: "tmp"): tmp.Module;
declare function require(id: "fs"): fs.Module;
declare function require(id: string): any;

const tmp = require("tmp");
const fs = require("fs");

tmp.setGracefulCleanup();

export function buildTree(entries: Entries): Tree {
  let tree = new Tree();

  try {
    populateTree(tree.basePath, entries);
  } catch (e) {
    tree.dispose();
    throw e;
  }

  return tree;
}

export class Tree {
  public basePath: string;

  public entries = new SortedMap<string, null>();

  private _removeCallback: () => void;

  constructor() {
    let tmpDir = tmp.dirSync({
      prefix: "broccoli-fixture-",
      unsafeCleanup: true
    });
    this.basePath = tmpDir.name;
    this._removeCallback = tmpDir.removeCallback;
  }

  dispose(): void {
    try {
      this._removeCallback();
    } catch (e) {}
  }

  removeFile(path: string): void {

  }

  addFile(path: string, contents: string): void {

  }
}

export interface Entries {
  [entry: string]: string | null;
}

function populateTree(rootDir: string, entries: Entries) {
  for (let key in entries) {
    let val = entries[key];
    if (val === null) {
      // dir
    } else {
      // file
    }
  }
}

namespace fs {
  export interface Module {
    writeFileSync(file: string, data: string): void;
  }
}

namespace tmp {
  export interface Dir {
    name: string;
    removeCallback(): void;
  }

  export interface Module {
    dirSync(options?: {
      prefix?: string;
      unsafeCleanup?: boolean;
    }): Dir;
    setGracefulCleanup(): void;
  }
}
