import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// Simple Home component
const Home = () => (
  <div className="p-8 bg-white rounded-xl shadow-md">
    <h1 className="text-2xl font-bold text-blue-600 mb-4">Home Page</h1>
    <p className="text-gray-600 mb-4">This is a simple home page to test routing.</p>
    <div className="flex space-x-4">
      <Link to="/about" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Go to About
      </Link>
      <Link to="/dashboard" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        Go to Dashboard
      </Link>
    </div>
  </div>
);

// Simple About component
const About = () => (
  <div className="p-8 bg-white rounded-xl shadow-md">
    <h1 className="text-2xl font-bold text-green-600 mb-4">About Page</h1>
    <p className="text-gray-600 mb-4">This is a simple about page to test routing.</p>
    <Link to="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      Go Home
    </Link>
  </div>
);

// Simple Dashboard component
const Dashboard = () => (
  <div className="p-8 bg-white rounded-xl shadow-md">
    <h1 className="text-2xl font-bold text-purple-600 mb-4">Dashboard</h1>
    <p className="text-gray-600 mb-4">This is a simple dashboard to test routing.</p>
    <Link to="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      Go Home
    </Link>
  </div>
);

// Main App with Router
const SimpleRoutingApp: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 p-4 bg-yellow-100 rounded-lg">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">React Router Test App</h2>
        <p className="text-yellow-700">
          This app tests if React Router is working properly. Try clicking the links below.
        </p>
      </div>

      <BrowserRouter>
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <nav className="flex space-x-4">
            <Link to="/" className="text-blue-600 hover:underline">Home</Link>
            <Link to="/about" className="text-blue-600 hover:underline">About</Link>
            <Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
          </nav>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
};

export default SimpleRoutingApp;
