import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Video from './pages/Video';
import Chat from './pages/Chat';
import Terms from './pages/Terms';
import AuthCallBack from './components/CallBack';
import NotFound from './pages/NotFound';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/video" element={<Video />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/auth/callback" element={<AuthCallBack />} />
        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
