import { useEffect } from "react";
import { BACKEND } from "../utils/api";

export default function AuthCallBack() {
  useEffect(() => {
    const run = async () => {
      try {
        const token = new URLSearchParams(window.location.search).get("token");

        if (!token) {
          window.location.replace("/");
          return;
        }

        localStorage.setItem("token", token);

        const res = await fetch(`${BACKEND}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          window.location.replace("/");
          return;
        }

        // ✅ HARD REDIRECT (no React router issues)
        window.location.replace("/video");

      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        window.location.replace("/");
      }
    };

    run();
  }, []);

  return (
    <div style={{
      color: "white",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      Logging you in...
    </div>
  );
}
