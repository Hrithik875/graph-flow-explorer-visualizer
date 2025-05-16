
import React, { useState, useRef, useEffect } from 'react';
import { useGraphContext } from '../context/GraphContext';
import Node from './Node';
import Edge from './Edge';
import { isNodeNearPoint } from '../utils/graphUtils';
import { Button } from './ui/button';
import { Undo, Redo, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from './ui/scroll-area';

const GraphBoard: React.FC = () => {
  const { state, dispatch } = useGraphContext();
  const { toast } = useToast();
  const boardRef = useRef<HTMLDivElement>(null);
  const [tempLine, setTempLine] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number, y: number } | null>(null);
  const [boardSize, setBoardSize] = useState({ width: 1000, height: 600 });
  const isMobile = useIsMobile();
  
  // Update board size based on content
  useEffect(() => {
    if (state.graph.nodes.length === 0) return;
    
    // Find the farthest node positions
    const maxX = Math.max(...state.graph.nodes.map(node => node.x)) + 200;
    const maxY = Math.max(...state.graph.nodes.map(node => node.y)) + 200;
    
    // Update board size if nodes extend beyond current boundaries
    setBoardSize(prev => ({
      width: Math.max(prev.width, maxX, window.innerWidth - 40),
      height: Math.max(prev.height, maxY, window.innerHeight - 200)
    }));
  }, [state.graph.nodes]);
  
  // Handle adding a node on board click
  const handleBoardClick = (e: React.MouseEvent) => {
    // Don't add nodes if we're running an algorithm
    if (state.isRunning) return;
    
    const boardRect = boardRef.current?.getBoundingClientRect();
    if (boardRect) {
      const x = e.clientX - boardRect.left;
      const y = e.clientY - boardRect.top;
      
      // Check if we clicked near an existing node
      const clickedOnNode = state.graph.nodes.some(node => isNodeNearPoint(node, x, y));
      
      // Only add a new node if we didn't click on an existing one
      if (!clickedOnNode && !sourceNodeId) {
        // Find the highest current node label and increment
        const highestLabel = Math.max(
          0,
          ...state.graph.nodes.map(node => {
            const num = parseInt(node.label);
            return isNaN(num) ? 0 : num;
          })
        );
        
        dispatch({ 
          type: 'ADD_NODE', 
          x, 
          y,
          label: (highestLabel + 1).toString() 
        });
      }
    }
  };
  
  // Handle touch start for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (state.isRunning) return;
    
    const touch = e.touches[0];
    const boardRect = boardRef.current?.getBoundingClientRect();
    
    if (boardRect && touch) {
      const x = touch.clientX - boardRect.left;
      const y = touch.clientY - boardRect.top;
      
      setTouchStartPos({ x, y });
      
      // If a node is selected, we may be starting an edge draw
      if (state.selectedNodeId) {
        const sourceNode = state.graph.nodes.find(node => node.id === state.selectedNodeId);
        
        if (sourceNode) {
          setSourceNodeId(state.selectedNodeId);
          setTempLine({
            x1: sourceNode.x,
            y1: sourceNode.y,
            x2: sourceNode.x,
            y2: sourceNode.y,
          });
        }
      }
    }
  };
  
  // Handle touch move for mobile
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos) return;
    
    const touch = e.touches[0];
    const boardRect = boardRef.current?.getBoundingClientRect();
    
    if (boardRect && touch) {
      const x = touch.clientX - boardRect.left;
      const y = touch.clientY - boardRect.top;
      
      // If we're drawing an edge, update the temp line
      if (sourceNodeId && tempLine) {
        setTempLine({ ...tempLine, x2: x, y2: y });
      }
    }
  };
  
  // Handle touch end for mobile
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos) return;
    
    // Get touch position from the last known position
    const boardRect = boardRef.current?.getBoundingClientRect();
    
    if (boardRect) {
      // If we're ending a potential edge creation
      if (sourceNodeId && tempLine) {
        // See if we're over a node
        const x = tempLine.x2;
        const y = tempLine.y2;
        
        // Find potential target node
        const targetNode = state.graph.nodes.find(node => isNodeNearPoint(node, x, y));
        
        if (targetNode && targetNode.id !== sourceNodeId) {
          // Add edge between nodes
          dispatch({
            type: 'ADD_EDGE',
            fromNodeId: sourceNodeId,
            toNodeId: targetNode.id,
            weight: 1, // Default weight
          });
        }
        
        // Reset temporary edge
        setSourceNodeId(null);
        setTempLine(null);
      } 
      // If we have a very small drag distance, consider it a tap (for adding nodes)
      else if (
        Math.abs(touchStartPos.x - (e.changedTouches[0]?.clientX || 0) - boardRect.left) < 10 &&
        Math.abs(touchStartPos.y - (e.changedTouches[0]?.clientY || 0) - boardRect.top) < 10
      ) {
        const x = touchStartPos.x;
        const y = touchStartPos.y;
        
        // Check if we tapped on an existing node
        const clickedOnNode = state.graph.nodes.some(node => isNodeNearPoint(node, x, y));
        
        // Only add a new node if we didn't tap on an existing one
        if (!clickedOnNode) {
          // Find the highest current node label and increment
          const highestLabel = Math.max(
            0,
            ...state.graph.nodes.map(node => {
              const num = parseInt(node.label);
              return isNaN(num) ? 0 : num;
            })
          );
          
          dispatch({ 
            type: 'ADD_NODE', 
            x, 
            y,
            label: (highestLabel + 1).toString() 
          });
        }
      }
    }
    
    // Reset touch state
    setTouchStartPos(null);
  };
  
  // Handle mouse down for drawing edges
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't draw edges if we're running an algorithm
    if (state.isRunning || !state.selectedNodeId) return;
    
    // Start drawing from the selected node
    setSourceNodeId(state.selectedNodeId);
    
    // Find the selected node
    const sourceNode = state.graph.nodes.find(node => node.id === state.selectedNodeId);
    
    if (sourceNode) {
      setTempLine({
        x1: sourceNode.x,
        y1: sourceNode.y,
        x2: sourceNode.x,
        y2: sourceNode.y,
      });
    }
  };
  
  // Handle mouse move for drawing edges
  const handleMouseMove = (e: React.MouseEvent) => {
    if (sourceNodeId && tempLine) {
      const boardRect = boardRef.current?.getBoundingClientRect();
      if (boardRect) {
        const x = e.clientX - boardRect.left;
        const y = e.clientY - boardRect.top;
        setTempLine({ ...tempLine, x2: x, y2: y });
      }
    }
  };
  
  // Handle mouse up for finishing edges
  const handleMouseUp = (e: React.MouseEvent) => {
    if (sourceNodeId) {
      const boardRect = boardRef.current?.getBoundingClientRect();
      if (boardRect) {
        const x = e.clientX - boardRect.left;
        const y = e.clientY - boardRect.top;
        
        // Check if mouse is released on another node
        const targetNode = state.graph.nodes.find(node => isNodeNearPoint(node, x, y));
        
        if (targetNode && targetNode.id !== sourceNodeId) {
          // Add edge between nodes
          dispatch({
            type: 'ADD_EDGE',
            fromNodeId: sourceNodeId,
            toNodeId: targetNode.id,
            weight: 1, // Default weight
          });
        }
      }
      
      // Reset temporary edge
      setSourceNodeId(null);
      setTempLine(null);
    }
  };
  
  // Handle undo operation
  const handleUndo = () => {
    if (state.historyIndex > 0) {
      dispatch({ type: 'UNDO' });
      toast({
        title: "Undo",
        description: "Previous action undone",
      });
    }
  };
  
  // Handle redo operation
  const handleRedo = () => {
    if (state.historyIndex < state.history.length - 1) {
      dispatch({ type: 'REDO' });
      toast({
        title: "Redo",
        description: "Action redone",
      });
    }
  };
  
  // Delete selected node
  const handleDeleteNode = () => {
    if (state.selectedNodeId) {
      dispatch({ type: 'DELETE_NODE', nodeId: state.selectedNodeId });
      toast({
        title: "Node Deleted",
        description: `Node ${state.graph.nodes.find(n => n.id === state.selectedNodeId)?.label || ''} removed`,
      });
    } else if (state.selectedEdgeId) {
      dispatch({ type: 'DELETE_EDGE', edgeId: state.selectedEdgeId });
      toast({
        title: "Edge Deleted",
        description: "Edge removed from graph",
      });
    }
  };
  
  // Handle key press for shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard shortcuts during algorithm execution
      if (state.isRunning) return;
      
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          // Delete selected node or edge
          if (state.selectedNodeId) {
            dispatch({ type: 'DELETE_NODE', nodeId: state.selectedNodeId });
            toast({
              title: "Node Deleted",
              description: `Node removed`,
            });
          } else if (state.selectedEdgeId) {
            dispatch({ type: 'DELETE_EDGE', edgeId: state.selectedEdgeId });
            toast({
              title: "Edge Deleted",
              description: "Edge removed from graph",
            });
          }
          break;
          
        case 'Escape':
          // Deselect everything
          dispatch({ type: 'SELECT_NODE', nodeId: null });
          dispatch({ type: 'SELECT_EDGE', edgeId: null });
          break;
          
        case 'z':
          // Undo if Ctrl/Cmd + Z is pressed
          if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
            e.preventDefault();
            handleUndo();
          }
          // Redo if Ctrl/Cmd + Shift + Z is pressed
          if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            handleRedo();
          }
          break;
          
        case 'y':
          // Redo if Ctrl/Cmd + Y is pressed
          if ((e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleRedo();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedNodeId, state.selectedEdgeId, state.isRunning, state.history, state.historyIndex, dispatch]);
  
  // Render mobile help text if no nodes exist
  const renderHelpText = () => {
    if (state.graph.nodes.length === 0) {
      if (isMobile) {
        return (
          <div className="absolute inset-0 flex items-center justify-center text-white text-opacity-70">
            <div className="text-center p-4">
              <p className="text-lg font-medium mb-2">Tap anywhere to add a node</p>
              <p className="text-sm mb-2">Select a node, then drag from it to another node to create an edge</p>
              <p className="text-sm">Double-tap a node to set it as the start node</p>
            </div>
          </div>
        );
      } else {
        return (
          <div className="absolute inset-0 flex items-center justify-center text-white text-opacity-70">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Click anywhere to add a node</p>
              <p className="text-sm">Drag from one node to another to create an edge</p>
            </div>
          </div>
        );
      }
    }
    return null;
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Controls bar */}
      <div className="flex justify-end gap-2 mb-2 p-2 bg-gray-800 rounded-lg">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleDeleteNode}
          disabled={!state.selectedNodeId && !state.selectedEdgeId}
          title="Delete selected node or edge (Del)"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleUndo}
          disabled={state.historyIndex <= 0 || state.isRunning}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRedo}
          disabled={state.historyIndex >= state.history.length - 1 || state.isRunning}
          title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Graph board with scrolling */}
      <ScrollArea className="flex-1 w-full bg-gray-900 rounded-lg overflow-hidden">
        <div 
          ref={boardRef}
          className="relative"
          style={{ width: `${boardSize.width}px`, height: `${boardSize.height}px`, minHeight: '100%' }}
          onClick={handleBoardClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* SVG layer for edges */}
          <svg className="absolute inset-0 w-full h-full">
            {/* Render all edges */}
            {state.graph.edges.map(edge => {
              const sourceNode = state.graph.nodes.find(node => node.id === edge.from);
              const targetNode = state.graph.nodes.find(node => node.id === edge.to);
              
              if (sourceNode && targetNode) {
                return (
                  <Edge
                    key={edge.id}
                    edge={edge}
                    sourceX={sourceNode.x}
                    sourceY={sourceNode.y}
                    targetX={targetNode.x}
                    targetY={targetNode.y}
                  />
                );
              }
              return null;
            })}
            
            {/* Draw temporary edge while creating */}
            {tempLine && (
              <line
                x1={tempLine.x1}
                y1={tempLine.y1}
                x2={tempLine.x2}
                y2={tempLine.y2}
                stroke="#90A4AE"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}
          </svg>
          
          {/* Layer for nodes */}
          {state.graph.nodes.map(node => (
            <Node key={node.id} node={node} />
          ))}
          
          {/* Instructions when board is empty */}
          {renderHelpText()}
        </div>
      </ScrollArea>
    </div>
  );
};

export default GraphBoard;
