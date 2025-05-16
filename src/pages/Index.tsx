
import React from 'react';
import GraphBoard from '../components/GraphBoard';
import Sidebar from '../components/Sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-900 overflow-hidden">
      <div className={`${isMobile ? 'h-auto' : ''} md:h-full`}>
        <Sidebar />
      </div>
      <div className="flex-1 p-2 md:p-4 overflow-hidden">
        <GraphBoard />
      </div>
      <Toaster />
    </div>
  );
};

export default Index;
