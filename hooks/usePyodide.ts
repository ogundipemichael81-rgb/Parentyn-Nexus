import { useContext } from 'react';
import { PyodideContext } from '../contexts/PyodideContext';

export const usePyodide = () => {
  const context = useContext(PyodideContext);
  
  if (context === undefined) {
    throw new Error('usePyodide must be used within a PyodideProvider');
  }

  return {
    // We map 'isReady' to 'pyodide' boolean presence for API compatibility with request
    pyodide: context.isReady ? true : null, 
    isLoading: context.isLoading,
    error: context.error,
    output: context.output,
    plotImage: context.plotImage,
    initialize: context.initialize,
    runCode: context.runCode,
    resetEnvironment: context.resetEnvironment
  };
};