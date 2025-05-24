import React, { useState, useRef, useEffect } from 'react';
import { useGraphContext } from '../context/GraphContext';
import { NodeData } from '../utils/graphUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface NodeProps {
  node: NodeData;
}

const Node: React.FC<NodeProps> = ({ node }) => {
  const { state, dispatch } = useGraphContext();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Get color based on node status - completely rewritten color mapping
  const getNodeColor = () => {
    switch (node.status) {
      case 'selected': return 'bg-blue-500';
      case 'visited': return 'bg-yellow-400'; // Yellow for visited nodes
      case 'current': return 'bg-yellow-500'; // Brighter yellow for current node
      case 'completed': return 'bg-green-500'; // Green for completed nodes
      case 'start': return 'bg-purple-500'; // Purple for start node (#9b87f5)
      default: return 'bg-gray-500'; // Gray for default
    }
  };
  
  // Check if the algorithm has completed
  const isAlgorithmComplete = () => {
    return state.currentStep?.type === 'done' && state.isRunning;
  };
  
  // Get animation class with special consideration for completed algorithms
  const getAnimationClass = () => {
    // When algorithm is complete, don't animate visited nodes anymore
    if (isAlgorithmComplete() && node.status === 'visited') {
      return '';
    }
    
    // Regular animation rules
    if (node.status === 'visited' || node.status === 'current') {
      return 'animate-pulse';
    }
    return '';
  };
  
  // Get ring color for selection that works in both themes
  const getSelectionRing = () => {
    if (isSelected) {
      return 'ring-4 ring-blue-400 dark:ring-white';
    }
    return '';
  };
  
  // Handle node click/tap
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If we're not running, select the node
    if (!state.isRunning) {
      dispatch({ type: 'SELECT_NODE', nodeId: node.id });
    }
  };
  
  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Only allow dragging if we're not running an algorithm
    if (state.isRunning) return;
    
    setIsDragging(true);
    const boundingRect = nodeRef.current?.getBoundingClientRect();
    if (boundingRect) {
      setDragOffset({
        x: e.clientX - node.x,
        y: e.clientY - node.y,
      });
    }
  };
  
  // Handle touch start for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    
    // Only allow interaction if we're not running an algorithm
    if (state.isRunning) return;
    
    // Select the node
    dispatch({ type: 'SELECT_NODE', nodeId: node.id });
    
    // Record touch start time for potential double tap
    setTouchStartTime(Date.now());
    
    // Set up for potential drag
    const touch = e.touches[0];
    const boundingRect = nodeRef.current?.getBoundingClientRect();
    
    if (boundingRect) {
      setIsDragging(true);
      setDragOffset({
        x: touch.clientX - node.x,
        y: touch.clientY - node.y,
      });
    }
  };
  
  // Handle touch move for dragging on mobile
  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    
    if (!isDragging || state.isRunning) return;
    
    const touch = e.touches[0];
    const x = touch.clientX - dragOffset.x;
    const y = touch.clientY - dragOffset.y;
    
    dispatch({ type: 'MOVE_NODE', nodeId: node.id, x, y });
  };
  
  // Handle touch end for mobile
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    
    // Check for double tap (within 300ms)
    if (touchStartTime && Date.now() - touchStartTime < 300) {
      const lastTap = nodeRef.current?.dataset.lastTap ? parseInt(nodeRef.current.dataset.lastTap) : 0;
      const currentTime = Date.now();
      
      // If double tap detected (two taps within 300ms)
      if (currentTime - lastTap < 300) {
        handleDoubleClick(e);
        // Reset to prevent triple tap detection
        if (nodeRef.current) {
          nodeRef.current.dataset.lastTap = '0';
        }
      } else {
        // Store current tap time
        if (nodeRef.current) {
          nodeRef.current.dataset.lastTap = currentTime.toString();
        }
      }
    }
    
    // End dragging
    if (isDragging) {
      setIsDragging(false);
      
      // Create a new history snapshot after drag is complete
      if (node.id === state.selectedNodeId) {
        dispatch({ 
          type: 'SELECT_NODE', 
          nodeId: node.id 
        });
      }
    }
    
    setTouchStartTime(null);
  };
  
  // Handle double-click to set as start node
  const handleDoubleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    // Only allow setting start node if we're not running
    if (!state.isRunning) {
      dispatch({ type: 'SET_START_NODE', nodeId: node.id });
    }
  };
  
  // Set up global mouse move and up events for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        dispatch({ type: 'MOVE_NODE', nodeId: node.id, x, y });
      }
    };
    
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        
        // Add to history after drag is complete (only if actually dragged)
        if (node.id === state.selectedNodeId) {
          // Dispatch a noop action to trigger a history update
          dispatch({ 
            type: 'SELECT_NODE', 
            nodeId: node.id 
          });
        }
      }
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dispatch, dragOffset, node.id, state.selectedNodeId, state.graph]);
  
  // Determine if this node is selected
  const isSelected = state.selectedNodeId === node.id;
  
  // Determine if this node is the start node
  const isStart = state.startNodeId === node.id;
  
  // Adjust node size for mobile
  const nodeSize = isMobile ? 16 : 24;
  const nodeDiameter = nodeSize * 2;
  
  return (
    <div
      ref={nodeRef}
      className={`absolute rounded-full flex items-center justify-center cursor-grab 
                 ${getSelectionRing()}
                 ${getNodeColor()} ${getAnimationClass()}`}
      style={{
        left: node.x - nodeSize,
        top: node.y - nodeSize,
        width: nodeDiameter,
        height: nodeDiameter,
        zIndex: isDragging || isSelected ? 10 : 5,
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <span
        className={`text-white font-bold ${isStart ? 'animate-pulse' : ''}`}
        style={{
          fontSize: isMobile ? '0.75rem' : '1rem',
          userSelect: 'none' // <-- Add this line
        }}
      >
        {node.label}
      </span>
    </div>
  );
};

export default Node;
