import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Video from './pages/Video';
import Chat from './pages/Chat';
import Terms from './pages/Terms';
import AuthCallBack from './pages/CallBack';
import NotFound from './pages/NotFound';
import PrivateRoute from './components/PrivateRoute'; // Import the guard

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
        <Route element={<PrivateRoute />}>
          <Route path="/video" element={<Video />} />
          <Route path="/chat" element={<Chat />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
