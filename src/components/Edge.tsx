
import React from 'react';
import { useGraphContext } from '../context/GraphContext';
import { EdgeData, pointOnLine } from '../utils/graphUtils';

interface EdgeProps {
  edge: EdgeData;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

const Edge: React.FC<EdgeProps> = ({ edge, sourceX, sourceY, targetX, targetY }) => {
  const { state, dispatch } = useGraphContext();
  
  // Determine edge color based on status
  const getEdgeColor = () => {
    switch (edge.status) {
      case 'selected': return '#FFFFFF';
      case 'mst': return '#4CAF50'; // Green for MST
      case 'visited': return '#4CAF50'; // Green for visited edges in traversal
      case 'current': return '#ea384c'; // Red for current edges
      default: return '#8E9196'; // Default gray color
    }
  };
  
  // Handle edge click
  const handleEdgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Only allow selection if not running an algorithm
    if (!state.isRunning) {
      dispatch({ type: 'SELECT_EDGE', edgeId: edge.id });
    }
  };
  
  // Calculate the midpoint of the edge for weight label
  const midpoint = pointOnLine(sourceX, sourceY, targetX, targetY, 0.5);
  
  // Calculate perpendicular offset to move the weight away from the edge line
  // This ensures it's more visible and not covered by nodes
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Normalized perpendicular vector (rotated 90 degrees)
  const perpX = -dy / length;
  const perpY = dx / length;
  
  // Apply offset along perpendicular vector (30 pixels away from edge)
  const offsetX = perpX * 30;
  const offsetY = perpY * 30;
  
  // Final weight position
  const weightPos = {
    x: midpoint.x + offsetX,
    y: midpoint.y + offsetY,
  };
  
  // Determine if this edge is selected
  const isSelected = state.selectedEdgeId === edge.id;
  
  return (
    <>
      {/* Edge line */}
      <line
        x1={sourceX}
        y1={sourceY}
        x2={targetX}
        y2={targetY}
        stroke={getEdgeColor()}
        strokeWidth={isSelected ? "4" : "2"}
        onClick={handleEdgeClick}
        style={{ cursor: 'pointer' }}
      />
      
      {/* Edge weight */}
      <g onClick={handleEdgeClick}>
        <rect 
          x={weightPos.x - 14} 
          y={weightPos.y - 14} 
          width={28} 
          height={22} 
          rx={4} 
          fill="#2D3748" 
          strokeWidth={isSelected ? "2" : "1"} 
          stroke={isSelected ? "#FFFFFF" : "rgba(255,255,255,0.5)"}
        />
        <text 
          x={weightPos.x} 
          y={weightPos.y} 
          textAnchor="middle" 
          dominantBaseline="middle" 
          fill="white" 
          fontSize="12"
          fontWeight={isSelected ? "bold" : "normal"}
        >
          {edge.weight}
        </text>
      </g>
    </>
  );
};

export default Edge;
