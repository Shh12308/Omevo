import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OmevoLogin from './pages/Home';
import TermsOfService from './pages/Terms';
import OmevoChat from './pages/OmevoChat';
import OmevoVideoApp from './pages/OmevoVideoApp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* App Routes */}
        <Route path="/chat" element={<OmevoChat />} />
        <Route path="/video" element={<OmevoVideoApp />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
