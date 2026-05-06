import { useEffect } from "react";
import { BACKEND } from "../utils/api";

export default function AuthCallBack() {
  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        window.location.href = "/video";
        return;
      }

      // Save token
      localStorage.setItem("omevo_token", token);

      try {
        // Check user status
        const res = await fetch(`${BACKEND}/api/user/access`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          window.location.href = "/video";
          return;
        }

        const data = await res.json();

        // NEW USER → go to signup flow
        if (!data.username) {
          window.location.href = "/video";
          return;
        }

        // Kid account
        if (data.is_kid) {
          window.location.href = "/video";
          return;
        }

        // Normal user
        window.location.href = "/video"; // Redirect to /video instead of /

      } catch (err) {
        console.error("AuthCallback error:", err);
        window.location.href = "/video";
      }
    };

    run();
  }, []);

  return <div style={{ color: "white" }}>Logging you in...</div>;
}
