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
import SavedGraphs from './SavedGraphs';
import { Menu } from "lucide-react";

const Sidebar: React.FC = () => {
  const { state, dispatch } = useGraphContext();
  const { toast } = useToast();
  const [generator, setGenerator] = useState<Generator<AlgorithmStep> | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [open, setOpen] = useState(true);

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
    <>
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full z-40 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: 384 }}
      >
        {/* Header: Menu Icon + Title */}
        <div className="flex items-center gap-3 px-4 py-4 bg-gray-50 dark:bg-gray-800">
          <button
            className="bg-white dark:bg-gray-900 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle sidebar"
            type="button"
          >
            <Menu className="text-gray-700 dark:text-white" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white m-0">Algorithm Visualizer</h1>
        </div>
        {/* Sidebar Content */}
        <div className="w-96 h-[calc(100%-64px)] bg-gray-50 dark:bg-gray-800 flex flex-col overflow-hidden relative">
          <Tabs defaultValue="algorithms" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-5 mx-4 gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <TabsTrigger
                value="algorithms"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white dark:data-[state=active]:font-semibold dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-600 text-xs px-2 py-1"
              >
                Algorithms
              </TabsTrigger>
              <TabsTrigger
                value="controls"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white dark:data-[state=active]:font-semibold dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-600 text-xs px-2 py-1"
              >
                Controls
              </TabsTrigger>
              <TabsTrigger
                value="path"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white dark:data-[state=active]:font-semibold dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-600 text-xs px-2 py-1"
              >
                Path
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white dark:data-[state=active]:font-semibold dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-600 text-xs px-2 py-1"
              >
                Saved
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white dark:data-[state=active]:font-semibold dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-600 text-xs px-2 py-1"
              >
                Info
              </TabsTrigger>
            </TabsList>
            
            {/* Algorithm Selection Tab */}
            <TabsContent value="algorithms" className="flex-1 overflow-auto px-4 pt-4 pb-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Minimum Spanning Tree</h2>
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    variant={state.algorithm === 'prim' ? "default" : "outline"}
                    onClick={() => handleAlgorithmSelect('prim')}
                    disabled={state.isRunning}
                    className={state.algorithm === 'prim' 
                      ? "justify-start bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600"
                      : "justify-start bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-gray-600"
                    }
                  >
                    Prim's Algorithm
                  </Button>
                  <Button 
                    variant={state.algorithm === 'kruskal' ? "default" : "outline"}
                    onClick={() => handleAlgorithmSelect('kruskal')}
                    disabled={state.isRunning}
                    className={state.algorithm === 'kruskal' 
                      ? "justify-start bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600"
                      : "justify-start bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-gray-600"
                    }
                  >
                    Kruskal's Algorithm
                  </Button>
                </div>
                
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Graph Traversal</h2>
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    variant={state.algorithm === 'bfs' ? "default" : "outline"}
                    onClick={() => handleAlgorithmSelect('bfs')}
                    disabled={state.isRunning}
                    className={state.algorithm === 'bfs' 
                      ? "justify-start bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600"
                      : "justify-start bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-gray-600"
                    }
                  >
                    Breadth-First Search (BFS)
                  </Button>
                  <Button 
                    variant={state.algorithm === 'dfs' ? "default" : "outline"}
                    onClick={() => handleAlgorithmSelect('dfs')}
                    disabled={state.isRunning}
                    className={state.algorithm === 'dfs' 
                      ? "justify-start bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600"
                      : "justify-start bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-gray-600"
                    }
                  >
                    Depth-First Search (DFS)
                  </Button>
                </div>
              </div>
              
              {/* Status and Controls */}
              <div className="space-y-4 mt-4">
                <div className="bg-white dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-800 dark:text-white font-medium">
                    {getAlgorithmName()}
                  </p>
                  {state.startNodeId && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Start Node: {state.graph.nodes.find(n => n.id === state.startNodeId)?.label}
                    </p>
                  )}
                  
                  {/* Total MST Cost Display */}
                  {shouldShowTotalCost() && (
                    <div className="mt-3 p-2 bg-green-50 dark:bg-gray-900 rounded-md border border-green-500">
                      <p className="text-sm text-gray-800 dark:text-white font-medium">
                        Minimum Spanning Tree Total Cost:
                      </p>
                      <p className="text-xl text-green-600 dark:text-green-400 font-bold text-center">
                        {state.totalMSTCost}
                      </p>
                    </div>
                  )}
                  
                  {state.currentStep && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {state.currentStep.message}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={handleStartAlgorithm}
                    disabled={state.isRunning || !state.algorithm}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                  >
                    Start Algorithm
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={handleTogglePause}
                      disabled={!state.algorithm || isFinished}
                      variant="outline"
                      className="bg-white hover:bg-gray-50 text-gray-800 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-gray-600"
                    >
                      {state.isRunning ? 'Pause' : 'Resume'}
                    </Button>
                    <Button 
                      onClick={handleResetAlgorithm}
                      disabled={!state.algorithm}
                      variant="outline"
                      className="bg-white hover:bg-gray-50 text-gray-800 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white dark:border-gray-600"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Controls Tab */}
            <TabsContent value="controls" className="flex-1 overflow-auto px-4 pt-4 pb-6">
              <div className="space-y-6">
                {/* Speed Control */}
                <div>
                  <Label htmlFor="speed-slider" className="text-gray-800 dark:text-white">
                    Animation Speed
                  </Label>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Slow</span>
                    <Slider
                      id="speed-slider"
                      defaultValue={[1000 - state.speed]}
                      max={950}
                      min={50}
                      step={50}
                      onValueChange={handleSpeedChange}
                      className="mx-2"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Fast</span>
                  </div>
                </div>
                
                {/* Edge Weight (when edge is selected) */}
                {state.selectedEdgeId && (
                  <div>
                    <Label htmlFor="edge-weight" className="text-gray-800 dark:text-white">
                      Edge Weight
                    </Label>
                    <Input
                      id="edge-weight"
                      type="number"
                      min="1"
                      value={state.graph.edges.find(e => e.id === state.selectedEdgeId)?.weight || 1}
                      onChange={handleEdgeWeightChange}
                      className="mt-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600"
                    />
                  </div>
                )}
                
                {/* Graph Controls */}
                <div className="space-y-2">
                  <h3 className="text-sm text-gray-600 dark:text-gray-300">Graph Controls</h3>
                  <Button 
                    variant="destructive"
                    onClick={handleClearGraph}
                    className="w-full bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600"
                  >
                    Clear Graph
                  </Button>
                </div>
                
                {/* Keyboard Shortcuts */}
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Keyboard Shortcuts</h3>
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <p><span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">Delete</span> - Delete selected node/edge</p>
                    <p><span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">Escape</span> - Deselect all</p>
                    <p><span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+Z</span> - Undo</p>
                    <p><span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+Y</span> - Redo</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Path Tab */}
            <TabsContent value="path" className="flex-1 overflow-hidden px-4 pt-4 pb-6">
              <div className="flex flex-col h-full">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Algorithm Path</h2>
                
                <ScrollArea className="flex-1 border rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                  {state.pathTaken.length > 0 ? (
                    <ol className="p-3 space-y-2 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
                      {state.pathTaken.map((step, index) => (
                        <li key={index} className="py-1 border-b border-gray-200 dark:border-gray-800 last:border-0">
                          {step}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="flex justify-center items-center h-[200px] text-gray-500 p-3">
                      Run an algorithm to see the path steps
                    </div>
                  )}
                </ScrollArea>
                
                {/* Total MST Cost Display */}
                {shouldShowTotalCost() && (
                  <div className="mt-4 p-2 bg-green-50 dark:bg-gray-900 rounded-md border border-green-500">
                    <p className="text-sm text-gray-800 dark:text-white font-medium">
                      Minimum Spanning Tree Total Cost:
                    </p>
                    <p className="text-xl text-green-600 dark:text-green-400 font-bold text-center">
                      {state.totalMSTCost}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Saved Graphs Tab */}
            <TabsContent value="saved" className="flex-1 overflow-hidden px-4 pt-4 pb-6">
              <div className="flex flex-col h-full">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Saved Graphs</h2>
                <div className="flex-1 overflow-hidden border rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <SavedGraphs />
                </div>
              </div>
            </TabsContent>
            
            {/* Info Tab */}
            <TabsContent value="info" className="flex-1 overflow-auto px-4 pt-4 pb-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Instructions</h3>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2 list-disc pl-4">
                    <li>Click on the canvas to create a node</li>
                    <li>Drag from one node to another to create an edge</li>
                    <li>Double-click a node to set it as the start node</li>
                    <li>Click an edge to select it and modify its weight</li>
                    <li>Select algorithm and click Start to run visualization</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Algorithm Info</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-md font-medium text-gray-800 dark:text-white">Minimum Spanning Tree</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        MST algorithms find the subset of edges that connect all nodes with minimum total weight.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-800 dark:text-white">Prim's Algorithm</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        A greedy algorithm that starts from a vertex and grows the MST one edge at a time.
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Time Complexity: O(E log V)
                      </p>
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-800 dark:text-white">Kruskal's Algorithm</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Sorts all edges by weight and adds them to MST if they don't create a cycle.
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Time Complexity: O(E log E)
                      </p>
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-800 dark:text-white">Graph Traversal</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Algorithms for visiting all nodes in a graph.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-800 dark:text-white">BFS</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Visits nodes level by level, starting from a source node.
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Time Complexity: O(V + E)
                      </p>
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-800 dark:text-white">DFS</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Explores as far as possible along a branch before backtracking.
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Time Complexity: O(V + E)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {!open && (
        <button
          className="fixed top-20 left-8 z-50 bg-white dark:bg-gray-900 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
          onClick={() => setOpen(true)}
          aria-label="Open sidebar"
          type="button"
        >
          <Menu className="text-gray-700 dark:text-white" />
        </button>
      )}
    </>
  );
};

export default Sidebar;
