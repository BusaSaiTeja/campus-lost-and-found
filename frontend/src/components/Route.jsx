import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "../pages/Navbar";
import API from "../api";

export default function ProtectedRoute({ children }) {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await API.get("/api/verify_token"); // cookies sent automatically
        setIsAuth(true);
      } catch {
        setIsAuth(false);
      }
    };
    verifyAuth();
  }, []);

  if (isAuth === null) return <div>Loading...</div>;
  if (!isAuth) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
