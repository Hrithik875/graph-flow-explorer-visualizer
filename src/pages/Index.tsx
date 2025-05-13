
import React from 'react';
import GraphBoard from '../components/GraphBoard';
import Sidebar from '../components/Sidebar';
import { GraphProvider } from '../context/GraphContext';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  return (
    <GraphProvider>
      <div className="flex h-screen w-full bg-gray-900 overflow-hidden">
        <Sidebar />
        <div className="flex-1 p-4 overflow-hidden">
          <GraphBoard />
        </div>
        <Toaster />
      </div>
    </GraphProvider>
  );
};

export default Index;
