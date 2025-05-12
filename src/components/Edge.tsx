
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
  
  // Get color based on edge status
  const getEdgeColor = () => {
    switch (edge.status) {
      case 'selected': return 'stroke-edge-selected';
      case 'mst': return 'stroke-edge-mst';
      default: return 'stroke-edge-default';
    }
  };
  
  // Handle edge click
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Only allow selection if we're not running
    if (!state.isRunning) {
      dispatch({ type: 'SELECT_EDGE', edgeId: edge.id });
    }
  };
  
  // Calculate midpoint for showing weight
  const midpoint = pointOnLine(sourceX, sourceY, targetX, targetY, 0.5);
  
  // Determine if this edge is selected
  const isSelected = state.selectedEdgeId === edge.id;
  
  // Determine animation class
  const getAnimationClass = () => {
    if (edge.status === 'mst') {
      return 'animate-pulse-fade';
    }
    return '';
  };
  
  // Calculate proper width based on status
  const getStrokeWidth = () => {
    if (edge.status === 'mst') return 4;
    if (isSelected) return 3;
    return 2;
  };
  
  return (
    <g>
      {/* Edge line */}
      <line
        x1={sourceX}
        y1={sourceY}
        x2={targetX}
        y2={targetY}
        className={`${getEdgeColor()} ${getAnimationClass()}`}
        strokeWidth={getStrokeWidth()}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      />
      
      {/* Weight display */}
      <foreignObject
        x={midpoint.x - 12}
        y={midpoint.y - 12}
        width={24}
        height={24}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="bg-white bg-opacity-80 rounded-full w-full h-full flex items-center justify-center text-xs font-bold">
          {edge.weight}
        </div>
      </foreignObject>
    </g>
  );
};

export default Edge;
