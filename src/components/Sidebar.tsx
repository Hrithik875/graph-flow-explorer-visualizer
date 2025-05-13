import React, { useState, useEffect } from 'react';
import { useGraphContext } from '../context/GraphContext';
import { AlgorithmStep } from '../utils/algorithms';
import { primMST, kruskalMST, bfs, dfs } from '../utils/algorithms';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const Sidebar: React.FC = () => {
  const { state, dispatch } = useGraphContext();
  const { toast } = useToast();
  const [generator, setGenerator] = useState<Generator<AlgorithmStep> | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  
  // Handle algorithm selection
  const handleAlgorithmSelect = (algorithm: typeof state.algorithm) => {
    // Reset the graph status when changing algorithms
    dispatch({ type: 'RESET_GRAPH_STATUS' });
    dispatch({ type: 'SET_ALGORITHM', algorithm });
    dispatch({ type: 'SET_RUNNING', isRunning: false });
    setIsFinished(false);
  };
  
  // Handle algorithm start
  const handleStartAlgorithm = () => {
    if (!state.algorithm) {
      toast({
        title: "No Algorithm Selected",
        description: "Please select an algorithm to run.",
        variant: "destructive"
      });
      return;
    }
    
    // For MST and traversal algorithms, we need a start node
    if (['prim', 'bfs', 'dfs'].includes(state.algorithm) && !state.startNodeId) {
      toast({
        title: "No Start Node",
        description: "Double-click a node to set it as the start node.",
        variant: "destructive"
      });
      return;
    }
    
    // Reset the graph status
    dispatch({ type: 'RESET_GRAPH_STATUS' });
    
    // Create generator based on selected algorithm
    let algorithmGenerator;
    switch (state.algorithm) {
      case 'prim':
        if (state.startNodeId) {
          algorithmGenerator = primMST(state.graph, state.startNodeId);
        }
        break;
      case 'kruskal':
        algorithmGenerator = kruskalMST(state.graph);
        break;
      case 'bfs':
        if (state.startNodeId) {
          algorithmGenerator = bfs(state.graph, state.startNodeId);
        }
        break;
      case 'dfs':
        if (state.startNodeId) {
          algorithmGenerator = dfs(state.graph, state.startNodeId);
        }
        break;
    }
    
    // Start running the algorithm
    if (algorithmGenerator) {
      setGenerator(algorithmGenerator);
      dispatch({ type: 'SET_RUNNING', isRunning: true });
      setIsFinished(false);
    }
  };
  
  // Handle algorithm pause/resume
  const handleTogglePause = () => {
    dispatch({ type: 'SET_RUNNING', isRunning: !state.isRunning });
  };
  
  // Handle algorithm reset
  const handleResetAlgorithm = () => {
    dispatch({ type: 'SET_RUNNING', isRunning: false });
    dispatch({ type: 'RESET_GRAPH_STATUS' });
    setGenerator(null);
    setIsFinished(false);
  };
  
  // Handle clear graph
  const handleClearGraph = () => {
    if (state.isRunning) {
      dispatch({ type: 'SET_RUNNING', isRunning: false });
    }
    dispatch({ type: 'CLEAR_GRAPH' });
    setGenerator(null);
    setIsFinished(false);
  };
  
  // Handle speed change
  const handleSpeedChange = (values: number[]) => {
    dispatch({ type: 'SET_SPEED', speed: 1000 - values[0] }); // Invert the value for intuitive slider
  };
  
  // Handle edge weight change
  const handleEdgeWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (state.selectedEdgeId) {
      const weight = parseInt(e.target.value);
      if (weight > 0) {
        dispatch({ type: 'UPDATE_EDGE_WEIGHT', edgeId: state.selectedEdgeId, weight });
      }
    }
  };
  
  // Run algorithm steps on an interval
  useEffect(() => {
    if (state.isRunning && generator) {
      const intervalId = setInterval(() => {
        const result = generator.next();
        
        if (result.done) {
          setIsFinished(true);
          dispatch({ type: 'SET_RUNNING', isRunning: false });
          
          // Show final message if available
          if (result.value) {
            // Update total MST cost if provided (for MST algorithms)
            if (result.value.totalCost !== undefined) {
              dispatch({ type: 'SET_TOTAL_MST_COST', cost: result.value.totalCost });
            }
            
            // Add final path step if provided
            if (result.value.pathStep) {
              dispatch({ type: 'ADD_PATH_STEP', step: result.value.pathStep });
            }
            
            toast({
              title: "Algorithm Complete",
              description: result.value.message,
            });
          }
        } else {
          dispatch({ type: 'SET_CURRENT_STEP', step: result.value });
          
          // Add path step if provided
          if (result.value.pathStep) {
            dispatch({ type: 'ADD_PATH_STEP', step: result.value.pathStep });
          }
          
          // Show step message
          if (result.value.message) {
            // Only show messages for important steps to avoid overwhelming the user
            if (['addToMST', 'done'].includes(result.value.type)) {
              toast({
                description: result.value.message,
                duration: state.speed / 2, // Shorter duration than the speed
              });
            }
          }
        }
      }, state.speed);
      
      return () => clearInterval(intervalId);
    }
  }, [state.isRunning, generator, state.speed, dispatch, toast]);
  
  // Clear path when changing algorithms or resetting
  useEffect(() => {
    if (!state.isRunning) {
      dispatch({ type: 'CLEAR_PATH' });
    }
  }, [state.algorithm, dispatch]);
  
  // Get the current algorithm name for display
  const getAlgorithmName = () => {
    switch (state.algorithm) {
      case 'prim': return "Prim's Algorithm (MST)";
      case 'kruskal': return "Kruskal's Algorithm (MST)";
      case 'bfs': return "Breadth-First Search (BFS)";
      case 'dfs': return "Depth-First Search (DFS)";
      default: return "No Algorithm Selected";
    }
  };
  
  // Determine if total cost should be shown (for MST algorithms)
  const shouldShowTotalCost = () => {
    return (state.algorithm === 'prim' || state.algorithm === 'kruskal') && 
           state.totalMSTCost !== null;
  };
  
  return (
    <div className="w-80 h-full bg-gray-800 p-4 flex flex-col overflow-hidden">
      <h1 className="text-2xl font-bold text-white mb-4">Algorithm Visualizer</h1>
      
      {/* Tabs for different sections */}
      <Tabs defaultValue="algorithms" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="algorithms">Algorithms</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="path">Path</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>
        
        {/* Algorithm Selection */}
        <TabsContent value="algorithms" className="flex-1 overflow-hidden flex flex-col">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Minimum Spanning Tree</h2>
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant={state.algorithm === 'prim' ? "default" : "outline"}
                onClick={() => handleAlgorithmSelect('prim')}
                disabled={state.isRunning}
                className="justify-start"
              >
                Prim's Algorithm
              </Button>
              <Button 
                variant={state.algorithm === 'kruskal' ? "default" : "outline"}
                onClick={() => handleAlgorithmSelect('kruskal')}
                disabled={state.isRunning}
                className="justify-start"
              >
                Kruskal's Algorithm
              </Button>
            </div>
            
            <h2 className="text-lg font-semibold text-white">Graph Traversal</h2>
            <div className="grid grid-cols-1 gap-2">
              <Button 
                variant={state.algorithm === 'bfs' ? "default" : "outline"}
                onClick={() => handleAlgorithmSelect('bfs')}
                disabled={state.isRunning}
                className="justify-start"
              >
                Breadth-First Search (BFS)
              </Button>
              <Button 
                variant={state.algorithm === 'dfs' ? "default" : "outline"}
                onClick={() => handleAlgorithmSelect('dfs')}
                disabled={state.isRunning}
                className="justify-start"
              >
                Depth-First Search (DFS)
              </Button>
            </div>
          </div>
          
          {/* Status and Controls */}
          <div className="mt-8 space-y-4">
            <div className="bg-gray-700 p-3 rounded-md">
              <p className="text-white font-medium">
                {getAlgorithmName()}
              </p>
              {state.startNodeId && (
                <p className="text-sm text-gray-300">
                  Start Node: {state.graph.nodes.find(n => n.id === state.startNodeId)?.label}
                </p>
              )}
              
              {/* Total MST Cost Display */}
              {shouldShowTotalCost() && (
                <div className="mt-3 p-2 bg-gray-900 rounded-md border border-green-500">
                  <p className="text-sm text-white font-medium">
                    Minimum Spanning Tree Total Cost:
                  </p>
                  <p className="text-xl text-green-400 font-bold text-center">
                    {state.totalMSTCost}
                  </p>
                </div>
              )}
              
              {state.currentStep && (
                <p className="text-sm text-gray-300 mt-2">
                  {state.currentStep.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handleStartAlgorithm}
                disabled={state.isRunning || !state.algorithm}
                className="w-full"
              >
                Start Algorithm
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleTogglePause}
                  disabled={!state.algorithm || isFinished}
                  variant="outline"
                >
                  {state.isRunning ? 'Pause' : 'Resume'}
                </Button>
                <Button 
                  onClick={handleResetAlgorithm}
                  disabled={!state.algorithm}
                  variant="outline"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Controls Tab */}
        <TabsContent value="controls" className="space-y-6 flex-1 overflow-auto">
          {/* Speed Control */}
          <div>
            <Label htmlFor="speed-slider" className="text-white">
              Animation Speed
            </Label>
            <div className="flex items-center mt-2">
              <span className="text-xs text-gray-400">Slow</span>
              <Slider
                id="speed-slider"
                defaultValue={[1000 - state.speed]}
                max={950}
                min={50}
                step={50}
                onValueChange={handleSpeedChange}
                className="mx-2"
              />
              <span className="text-xs text-gray-400">Fast</span>
            </div>
          </div>
          
          {/* Edge Weight (when edge is selected) */}
          {state.selectedEdgeId && (
            <div>
              <Label htmlFor="edge-weight" className="text-white">
                Edge Weight
              </Label>
              <Input
                id="edge-weight"
                type="number"
                min="1"
                value={state.graph.edges.find(e => e.id === state.selectedEdgeId)?.weight || 1}
                onChange={handleEdgeWeightChange}
                className="mt-1"
              />
            </div>
          )}
          
          {/* Graph Controls */}
          <div className="space-y-2">
            <h3 className="text-sm text-gray-300">Graph Controls</h3>
            <Button 
              variant="destructive"
              onClick={handleClearGraph}
              className="w-full"
            >
              Clear Graph
            </Button>
          </div>
          
          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Keyboard Shortcuts</h3>
            <div className="space-y-1 text-xs text-gray-400">
              <p><span className="font-mono bg-gray-700 px-1 rounded">Delete</span> - Delete selected node/edge</p>
              <p><span className="font-mono bg-gray-700 px-1 rounded">Escape</span> - Deselect all</p>
            </div>
          </div>
        </TabsContent>
        
        {/* Path Tab */}
        <TabsContent value="path" className="flex-1 overflow-hidden flex flex-col">
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <h2 className="text-lg font-semibold text-white">Algorithm Path</h2>
            
            {state.pathTaken.length > 0 ? (
              <ScrollArea className="flex-1 border rounded-md border-gray-700 bg-gray-900 p-3">
                <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
                  {state.pathTaken.map((step, index) => (
                    <li key={index} className="py-1 border-b border-gray-800 last:border-0">
                      {step}
                    </li>
                  ))}
                </ol>
              </ScrollArea>
            ) : (
              <div className="flex justify-center items-center h-[200px] text-gray-500">
                Run an algorithm to see the path steps
              </div>
            )}
            
            {/* Total MST Cost Display */}
            {shouldShowTotalCost() && (
              <div className="p-2 bg-gray-900 rounded-md border border-green-500">
                <p className="text-sm text-white font-medium">
                  Minimum Spanning Tree Total Cost:
                </p>
                <p className="text-xl text-green-400 font-bold text-center">
                  {state.totalMSTCost}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Info Tab */}
        <TabsContent value="info" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full bg-gray-800">
            <div className="space-y-6 p-1">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Instructions</h3>
                <ul className="text-sm text-gray-300 space-y-2 list-disc pl-4">
                  <li>Click on the canvas to create a node</li>
                  <li>Drag from one node to another to create an edge</li>
                  <li>Double-click a node to set it as the start node</li>
                  <li>Click an edge to select it and modify its weight</li>
                  <li>Select algorithm and click Start to run visualization</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Algorithm Info</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-md font-medium text-white">Minimum Spanning Tree</h4>
                    <p className="text-sm text-gray-300">
                      MST algorithms find the subset of edges that connect all nodes with minimum total weight.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-white">Prim's Algorithm</h4>
                    <p className="text-sm text-gray-300">
                      A greedy algorithm that starts from a vertex and grows the MST one edge at a time.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Time Complexity: O(E log V)
                    </p>
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-white">Kruskal's Algorithm</h4>
                    <p className="text-sm text-gray-300">
                      Sorts all edges by weight and adds them to MST if they don't create a cycle.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Time Complexity: O(E log E)
                    </p>
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-white">Graph Traversal</h4>
                    <p className="text-sm text-gray-300">
                      Algorithms for visiting all nodes in a graph.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-white">BFS</h4>
                    <p className="text-sm text-gray-300">
                      Visits nodes level by level, starting from a source node.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Time Complexity: O(V + E)
                    </p>
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-white">DFS</h4>
                    <p className="text-sm text-gray-300">
                      Explores as far as possible along a branch before backtracking.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Time Complexity: O(V + E)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Sidebar;
