import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/Route';
import UploadItem from './pages/UploadItem';
import MyUploads from './pages/MyUploads';
import MyChats from './pages/MyChats';
import Profile from './pages/Profile';
import Navbar from './pages/Navbar';
import ChatWindow from './pages/ChatWindow';

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadItem />
            </ProtectedRoute>
          }
        />
        <Route
          path="/myuploads"
          element={
            <ProtectedRoute>
              <MyUploads />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mychats"
          element={
            <ProtectedRoute>
              <MyChats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/chat/:chatId" element={<ChatWindow />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
