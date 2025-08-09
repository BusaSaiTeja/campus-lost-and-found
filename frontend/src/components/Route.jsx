import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "../pages/Navbar";
import API from "../api";

export default function ProtectedRoute({ children }) {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        console.log("Verifying auth...");
        const res = await API.get("/api/verify_token", { withCredentials: true });
        console.log("Auth verified:", res.data);
        setIsAuth(true);
      } catch (err) {
        console.log("Auth failed:", err.response?.status || err.message);
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
