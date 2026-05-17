import { useEffect } from "react";
import { BACKEND } from "../utils/api";

export default function AuthCallBack() {
  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        window.location.href = "/";
        return;
      }

      // ✅ Save token
      localStorage.setItem("token", token);

      try {
        // ✅ Get user (should auto-create if new)
        const res = await fetch(`${BACKEND}/api/user/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          window.location.href = "/";
          return;
        }

        const data = await res.json();

        // 👶 Kid account
        if (data.is_kid) {
          window.location.href = "/kids";
          return;
        }

        // ✅ Normal user (new OR existing)
        window.location.href = "/video";

      } catch (err) {
        console.error("AuthCallback error:", err);
        window.location.href = "/";
      }
    };

    run();
  }, []);

  return <div style={{ color: "white" }}>Logging you in...</div>;
}
