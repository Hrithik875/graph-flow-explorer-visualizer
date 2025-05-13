// Graph data types
export interface NodeData {
  id: string;
  x: number;
  y: number;
  label: string;
  status: 'default' | 'selected' | 'visited' | 'current' | 'start' | 'completed';
}

export interface EdgeData {
  id: string;
  from: string;
  to: string;
  weight: number;
  status: 'default' | 'selected' | 'mst' | 'visited' | 'current';
}

export interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
}

// Generate a unique ID for new elements
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Calculate the position of a new node, avoiding overlapping
export const calculateNewNodePosition = (nodes: NodeData[], boardWidth: number, boardHeight: number): { x: number; y: number } => {
  // If there are no nodes, place it in the center
  if (nodes.length === 0) {
    return { x: boardWidth / 2, y: boardHeight / 2 };
  }

  // Try to find a position that's not too close to existing nodes
  const minDistance = 100; // Minimum distance between nodes
  let x, y;
  let maxAttempts = 50;
  
  do {
    x = Math.random() * (boardWidth - 100) + 50;
    y = Math.random() * (boardHeight - 100) + 50;
    maxAttempts--;
  } while (
    maxAttempts > 0 &&
    nodes.some(node => 
      Math.sqrt(Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)) < minDistance
    )
  );

  return { x, y };
};

// Calculate the distance between two points
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// Calculate a point on the edge at a certain distance from the start
export const pointOnLine = (
  x1: number, y1: number, 
  x2: number, y2: number, 
  distFromStart: number
): { x: number; y: number } => {
  const totalDist = distance(x1, y1, x2, y2);
  const ratio = distFromStart / totalDist;
  
  return {
    x: x1 + (x2 - x1) * ratio,
    y: y1 + (y2 - y1) * ratio
  };
};

// Check if a node is near a position
export const isNodeNearPoint = (node: NodeData, x: number, y: number, threshold = 20): boolean => {
  return distance(node.x, node.y, x, y) <= threshold;
};

// Reset all nodes and edges to default status
export const resetGraphStatus = (graph: GraphData): GraphData => {
  return {
    nodes: graph.nodes.map(node => ({ ...node, status: 'default' })),
    edges: graph.edges.map(edge => ({ ...edge, status: 'default' }))
  };
};

// Create an adjacency list representation of the graph
export const createAdjacencyList = (graph: GraphData): Map<string, {nodeId: string, weight: number}[]> => {
  const adjList = new Map<string, {nodeId: string, weight: number}[]>();
  
  // Initialize all nodes with empty adjacency lists
  graph.nodes.forEach(node => {
    adjList.set(node.id, []);
  });
  
  // Add all edges to the adjacency list
  graph.edges.forEach(edge => {
    const fromList = adjList.get(edge.from) || [];
    const toList = adjList.get(edge.to) || [];
    
    fromList.push({ nodeId: edge.to, weight: edge.weight });
    toList.push({ nodeId: edge.from, weight: edge.weight }); // For undirected graph
    
    adjList.set(edge.from, fromList);
    adjList.set(edge.to, toList);
  });
  
  return adjList;
};

// Find an edge between two nodes
export const findEdge = (graph: GraphData, fromNodeId: string, toNodeId: string): EdgeData | undefined => {
  return graph.edges.find(edge => 
    (edge.from === fromNodeId && edge.to === toNodeId) || 
    (edge.from === toNodeId && edge.to === fromNodeId)
  );
};
