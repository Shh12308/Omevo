import { useEffect } from 'react';
import { BACKEND } from "../utils/api";

export default function AuthCallBack() {
  useEffect(() => {
    const run = async () => {
      try {
        console.log("Auth callback mounted");

        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        console.log("Token:", token);

        if (!token) {
          window.location.href = "/";
          return;
        }

        localStorage.setItem("token", token);

        const res = await fetch(`${BACKEND}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Status:", res.status);

        if (!res.ok) {
          localStorage.removeItem("token");
          window.location.href = "/";
          return;
        }

        const data = await res.json();
        console.log("User:", data);

        // HARD REDIRECT (removes any routing issues)
        window.location.replace("/video");

      } catch (err) {
        console.error("Callback error:", err);
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    };

    run();
  }, []);

  return (
    <div style={{ color: "black", padding: 20 }}>
      Logging you in...
    </div>
  );
}
