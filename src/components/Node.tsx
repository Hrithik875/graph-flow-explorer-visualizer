
import React, { useState, useRef, useEffect } from 'react';
import { useGraphContext } from '../context/GraphContext';
import { NodeData } from '../utils/graphUtils';

interface NodeProps {
  node: NodeData;
}

const Node: React.FC<NodeProps> = ({ node }) => {
  const { state, dispatch } = useGraphContext();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // Get color based on node status
  const getNodeColor = () => {
    switch (node.status) {
      case 'selected': return 'bg-node-selected';
      case 'visited': return 'bg-node-visited';
      case 'current': return 'bg-node-current';
      case 'start': return 'bg-node-start';
      default: return 'bg-node-default';
    }
  };
  
  // Handle node click
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
  
  // Handle double-click to set as start node
  const handleDoubleClick = (e: React.MouseEvent) => {
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
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dispatch, dragOffset, node.id]);
  
  // Apply animation class for visited or current nodes
  const getAnimationClass = () => {
    if (node.status === 'visited' || node.status === 'current') {
      return 'animate-pulse-fade';
    }
    return '';
  };
  
  // Determine if this node is selected
  const isSelected = state.selectedNodeId === node.id;
  
  // Determine if this node is the start node
  const isStart = state.startNodeId === node.id;
  
  return (
    <div
      ref={nodeRef}
      className={`absolute rounded-full w-12 h-12 flex items-center justify-center cursor-grab 
                 ${isSelected ? 'ring-4 ring-white' : ''}
                 ${getNodeColor()} ${getAnimationClass()}`}
      style={{
        left: node.x - 24, // 24 is half the width
        top: node.y - 24, // 24 is half the height
        zIndex: isDragging || isSelected ? 10 : 5,
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <span className={`text-white font-bold ${isStart ? 'text-xl animate-pulse' : ''}`}>
        {node.label}
      </span>
    </div>
  );
};

export default Node;
