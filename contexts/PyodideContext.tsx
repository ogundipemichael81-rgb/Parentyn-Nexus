import React, { createContext, useState, useRef, useCallback, useEffect } from 'react';
import { PYODIDE_WORKER_CODE } from '../services/pyodideWorker';

interface PyodideContextType {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  output: string[];
  plotImage: string | null;
  initialize: () => void;
  runCode: (code: string) => Promise<void>;
  resetEnvironment: () => void;
}

export const PyodideContext = createContext<PyodideContextType | undefined>(undefined);

export const PyodideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [plotImage, setPlotImage] = useState<string | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<any>(null);

  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsReady(false);
    setIsLoading(false);
  }, []);

  const createWorker = useCallback(() => {
    terminateWorker();
    
    // Create worker from blob to avoid file serving issues
    const blob = new Blob([PYODIDE_WORKER_CODE], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;
    setIsLoading(true);
    setError(null);

    worker.onmessage = (event) => {
      const { type, message, error, output: runOutput, image } = event.data;

      switch (type) {
        case 'status':
          // Optional: could expose granular status messages
          console.log('[Pyodide]', message);
          break;
        case 'ready':
          setIsLoading(false);
          setIsReady(true);
          break;
        case 'results':
          // Clear timeout on success
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setIsLoading(false);
          if (runOutput) setOutput(prev => [...prev, runOutput]);
          if (image) setPlotImage(image);
          break;
        case 'error':
           if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          setIsLoading(false);
          setError(error);
          break;
      }
    };

    worker.postMessage({ type: 'init' });
  }, [terminateWorker]);

  const initialize = useCallback(() => {
    if (!workerRef.current) {
      createWorker();
    }
  }, [createWorker]);

  const runCode = useCallback(async (code: string) => {
    if (!workerRef.current) {
      setError("Environment not initialized. Click 'Start Lab' first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setOutput([]);
    setPlotImage(null);

    // Safety Timeout: 10 seconds
    timeoutRef.current = setTimeout(() => {
      terminateWorker();
      setError("Execution timed out (Limit: 10s). Infinite loop detected.");
      // We must restart the worker because we just killed it
      // Don't auto-restart immediately to let user see error
    }, 10000);

    workerRef.current.postMessage({ type: 'run', code });
  }, [terminateWorker]);

  const resetEnvironment = useCallback(() => {
    setOutput([]);
    setPlotImage(null);
    createWorker();
  }, [createWorker]);

  useEffect(() => {
    return () => terminateWorker();
  }, [terminateWorker]);

  return (
    <PyodideContext.Provider value={{
      isReady,
      isLoading,
      error,
      output,
      plotImage,
      initialize,
      runCode,
      resetEnvironment
    }}>
      {children}
    </PyodideContext.Provider>
  );
};