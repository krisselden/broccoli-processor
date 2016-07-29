
// Produces a Node
export class Edge {
  inputs: Node[] | Node;
  outputs: Output[] | Output;
}

export class Node {
  inEdge: Edge | undefined;
  outEdges: Edge[] | undefined;
}

export class Input extends Node {
  inEdge: undefined = undefined;
  outEdges = undefined;
}

export class Output extends Node {
}
