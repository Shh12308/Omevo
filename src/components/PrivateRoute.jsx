// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  // Check if token exists in localStorage
  const token = localStorage.getItem('token');

  // If token exists, render the child route (Outlet)
  // If not, redirect to Home page
  return token ? <Outlet /> : <Navigate to="/" replace />;
};

export default PrivateRoute;
