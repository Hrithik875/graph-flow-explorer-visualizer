
import React from 'react';
import GraphBoard from '../components/GraphBoard';
import Sidebar from '../components/Sidebar';
import { GraphProvider } from '../context/GraphContext';

const Index = () => {
  return (
    <GraphProvider>
      <div className="flex h-screen w-full bg-gray-900">
        <Sidebar />
        <div className="flex-1 p-4">
          <GraphBoard />
        </div>
      </div>
    </GraphProvider>
  );
};

export default Index;
