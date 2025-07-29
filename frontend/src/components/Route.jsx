import React from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../pages/Navbar';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
