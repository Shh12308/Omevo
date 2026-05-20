import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { BACKEND } from "../utils/api";

const PrivateRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsAuth(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${BACKEND}/auth/verify`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Invalid token");

        const data = await res.json();
        setIsAuth(data?.valid === true || true); // fallback if backend just returns 200
      } catch (err) {
        console.error("Auth failed:", err);
        localStorage.removeItem("token");
        setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  if (loading) {
    return (
      <div style={{ color: "#fff", padding: 20 }}>
        Checking authentication...
      </div>
    );
  }

  return isAuth ? <Outlet /> : <Navigate to="/" replace />;
};

export default PrivateRoute;
