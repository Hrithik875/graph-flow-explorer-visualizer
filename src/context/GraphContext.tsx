
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GraphData, NodeData, EdgeData, generateId, calculateNewNodePosition } from '../utils/graphUtils';
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
}

// Graph Action Types
type GraphAction =
  | { type: 'ADD_NODE'; x: number; y: number }
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
  | { type: 'SET_TOTAL_MST_COST'; cost: number | null };

// Create the context
interface GraphContextType {
  state: GraphState;
  dispatch: React.Dispatch<GraphAction>;
}

const GraphContext = createContext<GraphContextType | undefined>(undefined);

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
};

// Reducer function
function graphReducer(state: GraphState, action: GraphAction): GraphState {
  switch (action.type) {
    case 'ADD_NODE': {
      const id = generateId();
      const newNode: NodeData = {
        id,
        x: action.x,
        y: action.y,
        label: (state.graph.nodes.length + 1).toString(),
        status: 'default',
      };
      return {
        ...state,
        graph: {
          ...state.graph,
          nodes: [...state.graph.nodes, newNode],
        },
        selectedNodeId: id,
        selectedEdgeId: null,
      };
    }
    
    case 'DELETE_NODE': {
      // Remove the node and any connected edges
      const newNodes = state.graph.nodes.filter(node => node.id !== action.nodeId);
      const newEdges = state.graph.edges.filter(
        edge => edge.from !== action.nodeId && edge.to !== action.nodeId
      );
      return {
        ...state,
        graph: {
          nodes: newNodes,
          edges: newEdges,
        },
        selectedNodeId: null,
        // If the start node is deleted, reset it
        startNodeId: state.startNodeId === action.nodeId ? null : state.startNodeId,
      };
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
      return {
        ...state,
        graph: {
          ...state.graph,
          nodes: newNodes,
        },
      };
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
      return {
        ...state,
        graph: {
          ...state.graph,
          edges: [...state.graph.edges, newEdge],
        },
        selectedEdgeId: id,
        selectedNodeId: null,
      };
    }
    
    case 'DELETE_EDGE': {
      const newEdges = state.graph.edges.filter(edge => edge.id !== action.edgeId);
      return {
        ...state,
        graph: {
          ...state.graph,
          edges: newEdges,
        },
        selectedEdgeId: null,
      };
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
      return {
        ...state,
        graph: {
          ...state.graph,
          edges: newEdges,
        },
      };
    }
    
    case 'SET_ALGORITHM': {
      return {
        ...state,
        algorithm: action.algorithm,
        totalMSTCost: null, // Reset cost when changing algorithm
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
        };
      }
      
      // Handle step based on type
      const step = action.step;
      
      if (step.nodeId) {
        // Update node status
        newGraph = {
          ...newGraph,
          nodes: newGraph.nodes.map(node => {
            if (node.id === step.nodeId) {
              let status: NodeData['status'] = 'default';
              if (step.type === 'visitNode') status = 'current';
              else if (step.type === 'processNode' || step.type === 'addToMST') status = 'visited';
              return { ...node, status };
            }
            return node;
          })
        };
      }
      
      if (step.edgeId) {
        // Update edge status
        newGraph = {
          ...newGraph,
          edges: newGraph.edges.map(edge => {
            if (edge.id === step.edgeId) {
              let status: EdgeData['status'] = 'default';
              if (step.type === 'visitEdge') status = 'selected';
              else if (step.type === 'addToMST') status = 'mst';
              return { ...edge, status };
            }
            return edge;
          })
        };
      }
      
      return {
        ...state,
        currentStep: action.step,
        graph: newGraph,
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
      };
    }
    
    case 'CLEAR_GRAPH': {
      return {
        ...initialState,
        speed: state.speed, // Preserve speed setting
      };
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
      };
    }

    case 'SET_TOTAL_MST_COST': {
      return {
        ...state,
        totalMSTCost: action.cost,
      };
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
