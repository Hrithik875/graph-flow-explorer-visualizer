
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
      
      {/* Weight display - enhanced */}
      <foreignObject
        x={midpoint.x - 18}
        y={midpoint.y - 18}
        width={36}
        height={36}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <div className={`${edge.status === 'mst' ? 'bg-green-100 border-green-500' : 'bg-white border-gray-300'} bg-opacity-90 rounded-full w-full h-full flex items-center justify-center text-sm font-bold border-2 shadow-sm`}>
          {edge.weight}
        </div>
      </foreignObject>
    </g>
  );
};

export default Edge;
