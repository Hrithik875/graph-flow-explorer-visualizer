
import React from 'react';
import GraphBoard from '../components/GraphBoard';
import Sidebar from '../components/Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGraphContext } from '../context/GraphContext';

const Index = () => {
  const isMobile = useIsMobile();
  const { state } = useGraphContext();
  
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-white dark:bg-gray-900 overflow-hidden">
      <div className={`${isMobile ? 'h-auto' : 'h-full'}`}>
        <Sidebar />
      </div>
      <div className="flex-1 p-2 md:p-4 overflow-hidden flex flex-col relative">
        <GraphBoard />
        {/* Help text centered properly regardless of sidebar state */}
        {state.graph.nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              Click anywhere to add a node
            </p>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
};

export default Index;
