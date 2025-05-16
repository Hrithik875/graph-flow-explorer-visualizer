import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GraphData, NodeData, EdgeData, generateId } from '../utils/graphUtils';
import { AlgorithmStep } from '../utils/algorithms';

// Available algorithms
export type Algorithm = 'prim' | 'kruskal' | 'bfs' | 'dfs' | null;

// Graph Context State
interface GraphState {
  graph: GraphData;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  algorithm: Algorithm;
  isRunning: boolean;
  speed: number;
  currentStep: AlgorithmStep | null;
  startNodeId: string | null;
  totalMSTCost: number | null;
  pathTaken: string[]; // Array to store the path steps
  history: GraphData[]; // History for undo operations
  historyIndex: number; // Current position in history
  visitedNodes: Set<string>; // Track visited nodes for proper coloring
  completedNodes: Set<string>; // Track completed nodes for proper coloring
}

// Graph Action Types
type GraphAction =
  | { type: 'ADD_NODE'; x: number; y: number; label?: string }
  | { type: 'DELETE_NODE'; nodeId: string }
  | { type: 'SELECT_NODE'; nodeId: string | null }
  | { type: 'MOVE_NODE'; nodeId: string; x: number; y: number }
  | { type: 'ADD_EDGE'; fromNodeId: string; toNodeId: string; weight?: number }
  | { type: 'DELETE_EDGE'; edgeId: string }
  | { type: 'SELECT_EDGE'; edgeId: string | null }
  | { type: 'UPDATE_EDGE_WEIGHT'; edgeId: string; weight: number }
  | { type: 'SET_ALGORITHM'; algorithm: Algorithm }
  | { type: 'SET_RUNNING'; isRunning: boolean }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'SET_CURRENT_STEP'; step: AlgorithmStep | null }
  | { type: 'RESET_GRAPH_STATUS' }
  | { type: 'CLEAR_GRAPH' }
  | { type: 'SET_START_NODE'; nodeId: string | null }
  | { type: 'SET_TOTAL_MST_COST'; cost: number | null }
  | { type: 'ADD_PATH_STEP'; step: string }
  | { type: 'CLEAR_PATH' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_SAVED_GRAPH'; graph: GraphData }; // New action

// Create the context
interface GraphContextType {
  state: GraphState;
  dispatch: React.Dispatch<GraphAction>;
}

const GraphContext = createContext<GraphContextType | undefined>(undefined);

// Helper function to add to history
const addToHistory = (state: GraphState): GraphState => {
  // Clone the graph to avoid reference issues
  const graphCopy = {
    nodes: [...state.graph.nodes.map(node => ({...node}))],
    edges: [...state.graph.edges.map(edge => ({...edge}))]
  };
  
  // Create new history array up to current index (discard any forward history if we're in the middle)
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  
  return {
    ...state,
    history: [...newHistory, graphCopy], // Add current graph to history
    historyIndex: state.historyIndex + 1 // Move index forward
  };
};

// Find highest numeric label
const getNextNodeLabel = (nodes: NodeData[]): string => {
  const numericLabels = nodes
    .map(node => parseInt(node.label))
    .filter(label => !isNaN(label));
  
  if (numericLabels.length === 0) {
    return '1'; // Start with 1 if no numeric labels
  }
  
  return (Math.max(...numericLabels) + 1).toString();
};

// Initial state
const initialState: GraphState = {
  graph: { nodes: [], edges: [] },
  selectedNodeId: null,
  selectedEdgeId: null,
  algorithm: null,
  isRunning: false,
  speed: 500, // milliseconds between steps
  currentStep: null,
  startNodeId: null,
  totalMSTCost: null,
  pathTaken: [], // Initialize empty path
  history: [{ nodes: [], edges: [] }], // Initialize with empty graph
  historyIndex: 0,
  visitedNodes: new Set<string>(), // Track visited nodes
  completedNodes: new Set<string>(), // Track completed nodes
};

// Reducer function
function graphReducer(state: GraphState, action: GraphAction): GraphState {
  switch (action.type) {
    case 'ADD_NODE': {
      const id = generateId();
      // Use the provided label or get the next available number
      const nodeLabel = action.label || getNextNodeLabel(state.graph.nodes);
      
      const newNode: NodeData = {
        id,
        x: action.x,
        y: action.y,
        label: nodeLabel,
        status: 'default',
      };
      
      const newState = {
        ...state,
        graph: {
          ...state.graph,
          nodes: [...state.graph.nodes, newNode],
        },
        selectedNodeId: id,
        selectedEdgeId: null,
      };
      
      // Add to history
      return addToHistory(newState);
    }
    
    case 'DELETE_NODE': {
      // Remove the node and any connected edges
      const newNodes = state.graph.nodes.filter(node => node.id !== action.nodeId);
      const newEdges = state.graph.edges.filter(
        edge => edge.from !== action.nodeId && edge.to !== action.nodeId
      );
      
      const newState = {
        ...state,
        graph: {
          nodes: newNodes,
          edges: newEdges,
        },
        selectedNodeId: null,
        // If the start node is deleted, reset it
        startNodeId: state.startNodeId === action.nodeId ? null : state.startNodeId,
      };
      
      // Add to history
      return addToHistory(newState);
    }
    
    case 'SELECT_NODE': {
      return {
        ...state,
        selectedNodeId: action.nodeId,
        selectedEdgeId: null,
      };
    }
    
    case 'MOVE_NODE': {
      const newNodes = state.graph.nodes.map(node =>
        node.id === action.nodeId
          ? { ...node, x: action.x, y: action.y }
          : node
      );
      
      const newState = {
        ...state,
        graph: {
          ...state.graph,
          nodes: newNodes,
        },
      };
      
      // Add to history only when drag is complete (handled in Node component)
      return newState;
    }
    
    case 'ADD_EDGE': {
      // Check if edge already exists
      const existingEdge = state.graph.edges.find(
        edge =>
          (edge.from === action.fromNodeId && edge.to === action.toNodeId) ||
          (edge.from === action.toNodeId && edge.to === action.fromNodeId)
      );
      if (existingEdge) {
        return state;
      }
      
      const id = generateId();
      const newEdge: EdgeData = {
        id,
        from: action.fromNodeId,
        to: action.toNodeId,
        weight: action.weight || 1,
        status: 'default',
      };
      
      const newState = {
        ...state,
        graph: {
          ...state.graph,
          edges: [...state.graph.edges, newEdge],
        },
        selectedEdgeId: id,
        selectedNodeId: null,
      };
      
      // Add to history
      return addToHistory(newState);
    }
    
    case 'DELETE_EDGE': {
      const newEdges = state.graph.edges.filter(edge => edge.id !== action.edgeId);
      
      const newState = {
        ...state,
        graph: {
          ...state.graph,
          edges: newEdges,
        },
        selectedEdgeId: null,
      };
      
      // Add to history
      return addToHistory(newState);
    }
    
    case 'SELECT_EDGE': {
      return {
        ...state,
        selectedEdgeId: action.edgeId,
        selectedNodeId: null,
      };
    }
    
    case 'UPDATE_EDGE_WEIGHT': {
      const newEdges = state.graph.edges.map(edge =>
        edge.id === action.edgeId
          ? { ...edge, weight: action.weight }
          : edge
      );
      
      const newState = {
        ...state,
        graph: {
          ...state.graph,
          edges: newEdges,
        },
      };
      
      // Add to history
      return addToHistory(newState);
    }
    
    case 'SET_ALGORITHM': {
      return {
        ...state,
        algorithm: action.algorithm,
        totalMSTCost: null, // Reset cost when changing algorithm
        pathTaken: [], // Reset path when changing algorithm
        visitedNodes: new Set<string>(), // Reset visited nodes
        completedNodes: new Set<string>(), // Reset completed nodes
      };
    }
    
    case 'SET_RUNNING': {
      return {
        ...state,
        isRunning: action.isRunning,
      };
    }
    
    case 'SET_SPEED': {
      return {
        ...state,
        speed: action.speed,
      };
    }
    
    case 'SET_CURRENT_STEP': {
      let newGraph = { ...state.graph };
      let visitedNodes = new Set(state.visitedNodes);
      let completedNodes = new Set(state.completedNodes);
      
      // Reset all statuses if step is null
      if (!action.step) {
        newGraph = {
          nodes: newGraph.nodes.map(node => ({ ...node, status: 'default' })),
          edges: newGraph.edges.map(edge => ({ ...edge, status: 'default' })),
        };
        return {
          ...state,
          currentStep: null,
          graph: newGraph,
          visitedNodes: new Set<string>(),
          completedNodes: new Set<string>(),
        };
      }
      
      // Handle step based on type
      const step = action.step;
      
      // Track visited and completed nodes
      if (step.nodeId) {
        // Add to visited nodes
        if (step.type === 'visitNode' || step.type === 'processNode') {
          visitedNodes.add(step.nodeId);
        }
        
        // Mark nodes as completed
        if (step.type === 'completeNode' || step.type === 'addToMST') {
          completedNodes.add(step.nodeId);
        }
      }
      
      // Update node status with correct coloring logic - completely rewritten
      newGraph = {
        ...newGraph,
        nodes: newGraph.nodes.map(node => {
          // Start node gets highest priority - purple color
          if (node.id === state.startNodeId) {
            return { ...node, status: 'start' };
          } 
          // Completed nodes get second priority - green color 
          else if (completedNodes.has(node.id)) {
            return { ...node, status: 'completed' };
          }
          // Current processing node gets third priority - bright yellow
          else if (
            (step.type === 'processNode' || step.type === 'addToMST') && 
            step.nodeId === node.id
          ) {
            return { ...node, status: 'current' };
          }
          // Regular visited nodes get fourth priority - yellow
          else if (visitedNodes.has(node.id)) {
            return { ...node, status: 'visited' };
          }
          // Default nodes - gray
          else {
            return { ...node, status: 'default' };
          }
        })
      };
      
      // Handle edge updates
      if (step.edgeId) {
        newGraph = {
          ...newGraph,
          edges: newGraph.edges.map(edge => {
            if (edge.id === step.edgeId) {
              if (step.type === 'visitEdge' || step.type === 'currentEdge') {
                return { ...edge, status: 'current' };  // Red for current edge
              }
              else if (step.type === 'addToMST' || step.type === 'traverseEdge' || step.type === 'mst') {
                return { ...edge, status: 'visited' };  // Green for MST/traversed edge
              }
              return { ...edge, status: 'default' };
            }
            return edge;
          })
        };
      }
      
      return {
        ...state,
        currentStep: action.step,
        graph: newGraph,
        visitedNodes,
        completedNodes,
      };
    }
    
    case 'RESET_GRAPH_STATUS': {
      return {
        ...state,
        graph: {
          nodes: state.graph.nodes.map(node => ({ ...node, status: 'default' })),
          edges: state.graph.edges.map(edge => ({ ...edge, status: 'default' })),
        },
        currentStep: null,
        totalMSTCost: null, // Reset cost when resetting graph
        pathTaken: [], // Reset path when resetting graph
        visitedNodes: new Set<string>(), // Reset visited nodes
        completedNodes: new Set<string>(), // Reset completed nodes
      };
    }
    
    case 'CLEAR_GRAPH': {
      // Create a completely new empty state, but preserve speed
      const newState = {
        ...initialState,
        speed: state.speed, // Preserve speed setting
      };
      
      // Add empty graph to history
      return addToHistory(newState);
    }
    
    case 'SET_START_NODE': {
      // Update start node and reset graph status
      return {
        ...state,
        startNodeId: action.nodeId,
        graph: {
          nodes: state.graph.nodes.map(node => ({
            ...node,
            status: node.id === action.nodeId ? 'start' : 'default',
          })),
          edges: state.graph.edges.map(edge => ({ ...edge, status: 'default' })),
        },
        visitedNodes: new Set<string>(), // Reset visited nodes
        completedNodes: new Set<string>(), // Reset completed nodes
      };
    }
    
    case 'ADD_PATH_STEP': {
      return {
        ...state,
        pathTaken: [...state.pathTaken, action.step],
      };
    }
    
    case 'CLEAR_PATH': {
      return {
        ...state,
        pathTaken: [],
      };
    }
    
    case 'SET_TOTAL_MST_COST': {
      return {
        ...state,
        totalMSTCost: action.cost,
      };
    }
    
    case 'UNDO': {
      // Check if we can undo (if we're not at the beginning of history)
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        const previousGraph = state.history[newIndex];
        
        return {
          ...state,
          graph: previousGraph,
          historyIndex: newIndex,
          // Reset selections when undoing
          selectedNodeId: null,
          selectedEdgeId: null,
        };
      }
      
      // If we can't undo, return the current state
      return state;
    }
    
    case 'REDO': {
      // Check if we can redo (if we're not at the end of history)
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        const nextGraph = state.history[newIndex];
        
        return {
          ...state,
          graph: nextGraph,
          historyIndex: newIndex,
          // Reset selections when redoing
          selectedNodeId: null,
          selectedEdgeId: null,
        };
      }
      
      // If we can't redo, return the current state
      return state;
    }
    
    case 'LOAD_SAVED_GRAPH': {
      // Create a new state with loaded graph
      const newState = {
        ...state,
        graph: action.graph,
        selectedNodeId: null,
        selectedEdgeId: null,
        algorithm: null,
        isRunning: false,
        currentStep: null,
        totalMSTCost: null,
        pathTaken: [],
        visitedNodes: new Set<string>(),
        completedNodes: new Set<string>(),
      };
      
      // Add this to history too
      return addToHistory(newState);
    }
    
    default:
      return state;
  }
}

// Provider component
interface GraphProviderProps {
  children: React.ReactNode;
}

export function GraphProvider({ children }: GraphProviderProps) {
  const [state, dispatch] = useReducer(graphReducer, initialState);
  
  // Set up any effects we need
  
  // Provide the context
  return (
    <GraphContext.Provider value={{ state, dispatch }}>
      {children}
    </GraphContext.Provider>
  );
}

// Custom hook for using the graph context
export function useGraphContext() {
  const context = useContext(GraphContext);
  if (context === undefined) {
    throw new Error('useGraphContext must be used within a GraphProvider');
  }
  return context;
}
