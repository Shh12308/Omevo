import { useEffect, useState } from "react";

export default function AuthCallback() {
  const [status, setStatus] = useState("Logging you in...");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("Missing token, redirecting...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
        return;
      }

      // Store token
      localStorage.setItem("token", token);

      setStatus("Success! Redirecting...");

      // Small delay so user sees success state
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);

    } catch (err) {
      console.error("Auth callback error:", err);
      setStatus("Something went wrong, redirecting...");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1200);
    }
  }, []);

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      fontFamily: "Arial"
    }}>
      <h2>🔐 Authentication</h2>
      <p>{status}</p>
    </div>
  );
}
