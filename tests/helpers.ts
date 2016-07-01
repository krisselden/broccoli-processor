export interface BuilderConstructor {
  new (plugin: any): Builder;
}

export interface BroccoliResult {
  directory: string;
  graph: BroccoliNode;
  totalTime: number;
}

export interface BroccoliNode {
  id: number;
  selfTime: number;
  totalTime: number;
  tree: any;
  subtrees: BroccoliNode[];
  parents: BroccoliNode[];
  directory: string;
}

export interface Builder {
  build(): PromiseLike<BroccoliResult>;
  cleanup(): PromiseLike<void>;
}

declare function require(id: "broccoli"): {
  Builder: BuilderConstructor;
};

export const { Builder } = require("broccoli");
