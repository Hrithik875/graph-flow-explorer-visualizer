
import React from 'react';
import { useGraphContext } from '../context/GraphContext';
import { EdgeData, pointOnLine } from '../utils/graphUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface EdgeProps {
  edge: EdgeData;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

const Edge: React.FC<EdgeProps> = ({ edge, sourceX, sourceY, targetX, targetY }) => {
  const { state, dispatch } = useGraphContext();
  const isMobile = useIsMobile();
  
  // Determine edge color based on status
  const getEdgeColor = () => {
    switch (edge.status) {
      case 'selected': return '#FFFFFF'; // White for selected edges
      case 'mst': return '#4CAF50'; // Green for MST edges
      case 'visited': return '#4CAF50'; // Green for visited edges in traversal
      case 'current': return '#ea384c'; // Red for current/active edges
      default: return '#8E9196'; // Default gray color
    }
  };
  
  // Handle edge click/tap
  const handleEdgeClick = (e: React.MouseEvent | React.TouchEvent) => {
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
  
  // Apply offset along perpendicular vector (adjust for mobile)
  const offsetDistance = isMobile ? 20 : 30;
  const offsetX = perpX * offsetDistance;
  const offsetY = perpY * offsetDistance;
  
  // Final weight position
  const weightPos = {
    x: midpoint.x + offsetX,
    y: midpoint.y + offsetY,
  };
  
  // Determine if this edge is selected
  const isSelected = state.selectedEdgeId === edge.id;
  
  // Adjust sizes for mobile
  const fontSize = isMobile ? "10" : "12";
  const rectWidth = isMobile ? 22 : 28;
  const rectHeight = isMobile ? 18 : 22;
  const strokeWidth = isSelected ? (isMobile ? "3" : "4") : (isMobile ? "1.5" : "2");
  
  return (
    <>
      {/* Edge line */}
      <line
        x1={sourceX}
        y1={sourceY}
        x2={targetX}
        y2={targetY}
        stroke={getEdgeColor()}
        strokeWidth={strokeWidth}
        onClick={handleEdgeClick}
        onTouchEnd={handleEdgeClick}
        style={{ cursor: 'pointer' }}
      />
      
      {/* Edge weight */}
      <g onClick={handleEdgeClick} onTouchEnd={handleEdgeClick}>
        <rect 
          x={weightPos.x - (rectWidth/2)} 
          y={weightPos.y - (rectHeight/2)} 
          width={rectWidth} 
          height={rectHeight} 
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
          fontSize={fontSize}
          fontWeight={isSelected ? "bold" : "normal"}
          style={{ userSelect: "none" }}
        >
          {edge.weight}
        </text>
      </g>
    </>
  );
};

export default Edge;
