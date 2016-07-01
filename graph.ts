import SortedMap from "./sorted_map";

export type NodeType = "<" | ">";
export const InputNodeType: NodeType  = "<";
export const OutputNodeType: NodeType = ">";

export abstract class Node {
  public fullPath: string;
  public builder: Builder = undefined;

  constructor(
    public id: string,
    public type: NodeType,
    public relativePath: string,
    public basePath: string) {
    this.fullPath = basePath + "/" + relativePath;
  }

  public abstract isDirectory(): boolean;

  public toString() {
    return `${this.type} ${this.relativePath}`;
  }
}

export abstract class Input extends Node {
  constructor(id: string, relativePath: string, basePath: string) {
    super(id, InputNodeType, relativePath, basePath);
  }
}

export abstract class Output extends Node {
  public builder: Builder;

  constructor(id: string, relativePath: string, basePath: string) {
    super(id, OutputNodeType, relativePath, basePath);
  }

  public revalidate() {
    return this.builder.revalidate();
  }
}

export class InputFile extends Input {
  constructor(id: string, relativePath: string, basePath: string, public mode: number, public size: number, public mtime: Date) {
    super(id, relativePath, basePath);
  }
  public isDirectory() { return false; }
}

export class InputDir extends Input {
  public isDirectory() { return true; }
}

export class OutputFile extends Output {
  public isDirectory() { return false; }
}

export class OutputDir extends Output {
  public isDirectory() { return true; }
}

function nodeId(nodeType: NodeType, relativePath: string): string {
  return nodeType + removeTrailingSlash(relativePath);
}

function inputId(relativePath: string) {
  return nodeId(InputNodeType, relativePath);
}

function outputId(relativePath: string) {
  return nodeId(OutputNodeType, relativePath);
}

function removeTrailingSlash(path: string): string {
  let end = path.length - 1;
  return ~path.lastIndexOf("/", end) ? path : path.slice(0, end);
}

let builderId = 0;
export abstract class Builder {
  deps = new SortedMap<string, Node>();
  outputs: Output[];

  /**
   * Allows the builders to be uniqued to run once per build since builders
   * can build more than one output (e.g. transformed js and a source map)
   * or have multiple deps that cause them to run (e.g. mkdir).
   */
  public id: number;

  constructor() {
    this.id = ++builderId;
  }

  addDep(input: Node) {
    this.deps.set(input.id, input);
  }

  removeDep(input: Node) {
    this.deps.delete(input.id);
  }

  revalidate(): PromiseLike<any> | any {
    if (this.deps.size) {
      if (this.isValid()) {
        return this.build();
      }
    } else {
      return this.cleanup();
    }
  }

  abstract isValid(): boolean;
  abstract build(): PromiseLike<any> | any;
  abstract cleanup(): PromiseLike<any> | any;
}

function isInputFile(node: Node): node is InputFile {
  return node.type === InputNodeType && !node.isDirectory();
}

function isInputDir(node: Node): node is InputDir {
  return node.type === InputNodeType && node.isDirectory();
}

function isOutputFile(node: Node): node is OutputFile {
  return node.type === OutputNodeType && !node.isDirectory();
}

function isOutputDir(node: Node): node is OutputDir {
  return node.type === OutputNodeType && !node.isDirectory();
}

export default class Graph {
  // current map of active nodes.
  private current = new SortedMap<string, Node>();

  // private removed = new SortedMap<string, Node>();

  /**
   * Maps node id the builders it should run again.
   * This can be an output id or input id.
   */
  private deps = new SortedMap<string, Builder[]>();

  /**
   * Maps output id to its Builder.
   */
  private output = new SortedMap<string, Builder>();

  constructor(private outputPath: string) {
  }

  // removed
  // builders

  public createInputFile(relativePath: string,
                         basePath: string,
                         mode: number,
                         size: number,
                         mtime: Date): InputFile {
    let id = inputId(relativePath);
    let node = this.current.get(id);
    if (node) {
      throw new Error(`Existing node ${node} is not an input file.`);
    }
    return new InputFile(id, relativePath, basePath, mode, size, mtime);
  }

  public updateInputFile(relativePath: string,
                         basePath: string,
                         mode: number,
                         size: number,
                         mtime: Date): InputFile {
    let id = inputId(relativePath);
    let node = this.current.get(id);
    if (!node) {
      throw new Error(`Node does not exists for ${relativePath}`);
    }
    if (isInputFile(node)) {
      node.basePath = basePath;
      node.mode = mode;
      node.size = size;
      node.mtime = mtime;
      return node;
    }
    throw new Error(`Existing node ${node} is not an input file.`);
  }

  public createInputDir(relativePath, basePath): InputDir {
    let id = inputId(relativePath);
    let node = this.current.get(id);
    if (node) {
      throw new Error(`Node already exists ${node}`);
    }
    return new InputDir(id, relativePath, basePath);
  }

  public getInputDir(relativePath): InputDir {
    let id = inputId(relativePath);
    let node = this.current.get(id);
    if (isInputDir(node)) {
      return node;
    }
    throw new Error(`Existing node ${node} is not an input dir.`);
  }

  // TODO clean relativePath, it does not come from walkSync
  // needs posix slashes and no leading slash
  public createOutputFile(relativePath): OutputFile {
    let id = outputId(relativePath);
    let node = this.current.get(id);
    if (node) {
      throw new Error(`Node already exists ${node}`);
    }
    return new OutputFile(id, relativePath, this.outputPath);
  }

  // public getOutputFile(relativePath): OutputFile {
  //   let id = outputId(relativePath);
  //   let node = this.current.get(id);
  //   if (isOutputFile(node)) {
  //     return node;
  //   }
  //   throw new Error(`Existing node ${node} is not an output file.`);
  // }

  public createOutputDir(relativePath): OutputDir {
    let id = outputId(relativePath);
    let node = this.current.get(id);
    if (node) {
      throw new Error(`Node already exists ${node}`);
    }
    return new OutputDir(id, relativePath, this.outputPath);
  }

  public getOutputDir(relativePath): OutputDir {
    let id = outputId(relativePath);
    let node = this.current.get(id);
    if (isOutputDir(node)) {
      return node;
    }
    throw new Error(`Existing node ${node} is not an output dir.`);
  }
}
