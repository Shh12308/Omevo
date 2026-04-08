import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OmevoLogin from './components/OmevoLogin';
import TermsOfService from './components/TermsOfService';
import OmevoChat from './components/OmevoChat';
import OmevoVideoApp from './components/OmevoVideoApp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<OmevoLogin />} />
        <Route path="/terms" element={<TermsOfService />} />
        
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
