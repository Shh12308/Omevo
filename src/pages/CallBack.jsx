import { useEffect, useState } from "react";
import { BACKEND } from "../utils/api";

export default function AuthCallBack() {
  const [status, setStatus] = useState("Logging you in...");

  useEffect(() => {
    const run = async () => {
      try {
        setStatus("Reading authentication token...");

        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          setStatus("Invalid login link. Redirecting...");
          window.location.replace("/");
          return;
        }

        setStatus("Saving session...");

        localStorage.setItem("token", token);

        setStatus("Verifying user...");

        const res = await fetch(`${BACKEND}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setStatus("Session expired. Redirecting...");
          localStorage.removeItem("token");
          window.location.replace("/");
          return;
        }

        const data = await res.json();

        if (!data?.user) {
          setStatus("Invalid user. Redirecting...");
          window.location.replace("/");
          return;
        }

        setStatus("Login successful! Redirecting...");

        // small delay so user sees success state
        setTimeout(() => {
          window.location.replace("/video");
        }, 500);

      } catch (err) {
        console.error("AuthCallback error:", err);
        setStatus("Something went wrong. Redirecting...");
        localStorage.removeItem("token");

        setTimeout(() => {
          window.location.replace("/");
        }, 800);
      }
    };

    run();
  }, []);

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      fontSize: "16px",
      color: "black",
      background: "white"
    }}>
      <div style={{ marginBottom: 10 }}>
        🔐 Omevo Login
      </div>

      <div>{status}</div>
    </div>
  );
}
