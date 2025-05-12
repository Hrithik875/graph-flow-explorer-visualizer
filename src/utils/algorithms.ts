
import { GraphData, NodeData, EdgeData, createAdjacencyList, findEdge } from './graphUtils';

// Helper type for algorithm step
export interface AlgorithmStep {
  type: 'visitNode' | 'processNode' | 'visitEdge' | 'addToMST' | 'skipEdge' | 'done';
  nodeId?: string;
  edgeId?: string;
  message: string;
  totalCost?: number; // Adding total cost for MST algorithms
}

// Prim's Algorithm (MST)
export function* primMST(graph: GraphData, startNodeId: string): Generator<AlgorithmStep> {
  if (!startNodeId || !graph.nodes.find(n => n.id === startNodeId)) {
    yield { type: 'done', message: 'No start node selected' };
    return;
  }
  
  const nodes = graph.nodes;
  const visited = new Set<string>([startNodeId]);
  const adjList = createAdjacencyList(graph);
  const mstEdges: EdgeData[] = [];
  let totalCost = 0;
  
  // Mark start node as visited
  yield { 
    type: 'visitNode', 
    nodeId: startNodeId, 
    message: `Starting Prim's algorithm from node ${startNodeId}`
  };
  
  // While we haven't visited all nodes
  while (visited.size < nodes.length) {
    let minWeight = Infinity;
    let minEdge: EdgeData | null = null;
    let nextNode: string | null = null;
    
    // For each visited node
    for (const visitedNodeId of visited) {
      // Get its neighbors from adjacency list
      const neighbors = adjList.get(visitedNodeId) || [];
      
      // Check each neighbor
      for (const { nodeId: neighborId, weight } of neighbors) {
        if (!visited.has(neighborId)) {
          const edge = findEdge(graph, visitedNodeId, neighborId);
          if (!edge) continue;
          
          // Highlight the edge we're considering
          yield { 
            type: 'visitEdge', 
            edgeId: edge.id, 
            message: `Considering edge ${edge.id} with weight ${edge.weight}`
          };
          
          // If this edge has a smaller weight
          if (weight < minWeight) {
            minWeight = weight;
            minEdge = edge;
            nextNode = neighborId;
            
            yield { 
              type: 'processNode', 
              nodeId: neighborId, 
              message: `Found better edge to node ${neighborId} with weight ${weight}`
            };
          } else {
            yield { 
              type: 'skipEdge', 
              edgeId: edge.id, 
              message: `Skipping edge ${edge.id} as we have a better option`
            };
          }
        }
      }
    }
    
    // If we didn't find a new edge, the graph is disconnected
    if (!minEdge || !nextNode) {
      yield { 
        type: 'done', 
        message: 'Graph is disconnected, MST cannot be completed',
        totalCost
      };
      return;
    }
    
    // Add the minimum edge to MST and update total cost
    mstEdges.push(minEdge);
    totalCost += minEdge.weight;
    visited.add(nextNode);
    
    // Highlight the new MST edge and node
    yield { 
      type: 'addToMST', 
      edgeId: minEdge.id,
      nodeId: nextNode,
      message: `Adding edge ${minEdge.id} to MST and visiting node ${nextNode}. Current cost: ${totalCost}`
    };
  }
  
  yield { 
    type: 'done', 
    message: `Prim's algorithm completed. MST has ${mstEdges.length} edges.`,
    totalCost
  };
}

// Kruskal's Algorithm (MST)
export function* kruskalMST(graph: GraphData): Generator<AlgorithmStep> {
  // Create a disjoint-set data structure
  const parent: Record<string, string> = {};
  const rank: Record<string, number> = {};
  
  // Initialize each node as its own set
  graph.nodes.forEach(node => {
    parent[node.id] = node.id;
    rank[node.id] = 0;
  });
  
  // Find function for union-find
  function find(nodeId: string): string {
    if (parent[nodeId] !== nodeId) {
      parent[nodeId] = find(parent[nodeId]); // Path compression
    }
    return parent[nodeId];
  }
  
  // Union function for union-find
  function union(x: string, y: string): void {
    const rootX = find(x);
    const rootY = find(y);
    
    if (rootX === rootY) return;
    
    // Union by rank
    if (rank[rootX] < rank[rootY]) {
      parent[rootX] = rootY;
    } else if (rank[rootX] > rank[rootY]) {
      parent[rootY] = rootX;
    } else {
      parent[rootY] = rootX;
      rank[rootX]++;
    }
  }
  
  // Sort edges by weight
  const sortedEdges = [...graph.edges].sort((a, b) => a.weight - b.weight);
  const mstEdges: EdgeData[] = [];
  let totalCost = 0;
  
  yield { type: 'done', message: `Starting Kruskal's algorithm with ${sortedEdges.length} edges` };
  
  // Process each edge in order
  for (const edge of sortedEdges) {
    yield { 
      type: 'visitEdge', 
      edgeId: edge.id, 
      message: `Considering edge ${edge.id} with weight ${edge.weight}`
    };
    
    const fromRoot = find(edge.from);
    const toRoot = find(edge.to);
    
    // If including this edge doesn't create a cycle
    if (fromRoot !== toRoot) {
      // Add edge to MST and update total cost
      mstEdges.push(edge);
      totalCost += edge.weight;
      union(fromRoot, toRoot);
      
      yield { 
        type: 'addToMST', 
        edgeId: edge.id,
        nodeId: edge.to,
        message: `Adding edge ${edge.id} to MST. Current cost: ${totalCost}`
      };
      
      // If we have enough edges for an MST
      if (mstEdges.length === graph.nodes.length - 1) {
        break;
      }
    } else {
      yield { 
        type: 'skipEdge', 
        edgeId: edge.id, 
        message: `Skipping edge ${edge.id} as it would create a cycle`
      };
    }
  }
  
  // Check if we've built a complete MST
  if (mstEdges.length < graph.nodes.length - 1) {
    yield { 
      type: 'done', 
      message: 'Graph is disconnected, MST cannot be completed',
      totalCost
    };
  } else {
    yield { 
      type: 'done', 
      message: `Kruskal's algorithm completed. MST has ${mstEdges.length} edges.`,
      totalCost
    };
  }
}

// Breadth-First Search (BFS)
export function* bfs(graph: GraphData, startNodeId: string): Generator<AlgorithmStep> {
  if (!startNodeId || !graph.nodes.find(n => n.id === startNodeId)) {
    yield { type: 'done', message: 'No start node selected' };
    return;
  }
  
  const adjList = createAdjacencyList(graph);
  const visited = new Set<string>();
  const queue: string[] = [startNodeId];
  visited.add(startNodeId);
  
  yield { 
    type: 'visitNode', 
    nodeId: startNodeId, 
    message: `Starting BFS from node ${startNodeId}`
  };
  
  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;
    
    yield { 
      type: 'processNode', 
      nodeId: currentNodeId, 
      message: `Processing node ${currentNodeId}`
    };
    
    const neighbors = adjList.get(currentNodeId) || [];
    
    for (const { nodeId: neighborId } of neighbors) {
      const edge = findEdge(graph, currentNodeId, neighborId);
      
      if (edge) {
        yield { 
          type: 'visitEdge', 
          edgeId: edge.id, 
          message: `Examining edge to neighbor ${neighborId}`
        };
      }
      
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
        
        if (edge) {
          yield { 
            type: 'addToMST', 
            edgeId: edge.id,
            nodeId: neighborId,
            message: `Visiting neighbor ${neighborId}`
          };
        }
      } else if (edge) {
        yield { 
          type: 'skipEdge', 
          edgeId: edge.id, 
          message: `Neighbor ${neighborId} already visited`
        };
      }
    }
  }
  
  yield { 
    type: 'done', 
    message: `BFS completed. Visited ${visited.size} nodes.`
  };
}

// Depth-First Search (DFS)
export function* dfs(graph: GraphData, startNodeId: string): Generator<AlgorithmStep> {
  if (!startNodeId || !graph.nodes.find(n => n.id === startNodeId)) {
    yield { type: 'done', message: 'No start node selected' };
    return;
  }
  
  const adjList = createAdjacencyList(graph);
  const visited = new Set<string>();
  
  function* dfsVisit(nodeId: string): Generator<AlgorithmStep> {
    visited.add(nodeId);
    
    yield { 
      type: 'visitNode', 
      nodeId: nodeId, 
      message: `Visiting node ${nodeId}`
    };
    
    const neighbors = adjList.get(nodeId) || [];
    
    for (const { nodeId: neighborId } of neighbors) {
      const edge = findEdge(graph, nodeId, neighborId);
      
      if (edge) {
        yield { 
          type: 'visitEdge', 
          edgeId: edge.id, 
          message: `Examining edge to neighbor ${neighborId}`
        };
      }
      
      if (!visited.has(neighborId)) {
        if (edge) {
          yield { 
            type: 'addToMST', 
            edgeId: edge.id,
            nodeId: neighborId,
            message: `Moving to neighbor ${neighborId}`
          };
        }
        
        yield* dfsVisit(neighborId);
      } else if (edge) {
        yield { 
          type: 'skipEdge', 
          edgeId: edge.id, 
          message: `Neighbor ${neighborId} already visited`
        };
      }
    }
    
    yield { 
      type: 'processNode', 
      nodeId: nodeId, 
      message: `Finished processing node ${nodeId}`
    };
  }
  
  yield* dfsVisit(startNodeId);
  
  yield { 
    type: 'done', 
    message: `DFS completed. Visited ${visited.size} nodes.`
  };
}
