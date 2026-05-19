import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-blue-600">Test Page</h1>
      <p className="mt-2 text-gray-600">
        If you can see this, basic rendering is working correctly.
      </p>
    </div>
  );
};

export default TestPage;
