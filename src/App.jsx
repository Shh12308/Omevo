import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Video from './pages/Video';
import Chat from './pages/Chat';
import Terms from './pages/Terms';
import AuthCallBack from './components/AuthCallBack';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* This handles the redirect from your backend */}
        <Route path="/auth/callback" element={<AuthCallBack />} />

        {/* Protected Routes (Requires Token) */}
        
          <Route path="/video" element={<Video />} />
          <Route path="/chat" element={<Chat />} />
        

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
