'use client';

import React, { useState, useEffect } from 'react';
import { Play, RotateCw, Clock, Coffee, Package, FileCode, Cog, Info, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const DockerCacheDemo = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [buildCount, setBuildCount] = useState(-1);
  const [showIntro, setShowIntro] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [stepProgress, setStepProgress] = useState<Record<number, number>>({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showTooltip, setShowTooltip] = useState<number | null>(null);
  const [firstBuildTime, setFirstBuildTime] = useState<number | null>(null);
  const [showLearnMore, setShowLearnMore] = useState(false);
  
  const steps = [
    { 
      name: 'Find and subscribe to a recipe & cooking guide app', 
      icon: Coffee,
      explanation: 'Finding and subscribing to a recipe & cooking guide app',
      cacheExplanation: 'This can be cached because the recipe & cooking guide app (application structure) stays the same between builds',
      cacheable: true, 
      baseTime: 6
    },
    { 
      name: 'Check ingredients list', 
      icon: Package,
      explanation: 'Looking at what ingredients we need',
      cacheExplanation: 'The ingredients list (package.json) rarely changes, so we can cache it',
      cacheable: true, 
      baseTime: 4 
    },
    { 
      name: 'Buy ingredients', 
      icon: Cog,
      explanation: 'Go out and buy all the ingredients from the store',
      cacheExplanation: 'Once we have our ingredients (dependencies), we can reuse them',
      cacheable: true, 
      baseTime: 7 
    },
    { 
      name: 'Review recipe updates', 
      icon: FileCode,
      explanation: 'Checking if any steps have changed, like how long you should leave it to simmer',
      cacheExplanation: "We can't cache this because our recipe (code) changes frequently",
      cacheable: false, 
      baseTime: 4 
    },
    { 
      name: 'Cook the meal', 
      icon: Cog,
      explanation: 'Following the recipe to make the dish',
      cacheExplanation: "We need to cook (build) fresh each time to ensure everything's correct",
      cacheable: false, 
      baseTime: 3 
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning && currentStepIndex === -1 && buildCount === 0) {
      setFirstBuildTime(elapsedTime);
    }
  }, [isRunning, currentStepIndex, buildCount, elapsedTime]);

  const getStepTime = (step: { cacheable: boolean; baseTime: number }, index: number) => {
    if (!step.cacheable) return step.baseTime;
    
    if (buildCount < 0) return step.baseTime;
    
    if (index === 2 && (buildCount + 1) % 2 === 0) {
      return step.baseTime;
    }
    
    return 0.5;
  };

  const runStep = async (stepIndex: number) => {
    return new Promise((resolve) => {
      const step = steps[stepIndex];
      const duration = getStepTime(step, stepIndex);
      let startTime = Date.now();
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        
        setStepProgress(prev => ({
          ...prev,
          [stepIndex]: progress
        }));

        if (progress < 1) {
          requestAnimationFrame(updateProgress);
        } else {
          resolve(void 0);
        }
      };

      requestAnimationFrame(updateProgress);
    });
  };

  const runBuild = async () => {
    if (isRunning) return;
    
    setShowIntro(false);
    setIsRunning(true);
    setElapsedTime(0);
    setStepProgress({});

    for (let i = 0; i < steps.length; i++) {
      setCurrentStepIndex(i);
      await runStep(i);
    }

    if (buildCount === -1) {
      setFirstBuildTime(elapsedTime);
    }
    
    setCurrentStepIndex(-1);
    setIsRunning(false);
    setBuildCount(prev => prev + 1);
  };

  const resetBuilds = () => {
    setBuildCount(-1);
    setShowIntro(true);
    setIsRunning(false);
    setCurrentStepIndex(-1);
    setStepProgress({});
    setElapsedTime(0);
    setFirstBuildTime(null);
  };

  const getAttemptText = () => {
    if (buildCount === -1) return "Meal hasn't been made yet";
    return `Meals cooked: ${Number(buildCount + 1)}`;
  };

  const IntroMessage = () => (
    <div className="bg-blue-50 p-4 rounded-lg mb-6">
      <h3 className="font-medium mb-2">👋 Let's learn about caching</h3>
      <p className="text-sm mb-4">
        Imagine you're planning on finding and cooking the same meal multiple times. The first time you need to:
      </p>
      <ol className="text-sm mb-4 list-decimal pl-6 space-y-1">
        <li>Find and subscribe to an app</li>
        <li>Check what ingredients you need</li>
        <li>Buy all the ingredients</li>
        <li>Review recipe updates</li>
        <li>Cook the meal</li>
      </ol>
      <p className="text-sm">
        The next time you make the same meal, you already have the app and ingredients — 
        that's like caching! You only need to read the recipe and cook.
      </p>
    </div>
  );

  const LearnMoreSection = () => (
    <div className="mt-6 bg-gray-50 p-4 rounded-lg text-sm">
      <h3 className="font-medium mb-2">💡 Docker Layer Caching</h3>
      <div className="space-y-2">
        <p>Docker builds images in layers, each layer representing a command in your Dockerfile:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Copying package.json first and installing dependencies in a separate layer means you won't re-install packages unless dependencies change</li>
          <li>Copying source code in later layers ensures code changes don't invalidate dependency cache</li>
          <li>Using multi-stage builds keeps final images small while maintaining build caching benefits</li>
          <li>Layer order matters - put rarely changing steps first for optimal caching</li>
        </ul>
      </div>
    </div>
  );

  const isStepCached = (step: { cacheable: boolean }, index: number) => {
    if (!step.cacheable) return false;
    if (buildCount < 0) return false;
    if (index === 2 && (buildCount + 1) % 2 === 0) return false;
    return true;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🐧 Penguins Culinary School of Caching 🐧</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLearnMore(!showLearnMore)}
              className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
              title="Learn more about caching"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={runBuild}
              disabled={isRunning}
              className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              title="Run another build"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={resetBuilds}
              disabled={isRunning}
              className="p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
              title="Start over"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </CardTitle>
        {buildCount >= 0 && (buildCount + 1) % 2 === 0 && (
          <div className="mt-4 bg-yellow-50 p-3 rounded-lg text-sm">
            <p className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Oops! We ran out of ingredients (dependencies changed) — this will invalidate our ingredients cache. Need to go shopping again! 🛒
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {showIntro && <IntroMessage />}
        
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-lg font-medium">{getAttemptText()}</span>
              {buildCount > 0 && firstBuildTime !== null && (
                <div className="text-sm text-green-600 mt-1">
                  Time saved: {Math.max(0, firstBuildTime - elapsedTime).toFixed(1)}s! 🚀
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-lg font-medium">{elapsedTime.toFixed(1)}s</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isCached = isStepCached(step, index);
              const isCurrentStep = index === currentStepIndex;
              const progress = stepProgress[index] || 0;
              const Icon = step.icon;
              
              return (
                <div key={index} className="relative">
                  <div 
                    className="flex items-center gap-2 mb-1"
                    onMouseEnter={() => setShowTooltip(index)}
                    onMouseLeave={() => setShowTooltip(null)}
                  >
                    <Icon className={`w-4 h-4 ${isCurrentStep ? 'animate-pulse' : ''}`} />
                    <span className="font-medium">{step.name}</span>
                    <span className="text-sm text-gray-500">
                      ({getStepTime(step, index)}s)
                    </span>
                    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    
                    {showTooltip === index && (
                      <div className="absolute left-0 top-8 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-10 text-sm max-w-xs">
                        {step.cacheExplanation}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mb-1">{step.explanation}</div>
                  <div className="h-6 w-full bg-gray-200 rounded overflow-hidden">
                    <div
                      className={`h-full transition-transform ${
                        isCached ? 'bg-green-500' : 'bg-blue-500'
                      } ${isCurrentStep ? 'animate-pulse' : ''}`}
                      style={{
                        width: `${progress * 100}%`
                      }}
                    />
                  </div>
                  {progress === 1 && isCached && (
                    <div className="absolute right-2 top-8 bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                      Already done! ✨
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {!isRunning && currentStepIndex === -1 && !showIntro && buildCount === -1 && (
            <div className="mt-4 bg-yellow-50 p-4 rounded-lg text-sm">
              <p>👆 Press the blue play button to start the first build!</p>
            </div>
          )}
          
          {!isRunning && currentStepIndex === -1 && buildCount === 0 && (
            <div className="mt-4 bg-green-50 p-4 rounded-lg text-sm">
              <p>Time to eat! Now press play again to see how caching speeds up our second cook (build)! 🚀</p>
            </div>
          )}
          
          {buildCount === 1 && !isRunning && (
            <div className="mt-4 bg-blue-50 p-4 rounded-lg text-sm">
              <p>See how much faster that was? (The green bars show which steps were cached) 🎉</p>
            </div>
          )}
        </div>

        {showLearnMore && <LearnMoreSection />}
      </CardContent>
    </Card>
  );
};

export default DockerCacheDemo;