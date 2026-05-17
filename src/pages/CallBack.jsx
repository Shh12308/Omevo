import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // useNavigate is cleaner than window.location
import { BACKEND } from "../utils/api";

export default function AuthCallBack() {
  const [status, setStatus] = useState("Verifying authentication...");
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          console.error("No token found in URL");
          setStatus("Authentication failed: No token found.");
          setTimeout(() => navigate("/"), 2000);
          return;
        }

        // 1. Store the token
        localStorage.setItem("token", token);
        setStatus("Session established. Fetching profile...");

        // 2. Verify with backend
        const res = await fetch(`${BACKEND}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // If verification fails, clear storage and redirect
          localStorage.removeItem("token");
          setStatus("Session invalid. Redirecting to login...");
          setTimeout(() => navigate("/"), 2000);
          return;
        }

        const data = await res.json();

        // 3. Success - Redirect to Video
        setStatus(`Welcome back, ${data.user?.username || 'User'}!`);
        
        // Short delay for UX, then redirect
        setTimeout(() => {
          navigate("/video");
        }, 500);

      } catch (err) {
        console.error("AuthCallback error:", err);
        setStatus("An error occurred. Redirecting...");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/"), 2000);
      }
    };

    run();
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>🔐 Omevo</h2>
        <p>{status}</p>
        {/* Optional: Add a loading spinner here */}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    backgroundColor: "#f0f2f5",
    color: "#333"
  },
  card: {
    background: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    textAlign: "center"
  }
};
