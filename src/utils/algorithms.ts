
import { GraphData, NodeData, EdgeData, createAdjacencyList, findEdge } from './graphUtils';

// Helper type for algorithm step
export interface AlgorithmStep {
  type: 'visitNode' | 'processNode' | 'visitEdge' | 'addToMST' | 'skipEdge' | 'done' | 
         'completeNode' | 'traverseEdge' | 'currentEdge' | 'mst';
  nodeId?: string;
  edgeId?: string;
  message: string;
  totalCost?: number; // Adding total cost for MST algorithms
  pathStep?: string; // Add path step information
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
  
  const startNodeLabel = nodes.find(n => n.id === startNodeId)?.label || startNodeId;
  
  // Mark start node as visited
  yield { 
    type: 'visitNode', 
    nodeId: startNodeId, 
    message: `Starting Prim's algorithm from node ${startNodeLabel}`,
    pathStep: `Starting from node ${startNodeLabel}`
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
    
    const fromNodeLabel = nodes.find(n => n.id === minEdge.from)?.label || minEdge.from;
    const toNodeLabel = nodes.find(n => n.id === minEdge.to)?.label || minEdge.to;
    
    // Highlight the new MST edge and node
    yield { 
      type: 'addToMST', 
      edgeId: minEdge.id,
      nodeId: nextNode,
      message: `Adding edge ${minEdge.id} to MST and visiting node ${toNodeLabel}. Current cost: ${totalCost}`,
      pathStep: `Added edge ${fromNodeLabel} → ${toNodeLabel} (weight: ${minEdge.weight})`
    };
  }
  
  yield { 
    type: 'done', 
    message: `Prim's algorithm completed. MST has ${mstEdges.length} edges.`,
    totalCost,
    pathStep: `Algorithm complete! Total MST cost: ${totalCost}`
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
  
  yield { 
    type: 'done', 
    message: `Starting Kruskal's algorithm with ${sortedEdges.length} edges`,
    pathStep: `Starting Kruskal's algorithm with ${sortedEdges.length} edges`
  };
  
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
      
      const fromNodeLabel = graph.nodes.find(n => n.id === edge.from)?.label || edge.from;
      const toNodeLabel = graph.nodes.find(n => n.id === edge.to)?.label || edge.to;
      
      yield { 
        type: 'addToMST', 
        edgeId: edge.id,
        nodeId: edge.to,
        message: `Adding edge ${edge.id} to MST. Current cost: ${totalCost}`,
        pathStep: `Added edge ${fromNodeLabel} → ${toNodeLabel} (weight: ${edge.weight})`
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
      totalCost,
      pathStep: `Algorithm incomplete. Graph is disconnected. Current cost: ${totalCost}`
    };
  } else {
    yield { 
      type: 'done', 
      message: `Kruskal's algorithm completed. MST has ${mstEdges.length} edges.`,
      totalCost,
      pathStep: `Algorithm complete! Total MST cost: ${totalCost}`
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
  
  const startNodeLabel = graph.nodes.find(n => n.id === startNodeId)?.label || startNodeId;
  
  yield { 
    type: 'visitNode', 
    nodeId: startNodeId, 
    message: `Starting BFS from node ${startNodeLabel}`,
    pathStep: `Starting from node ${startNodeLabel}`
  };
  
  // Track parents for path reconstruction
  const parent: Map<string, { nodeId: string, edgeId: string }> = new Map();
  
  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;
    const currentNodeLabel = graph.nodes.find(n => n.id === currentNodeId)?.label || currentNodeId;
    
    yield { 
      type: 'processNode', 
      nodeId: currentNodeId, 
      message: `Processing node ${currentNodeLabel}`,
      pathStep: `Visiting node ${currentNodeLabel}`
    };
    
    let allNeighborsVisited = true;
    const neighbors = adjList.get(currentNodeId) || [];
    
    for (const { nodeId: neighborId } of neighbors) {
      const edge = findEdge(graph, currentNodeId, neighborId);
      const neighborLabel = graph.nodes.find(n => n.id === neighborId)?.label || neighborId;
      
      if (edge) {
        yield { 
          type: 'visitEdge', 
          edgeId: edge.id, 
          message: `Examining edge to neighbor ${neighborLabel}`,
          pathStep: `Examining edge from ${currentNodeLabel} to ${neighborLabel}`
        };
      }
      
      if (!visited.has(neighborId)) {
        allNeighborsVisited = false;
        visited.add(neighborId);
        queue.push(neighborId);
        
        // Record parent for path reconstruction
        if (edge) {
          parent.set(neighborId, { nodeId: currentNodeId, edgeId: edge.id });
          
          yield { 
            type: 'traverseEdge', 
            edgeId: edge.id,
            nodeId: neighborId,
            message: `Visiting neighbor ${neighborLabel}`,
            pathStep: `Found unvisited node ${neighborLabel}`
          };
        }
      } else if (edge) {
        yield { 
          type: 'skipEdge', 
          edgeId: edge.id, 
          message: `Neighbor ${neighborLabel} already visited`,
          pathStep: `Skipping node ${neighborLabel} (already visited)`
        };
      }
    }
    
    // If all neighbors are visited, mark this node as complete
    if (allNeighborsVisited) {
      yield { 
        type: 'completeNode', 
        nodeId: currentNodeId, 
        message: `Node ${currentNodeLabel} fully explored`,
        pathStep: `Completed exploration of node ${currentNodeLabel}`
      };
    }
  }
  
  // Display the full BFS traversal path
  let pathOutput = "BFS Traversal Path:\n";
  const visitedOrder = Array.from(visited);
  
  for (let i = 0; i < visitedOrder.length; i++) {
    const nodeId = visitedOrder[i];
    const nodeLabel = graph.nodes.find(n => n.id === nodeId)?.label || nodeId;
    
    if (i === 0) {
      pathOutput += `${nodeLabel}`;
    } else {
      const parentInfo = parent.get(nodeId);
      if (parentInfo) {
        const parentLabel = graph.nodes.find(n => n.id === parentInfo.nodeId)?.label || parentInfo.nodeId;
        pathOutput += ` → ${nodeLabel}`;
      }
    }
  }
  
  yield { 
    type: 'done', 
    message: `BFS completed. Visited ${visited.size} nodes.`,
    pathStep: pathOutput
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
  const path: string[] = [];
  const edgePath: string[] = [];
  
  const startNodeLabel = graph.nodes.find(n => n.id === startNodeId)?.label || startNodeId;
  
  yield { 
    type: 'visitNode', 
    nodeId: startNodeId, 
    message: `Starting DFS from node ${startNodeLabel}`,
    pathStep: `Starting from node ${startNodeLabel}`
  };
  
  function* dfsVisit(nodeId: string): Generator<AlgorithmStep> {
    visited.add(nodeId);
    path.push(nodeId);
    
    const nodeLabel = graph.nodes.find(n => n.id === nodeId)?.label || nodeId;
    
    yield { 
      type: 'visitNode', 
      nodeId: nodeId, 
      message: `Visiting node ${nodeLabel}`,
      pathStep: `Visiting node ${nodeLabel}`
    };
    
    const neighbors = adjList.get(nodeId) || [];
    let allNeighborsExplored = true;
    
    for (const { nodeId: neighborId } of neighbors) {
      const edge = findEdge(graph, nodeId, neighborId);
      const neighborLabel = graph.nodes.find(n => n.id === neighborId)?.label || neighborId;
      
      if (edge) {
        yield { 
          type: 'currentEdge', 
          edgeId: edge.id, 
          message: `Examining edge to neighbor ${neighborLabel}`,
          pathStep: `Examining edge from ${nodeLabel} to ${neighborLabel}`
        };
      }
      
      if (!visited.has(neighborId)) {
        allNeighborsExplored = false;
        
        if (edge) {
          edgePath.push(edge.id);
          
          yield { 
            type: 'traverseEdge', 
            edgeId: edge.id,
            nodeId: neighborId,
            message: `Moving to neighbor ${neighborLabel}`,
            pathStep: `Moving to unvisited node ${neighborLabel}`
          };
        }
        
        yield* dfsVisit(neighborId);
      } else if (edge) {
        yield { 
          type: 'skipEdge', 
          edgeId: edge.id, 
          message: `Neighbor ${neighborLabel} already visited`,
          pathStep: `Skipping node ${neighborLabel} (already visited)`
        };
      }
    }
    
    yield { 
      type: 'completeNode', 
      nodeId: nodeId, 
      message: `Finished processing node ${nodeLabel}`,
      pathStep: `Completed exploration of node ${nodeLabel}`
    };
  }
  
  yield* dfsVisit(startNodeId);
  
  // Display the full DFS traversal path
  let pathOutput = "DFS Traversal Path:\n";
  
  for (let i = 0; i < path.length; i++) {
    const nodeId = path[i];
    const nodeLabel = graph.nodes.find(n => n.id === nodeId)?.label || nodeId;
    
    if (i === 0) {
      pathOutput += `${nodeLabel}`;
    } else {
      pathOutput += ` → ${nodeLabel}`;
    }
  }
  
  yield { 
    type: 'done', 
    message: `DFS completed. Visited ${visited.size} nodes.`,
    pathStep: pathOutput
  };
}
