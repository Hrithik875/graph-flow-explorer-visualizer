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
    }, 4000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Generate random animated nodes
  const generateNodes = () => {
    const nodes = [];
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const size = Math.random() * 0.8 + 0.4; // Size between 0.4 and 1.2rem

      nodes.push(
        <div
          key={i}
          className="absolute rounded-full bg-blue-400 animate-ping"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: `${size}rem`,
            height: `${size}rem`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: 0.25, // More transparent
            filter: 'blur(0.5px)', // Subtle blur for softer look
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
      } overflow-hidden`}
      style={{
        background:
          theme === 'dark'
            ? 'linear-gradient(135deg, #18181b 0%, #23272f 100%)'
            : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      }}
    >
      {/* Animated nodes in the background */}
      {generateNodes()}

      {/* Main content */}
      <div className="relative z-10 text-center">
        <h1
          className={`text-4xl md:text-6xl font-bold transition-all duration-1000 ${
            animationPhase >= 1
              ? 'opacity-100 transform translate-y-0'
              : 'opacity-0 transform translate-y-8'
          } ${theme === 'dark' ? 'text-white' : 'text-black'}`} // Changed text-gray-900 to text-black
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
          className={`mt-8 transition-all duration-500 ${animationPhase >= 1 ? 'opacity-100' : 'opacity-0'}`}
        >
          <div
            className={`w-48 h-1 mx-auto rounded-full overflow-hidden ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-2000 ease-out ${
                theme === 'dark' ? 'bg-blue-500' : 'bg-blue-600'
              }`}
              style={{
                width: animationPhase >= 1 ? '100%' : '0%',
                animationDelay: '0.5s',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
