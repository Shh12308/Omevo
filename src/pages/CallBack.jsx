import { useEffect } from "react";
import { BACKEND } from "../utils/api";

export default function AuthCallBack() {
  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        // ❌ No token → go home
        if (!token) {
          window.location.href = "/";
          return;
        }

        // ✅ Save token
        localStorage.setItem("token", token);

        // ✅ Fetch user
        const res = await fetch(`${BACKEND}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // ❌ Invalid token
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/";
          return;
        }

        const data = await res.json();
        const user = data.user;

        // ❌ No user returned
        if (!user) {
          window.location.href = "/";
          return;
        }

        // 👶 Kid account
        if (user.is_kid) {
          window.location.href = "/kids";
          return;
        }

        // ✅ Normal user
        window.location.href = "/video";

      } catch (err) {
        console.error("AuthCallback error:", err);
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    };

    run();
  }, []);

  return <div style={{ color: "white" }}>Logging you in...</div>;
}
