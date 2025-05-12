
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
  
  // Get color based on edge status and weight
  const getEdgeColor = () => {
    // First handle edge status
    switch (edge.status) {
      case 'selected': return 'stroke-edge-selected';
      case 'mst': return 'stroke-edge-mst';
      default: {
        // For default edges, use a color scale based on weight
        if (edge.weight <= 3) return 'stroke-edge-low-cost';
        if (edge.weight <= 6) return 'stroke-edge-medium-cost';
        return 'stroke-edge-high-cost';
      }
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
        x={midpoint.x - 15}
        y={midpoint.y - 15}
        width={30}
        height={30}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="bg-white bg-opacity-80 rounded-full w-full h-full flex items-center justify-center text-xs font-bold border border-gray-300 shadow-sm">
          {edge.weight}
        </div>
      </foreignObject>
    </g>
  );
};

export default Edge;
