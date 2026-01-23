import React, { useEffect, useState } from 'react';

const DiagnosticApp: React.FC = () => {
  const [errors, setErrors] = useState<string[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [loadedModules, setLoadedModules] = useState<string[]>([]);

  // Capture console errors
  useEffect(() => {
    const originalConsoleError = console.error;
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    
    console.error = (...args: any[]) => {
      setErrors(prev => [...prev, `ERROR: ${args.map(arg => String(arg)).join(' ')}`]);
      originalConsoleError.apply(console, args);
    };
    
    console.log = (...args: any[]) => {
      setConsoleOutput(prev => [...prev, `LOG: ${args.map(arg => String(arg)).join(' ')}`]);
      originalConsoleLog.apply(console, args);
    };
    
    console.warn = (...args: any[]) => {
      setConsoleOutput(prev => [...prev, `WARN: ${args.map(arg => String(arg)).join(' ')}`]);
      originalConsoleWarn.apply(console, args);
    };
    
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    // Check for common modules
    const modules = [
      { name: 'React', check: () => typeof React !== 'undefined' },
      { name: 'ReactDOM', check: () => typeof (window as any).ReactDOM !== 'undefined' },
      { name: 'React Router', check: () => {
        try {
          // Try to access a known React Router export
          return typeof require('react-router-dom').BrowserRouter !== 'undefined';
        } catch (e) {
          return false;
        }
      }},
      { name: 'Tailwind CSS', check: () => {
        // Check if a Tailwind class exists in the document
        const testEl = document.createElement('div');
        testEl.className = 'bg-blue-500';
        document.body.appendChild(testEl);
        const computed = window.getComputedStyle(testEl);
        const hasTailwind = computed.backgroundColor !== '';
        document.body.removeChild(testEl);
        return hasTailwind;
      }}
    ];
    
    setLoadedModules(
      modules
        .filter(module => {
          try {
            return module.check();
          } catch (e) {
            return false;
          }
        })
        .map(module => module.name)
    );
    
    // Try to trigger an error to see if error boundaries work
    setTimeout(() => {
      try {
        const nonExistentFunction = (window as any).nonExistentFunction;
        if (typeof nonExistentFunction === 'function') {
          nonExistentFunction();
        }
      } catch (e) {
        console.error('Test error triggered:', e);
      }
    }, 1000);
    
    return () => {
      console.error = originalConsoleError;
      console.log = originalConsoleLog;
      console.warn = originalConsoleWarn;
    };
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-blue-600">Diagnostic App</h1>
      <p className="mt-2 text-gray-600">
        This app will help diagnose rendering issues.
      </p>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-red-50 rounded-lg">
          <h2 className="text-lg font-semibold text-red-700">Errors:</h2>
          {errors.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No errors detected</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-red-600 max-h-40 overflow-auto">
              {errors.map((error, index) => (
                <li key={index} className="p-1 border-b border-red-200">
                  {error}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-700">Environment:</h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            <li>Window size: {windowSize.width} x {windowSize.height}</li>
            <li>User Agent: {navigator.userAgent}</li>
            <li>Document ready state: {document.readyState}</li>
            <li>Root element exists: {document.getElementById('root') ? '✅' : '❌'}</li>
            <li>
              LocalStorage: {
                (() => {
                  try {
                    localStorage.setItem('test', 'test');
                    localStorage.removeItem('test');
                    return '✅';
                  } catch (e) {
                    return `❌ (${e instanceof Error ? e.message : String(e)})`;
                  }
                })()
              }
            </li>
          </ul>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <h2 className="text-lg font-semibold text-green-700">Loaded Modules:</h2>
          {loadedModules.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No modules detected</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {loadedModules.map((module, index) => (
                <li key={index} className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span> {module}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-700">Console Output:</h2>
          {consoleOutput.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No console output</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-gray-600 max-h-40 overflow-auto">
              {consoleOutput.map((output, index) => (
                <li key={index} className="p-1 border-b border-yellow-200">
                  {output}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-700">DOM Structure:</h2>
        <pre className="mt-2 text-xs text-gray-600 p-2 bg-gray-100 rounded overflow-auto max-h-40">
          {document.documentElement.outerHTML.substring(0, 500) + '...'}
        </pre>
      </div>
      
      <div className="mt-6 flex justify-center">
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};

export default DiagnosticApp;
