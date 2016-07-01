export const FSTree: FSTree.Static = require("fs-tree-diff");
export const BroccoliPlugin: BroccoliPlugin.Static = require("broccoli-plugin");
export const walkSync: WalkSync = require("walk-sync");
export const symlinkOrCopy: SymlinkOrCopy = require("symlink-or-copy");
export const fs: FSModule = require("fs");
export const mapSeries: MapSeries = require("promise-map-series");

declare function require(id: string): any;

export namespace BroccoliPlugin {
  export interface PluginOptions {
    name?: string;
    annotation?: string;
    persistentOutput?: boolean;
  }

  export interface Plugin {
    inputPaths: string[];
    outputPath: string;
    cachePath: string;
  }
  export interface Static {
    new (inputNodes: any[], options?: any): Plugin;
  }
}

export interface Minimatch {
  match(fname: string): boolean;
}

export interface WalkSync {
  (path: string, options: WalkSync.Options): string[];
  entries(path: string, options: WalkSync.Options): WalkSync.Entry[];
}


export namespace FSTree {
  export type Op = "unlink" | "create" | "mkdir" | "rmdir" | "change";

  export type PatchOp = [Op, string, WalkSync.Entry];

  export interface Tree {
    calculatePatch(next: Tree): PatchOp[];
  }

  export interface Static {
    fromEntries(entries: WalkSync.Entry[]): FSTree.Tree;
  }
}

export namespace WalkSync {
  export type Row = string | RegExp[];

  export type Options = {
    globs?: string | Minimatch[];
  };

  export interface Entry {
    relativePath: string;
    basePath: string;
    fullPath: string;
    mode: number;
    size: number;
    mtime: Date;
    isDirectory(): boolean;
  }
}

export interface SymlinkOrCopy {
  sync(srcPath: string, destPath: string): void;
}

export interface FSModule {
  unlinkSync(path: string): void;
  rmdirSync(path: string): void;
  mkdirSync(path: string, mode?: number): void;
}

export interface MapSeries {
  (values: any[], iterator: (item: any, index: number, array: any[]) => PromiseLike<any> | any): PromiseLike<any[]>;
}
