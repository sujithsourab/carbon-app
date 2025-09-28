import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProject } from "../context/ProjectContext";
import { AppRoutes } from "../types";

const loadingMessages = [
  "Growing Your Forest of Knowledge...",
  "Cultivating Sustainable Documentation...",
  "Watching Your Project Take Root...",
  "Nature's Blueprint Coming to Life...",
];

// Create a dense forest of trees with varying sizes and positions
const trees = Array(50).fill(null).map((_, i) => {
  // Calculate a shade of green based on the index
  const greenShade = Math.floor((i / 50) * 3); // 0, 1, or 2
  const colors = [
    'rgb(144, 238, 144)', // Light green
    'rgb(34, 139, 34)',   // Forest green
    'rgb(0, 100, 0)'      // Dark green
  ];
  
  return {
    size: Math.random() * 80 + 40,
    left: Math.random() * 100,
    bottom: Math.random() * 60,
    delay: Math.random() * 3,
    opacity: Math.random() * 0.4 + 0.6,
    color: colors[greenShade],
  };
});

// Create birds flying above
const birds = Array(12).fill(null).map((_, i) => ({
  direction: i % 2 === 0 ? 'left' : 'right',
  startPosition: {
    left: i % 2 === 0 ? -10 : 110,
    top: Math.random() * 40 + 5,
  },
  speed: Math.random() * 20 + 15,
  delay: Math.random() * 4,
  size: Math.random() * 20 + 16,
}));

export function Loading() {
  const { projectInfo, generateDocument } = useProject();
  const navigate = useNavigate();
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!projectInfo) {
      navigate(AppRoutes.PROJECT_INFO);
      return;
    }

    // Message rotation with slower transition (4 seconds)
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 4000);

    // Progress bar animation - 10 seconds total
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 100));
    }, 100);

    // Generate document and redirect after 10 seconds
    const generateAndRedirect = async () => {
      try {
        await generateDocument();
        navigate(AppRoutes.SUMMARY);
      } catch (error) {
        console.error('Error generating document:', error);
        navigate(AppRoutes.PROJECT_INFO);
      }
    };

    const redirectTimeout = setTimeout(generateAndRedirect, 10000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
      clearTimeout(redirectTimeout);
    };
  }, [navigate, projectInfo, generateDocument]);

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-primary-50 via-earth-50 to-primary-100 overflow-hidden relative">
      {/* Dense Forest of Trees */}
      {trees.map((tree, index) => (
        <div
          key={`tree-${index}`}
          className="absolute transform-gpu"
          style={{
            left: `${tree.left}%`,
            bottom: `${tree.bottom}%`,
            opacity: 0,
            animation: `growTree 2s ease-out ${tree.delay}s forwards`,
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${tree.size / 2}px solid transparent`,
              borderRight: `${tree.size / 2}px solid transparent`,
              borderBottom: `${tree.size}px solid ${tree.color}`,
              opacity: tree.opacity,
              transform: 'scale(1, 1.2)',
            }}
          />
          <div
            className="mx-auto"
            style={{
              width: `${tree.size / 8}px`,
              height: `${tree.size / 4}px`,
              backgroundColor: '#4B3621', // Brown color for tree trunk
            }}
          />
        </div>
      ))}

      {/* Flying Birds */}
      {birds.map((bird, index) => (
        <div
          key={`bird-${index}`}
          className="absolute transform-gpu"
          style={{
            top: `${bird.startPosition.top}%`,
            left: `${bird.startPosition.left}%`,
            animation: `flyAcross ${bird.speed}s linear ${bird.delay}s infinite`,
            transform: bird.direction === 'left' ? 'scaleX(1)' : 'scaleX(-1)',
          }}
        >
          <div className="relative animate-float">
            <div 
              className="absolute"
              style={{
                width: `${bird.size * 0.8}px`,
                height: `${bird.size * 0.2}px`,
                transform: 'rotate(30deg)',
                borderRadius: '50%',
                backgroundColor: '#2D3748', // Dark gray for birds
              }}
            />
            <div 
              className="absolute"
              style={{
                width: `${bird.size * 0.8}px`,
                height: `${bird.size * 0.2}px`,
                transform: 'rotate(-30deg)',
                borderRadius: '50%',
                backgroundColor: '#2D3748', // Dark gray for birds
              }}
            />
          </div>
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white/20 backdrop-blur-md rounded-xl p-8 shadow-lg border border-white/30">
          <h1 className="text-2xl font-bold text-primary-700 mb-8 min-h-[4rem] transition-all duration-1000 text-center">
            {loadingMessages[messageIndex]}
          </h1>
          
          <div className="bg-white/30 backdrop-blur-sm rounded-xl p-6 mb-6">
            <div className="w-full bg-white/50 rounded-full h-2.5 mb-4">
              <div 
                className="bg-primary-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="text-earth-700 italic text-sm text-center animate-fade-in-up">
              Creating a sustainable future through documentation...
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes growTree {
          0% {
            opacity: 0;
            transform: scale(0) translateY(100px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes flyAcross {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(${birds[0].direction === 'left' ? '120vw' : '-120vw'});
          }
        }
      `}</style>
    </div>
  );
}