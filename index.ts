import {
  BroccoliPlugin,
  FSTree,
  walkSync,
  WalkSync,
  Minimatch,
  symlinkOrCopy,
  mapSeries,
  fs
} from "./helpers";

import SortedMap from "./sorted_map";

import Graph, { Builder, InputFile, InputDir, OutputFile, OutputDir } from "./graph";

export class SymlinkOrCopyBuilder extends Builder {
  private lastTime: Date;
  private lastSize: number;

  constructor(private input: InputFile, private output: OutputFile) {
    super();
    this.outputs = [ output ];
  }

  build() {
    this.lastTime = this.input.mtime;
    this.lastSize = this.input.size;
    symlinkOrCopy.sync(this.input.fullPath, this.output.fullPath);
  }

  cleanup() {
    fs.unlinkSync(this.output.fullPath);
  }

  isValid() {
    return this.input.size === this.lastSize && this.input.mtime === this.lastTime;
  }

  toString() {
    return `symlinkOrCopy ${this.input} ${this.output}`;
  }
}

export class MakeDirectoryBuilder extends Builder {
  private isBuilt: boolean;

  constructor(private output: OutputDir) {
    super();
    this.outputs = [ output ];
  }

  build() {
    fs.mkdirSync(this.output.fullPath);
    this.isBuilt = true;
  }

  cleanup() {
    fs.unlinkSync(this.output.fullPath);
  }

  isValid() {
    return this.isBuilt;
  }

  toString() {
    return `mkdir ${this.output}`;
  }
}

export class BroccoliProcessor extends BroccoliPlugin {
  /**
   * Filters for tree walk of inputPaths.
   */
  private globs: string | Minimatch[];

  /**
   *  current tree for diffing
   */
  private currentTree: FSTree.Tree;

  /**
   * Graph of inputs, outputs and builders.
   */
  private graph: Graph;

  constructor(inputNodes: any[], options?: any | undefined) {
    super(inputNodes, {
      persistentOutput: true,
      annotation: options && options.annotation,
    });
    this.globs = options && options.globs;
    this.currentTree = FSTree.fromEntries([]);
    this.graph = new Graph(this.outputPath);
  }

  build() {
    let dirtySet = new SortedMap<number, Builder>();
    this.diffInputs(dirtySet);
    mapSeries(dirtySet.values(), (builder) => builder.build());
  }

  private dispatchOp(op: FSTree.Op, entry: WalkSync.Entry): Builder[] {
    switch (op) {
      case "create":
        return this.onInputFileCreated(this.graph.createInputFile(entry.relativePath, entry.basePath, entry.mode, entry.size, entry.mtime));
      case "mkdir":
        return this.onInputDirectoryCreated(this.graph.createInputDir(entry.relativePath, entry.basePath));
      case "unlink":
        // return this.onInputFileRemoved(this.graph.crea(entry.relativePath, entry.basePath, entry.mode, entry.size, entry.mtime));
        break;
      case "change":
        return this.onInputFileChanged(this.graph.updateInputFile(entry.relativePath, entry.basePath, entry.mode, entry.size, entry.mtime));
      case "rmdir":
        // return this.onInputDirectoryRemoved();
        break;
      default:
        throw Error(`unrecognized operation ${op} for entry ${entry.fullPath}`);
    }
  }

  protected diffInputs(dirty: SortedMap<number, Builder>) {
    let entryMap = new SortedMap<string, WalkSync.Entry>();
    this.inputPaths.forEach(inputPath => {
      walkSync.entries(inputPath, {
        globs: this.globs
      }).forEach(entry => entryMap.set(entry.relativePath, entry));
    });
    let currentTree = this.currentTree;
    let nextTree = FSTree.fromEntries(entryMap.values());
    this.currentTree = nextTree;
    let patch = currentTree.calculatePatch(nextTree);
    let builders: Builder[] = [];
    patch.forEach(([op, relativePath, entry]) => {
      let ouputs = this.dispatchOp(op, entry);
      if (ouputs) {
        ouputs.forEach(output => builders.push(output));
      }
    });
    return builders;
  }

  protected addDepForOutput(builder: Builder, dep: Node) {
    // let builders = this.edges.get(dep.id);
    // if (builders) {
    //   builders.push(builder);
    // } else {
    //   this.edges.set(dep.id, [ builder ]);
    // }
    // builder.addDep(dep);
  }

  protected symlinkOrCopy(input: InputFile, relativePath: string): Builder {
    // let id = outputId(relativePath);
    // let builder = new SymlinkOrCopyBuilder(input, relativePath, this.outputPath);
    // this.builders.set(id, builder);
    // this.addDepForOutput(builder, input);
    // return builder;
    return;
  }

  protected mkdir(relativeDirPath: string, dep: Node): Builder {
    // let output = new OutputDir(relativeDirPath, this.outputPath);
    // let builder = this.builders.get(output.id);
    // if (!builder) {
    //   builder = new MakeDirectoryBuilder(output);
    //   this.builders.set(builder.id, builder);
    // }
    // this.addDepForOutput(builder, dep);
    // return builder;
    return;
  }

  // protected buildersForInput(input: Input): Builder[] {
  //   return this.edges.get(input.id);
  // }

  // protected removeInput(input: Input): Builder[] {
  //   let builders = this.edges.get(input.id);
  //   this.edges.delete(input.id);
  //   this.nodes.delete(input.id);
  //   builders.forEach(builder => builder.removeDep(input));
  //   return builders;
  // }

  // INPUT DIFF EVENTS

  protected onInputFileCreated(input: InputFile): Builder[] {
    console.log("created " + input);
    return [this.symlinkOrCopy(input, input.relativePath)];
  }

  protected onInputFileChanged(input: InputFile): Builder[] {
    console.log("changed " + input);
    // return this.buildersForInput(input);
    return;
  }

  protected onInputFileRemoved(input: InputFile): Builder[] {
    console.log("removed " + input);
    // return this.removeInput(input);
    return;
  }

  protected onInputDirectoryCreated(input: InputDir): Builder[] {
    console.log("created " + input);
    return; // [this.mkdir(input.relativePath, input)];
  }

  protected onInputDirectoryRemoved(input: InputDir): Builder[] {
    console.log("removed " + input);
    return;
  }
}
