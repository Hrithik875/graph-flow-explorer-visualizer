
import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    // Start text animation after a brief delay
    const textTimer = setTimeout(() => setAnimationPhase(1), 500);
    
    // Complete splash screen after 3 seconds
    const completeTimer = setTimeout(() => {
      setAnimationPhase(2);
      setTimeout(onComplete, 500);
    }, 3000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Generate random animated lines
  const generateLines = () => {
    const lines = [];
    for (let i = 0; i < 15; i++) {
      const x1 = Math.random() * 100;
      const y1 = Math.random() * 100;
      const x2 = Math.random() * 100;
      const y2 = Math.random() * 100;
      
      lines.push(
        <line
          key={i}
          x1={`${x1}%`}
          y1={`${y1}%`}
          x2={`${x2}%`}
          y2={`${y2}%`}
          stroke={theme === 'dark' ? '#4285F4' : '#1E40AF'}
          strokeWidth="2"
          opacity="0.3"
          className="animate-pulse"
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '2s'
          }}
        />
      );
    }
    return lines;
  };

  // Generate random animated nodes
  const generateNodes = () => {
    const nodes = [];
    for (let i = 0; i < 8; i++) {
      const cx = Math.random() * 100;
      const cy = Math.random() * 100;
      
      nodes.push(
        <circle
          key={i}
          cx={`${cx}%`}
          cy={`${cy}%`}
          r="4"
          fill={theme === 'dark' ? '#00C853' : '#059669'}
          opacity="0.4"
          className="animate-pulse"
          style={{
            animationDelay: `${i * 0.3}s`,
            animationDuration: '1.5s'
          }}
        />
      );
    }
    return nodes;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        animationPhase === 2 ? 'opacity-0' : 'opacity-100'
      } ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}
    >
      {/* Animated background with nodes and edges */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      >
        {generateLines()}
        {generateNodes()}
      </svg>

      {/* Main content */}
      <div className="relative z-10 text-center">
        <h1
          className={`text-4xl md:text-6xl font-bold transition-all duration-1000 ${
            animationPhase >= 1
              ? 'opacity-100 transform translate-y-0'
              : 'opacity-0 transform translate-y-8'
          } ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}
        >
          <span className="inline-block animate-fade-in" style={{ animationDelay: '0.5s' }}>
            Graph
          </span>
          <span className="inline-block animate-fade-in mx-3" style={{ animationDelay: '0.7s' }}>
            Algorithm
          </span>
          <span className="inline-block animate-fade-in" style={{ animationDelay: '0.9s' }}>
            Visualizer
          </span>
        </h1>
        
        {/* Loading indicator */}
        <div
          className={`mt-8 transition-all duration-500 ${
            animationPhase >= 1 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className={`w-48 h-1 mx-auto rounded-full overflow-hidden ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div
              className={`h-full rounded-full transition-all duration-2000 ease-out ${
                theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'
              }`}
              style={{
                width: animationPhase >= 1 ? '100%' : '0%',
                animationDelay: '0.5s'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
