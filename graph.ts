import SortedMap from "./sorted_map";

export type NodeType = "<" | ">";
export const InputNodeType: NodeType  = "<";
export const OutputNodeType: NodeType = ">";

export abstract class Node {
  public fullPath: string;

  inEdge: Edge | undefined;
  outEdges: Edge[] | undefined;

  constructor(
    public id: string,
    public type: NodeType,
    public relativePath: string,
    public basePath: string) {
    this.fullPath = basePath + "/" + relativePath;
  }

  public addOutEdge(edge: Edge) {
    if (this.outEdges === undefined) {
      this.outEdges = [edge];
    } else {
      this.outEdges.push(edge);
    }
  }

  public abstract isDirectory(): boolean;

  public toString() {
    return `${this.type} ${this.relativePath}`;
  }
}

export abstract class Input extends Node {
  inEdge: undefined = undefined;

  constructor(id: string, relativePath: string, basePath: string) {
    super(id, InputNodeType, relativePath, basePath);
  }
}

export abstract class Output extends Node {
  public inEdge: Edge;

  constructor(id: string, relativePath: string, basePath: string, inEdge: Edge) {
    super(id, OutputNodeType, relativePath, basePath);
    this.inEdge = inEdge;
  }

  public revalidate() {
    return this.inEdge.revalidate();
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

let edgeId = 0;

export abstract class Edge {
  public inputs: Node[];
  public outputs: Output[];

  public id = ++edgeId;

  addInput(input: Node) {
    this.inputs.push(input);
  }

  removeInput(input: Node) {
    let i = this.inputs.indexOf(input);
    if (i !== -1) {
      this.inputs.splice(i, 1);
    }
  }

  revalidate(): PromiseLike<any> | any {
    if (this.inputs.length) {
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

function basename(path: string): string | undefined {
  return;
}

export default class Graph {
  private inputs = new SortedMap<string, Input>();
  private outputs = new SortedMap<string, Output>();
  private removed = new SortedMap<string, Output>();

  private dirty = new SortedMap<number, Edge>();

  constructor(private outputPath: string) {
  }

  public createOutputFile(relativePath: string, inEdge: Edge): void {
    let id = outputId(relativePath);
    let output = this.outputs.get(id);
    if (output) {
      throw new Error(`Output already exists: ${output}`);
    }
    let outputDir = this.createOutputDir("");
  }

  public ensureParentDir(output: Output) {
    let parentPath = basename(output.relativePath);
    if (parentPath !== undefined) {
      let parentDir = this.createOutputDir(parentPath);
      output.inEdge.inputs.forEach(input => input.outEdges.push(parentDir.inEdge));
    }
  }

  public createOutputDir(relativePath: string): OutputDir {
    throw new Error();
  }


  public createInputFile(relativePath: string,
                         basePath: string,
                         mode: number,
                         size: number,
                         mtime: Date): InputFile {
    let id = inputId(relativePath);
    let node = this.inputs.get(id);
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
    let node = this.inputs.get(id);
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

  public createInputDir(relativePath: string, basePath: string): InputDir {
    let id = inputId(relativePath);
    let node = this.inputs.get(id);
    if (node) {
      throw new Error(`Node already exists ${node}`);
    }
    return new InputDir(id, relativePath, basePath);
  }

  public getInputDir(relativePath: string): InputDir | undefined {
    let id = inputId(relativePath);
    let node = this.inputs.get(id);
    if (!node) {
      return;
    }
    if (isInputDir(node)) {
      return node;
    }
    throw new Error(`Existing node ${node} is not an input dir.`);
  }

  // // TODO clean relativePath, it does not come from walkSync
  // // needs posix slashes and no leading slash
  // public createOutputFile(relativePath: string): OutputFile {
  //   let id = outputId(relativePath);
  //   let node = this.inputs.get(id);
  //   if (node) {
  //     throw new Error(`Node already exists ${node}`);
  //   }
  //   return new OutputFile(id, relativePath, this.outputPath);
  // }

  // // public getOutputFile(relativePath): OutputFile {
  // //   let id = outputId(relativePath);
  // //   let node = this.current.get(id);
  // //   if (isOutputFile(node)) {
  // //     return node;
  // //   }
  // //   throw new Error(`Existing node ${node} is not an output file.`);
  // // }

  // public createOutputDir(relativePath: string): OutputDir {
  //   let id = outputId(relativePath);
  //   let node = this.inputs.get(id);
  //   if (node) {
  //     throw new Error(`Node already exists ${node}`);
  //   }
  //   return new OutputDir(id, relativePath, this.outputPath);
  // }

  // public getOutputDir(relativePath: string): OutputDir | undefined {
  //   let id = outputId(relativePath);
  //   let node = this.inputs.get(id);
  //   if (!node) {
  //     return;
  //   }
  //   if (isOutputDir(node)) {
  //     return node;
  //   }
  //   throw new Error(`Existing node ${node} is not an output dir.`);
  // }
}
