import React from 'react';

const MinimalApp: React.FC = () => {
  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-blue-600">Minimal App</h1>
      <p className="mt-2 text-gray-600">
        This is a minimal app component to test if basic rendering works.
      </p>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-700">Debug Info:</h2>
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          <li>React is loaded: {typeof React !== 'undefined' ? '✅' : '❌'}</li>
          <li>Window object: {typeof window !== 'undefined' ? '✅' : '❌'}</li>
          <li>Document object: {typeof document !== 'undefined' ? '✅' : '❌'}</li>
          <li>LocalStorage: {
            (() => {
              try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return '✅';
              } catch (e) {
                return `❌ (${e instanceof Error ? e.message : String(e)})`;
              }
            })()
          }</li>
        </ul>
      </div>
    </div>
  );
};

export default MinimalApp;
