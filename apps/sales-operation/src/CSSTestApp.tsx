import React from 'react';
import './styles/TestStyles.css';

// This component uses only basic HTML and CSS classes
const CSSTestApp: React.FC = () => {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '1rem' }}>
        CSS Test App
      </h1>
      
      <p style={{ marginBottom: '2rem', color: '#4b5563' }}>
        This app tests if basic styling works without relying on Tailwind CSS.
      </p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#f9fafb', 
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Inline Styles
          </h2>
          <p>This box uses inline styles for layout and appearance.</p>
        </div>
        
        <div className="test-box">
          <h2 className="test-heading">Class-based Styles</h2>
          <p className="test-text">This box uses CSS classes that should be defined in index.css.</p>
        </div>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Tailwind Test
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <p className="text-blue-800 font-medium">Tailwind Blue</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <p className="text-green-800 font-medium">Tailwind Green</p>
          </div>
          <div className="bg-red-100 p-4 rounded-lg">
            <p className="text-red-800 font-medium">Tailwind Red</p>
          </div>
        </div>
      </div>
      
      {/* Using inline styles instead of style jsx */}
      
      <div>
        <button 
          onClick={() => alert('Button clicked!')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer'
          }}
        >
          Test Button (Inline Style)
        </button>
        
        <button 
          onClick={() => window.location.reload()}
          className="ml-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Reload Page (Tailwind)
        </button>
      </div>
    </div>
  );
};

export default CSSTestApp;
