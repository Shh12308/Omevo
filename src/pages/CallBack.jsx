import { useEffect } from "react";
import { BACKEND } from "../utils/api";

export default function AuthCallBack() {
  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

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

        // small delay ensures React paint (fixes white screen cases)
        setTimeout(() => {
          window.location.replace("/video");
        }, 200);

      } catch (err) {
        console.error("Callback error:", err);
        localStorage.removeItem("token");
        window.location.replace("/");
      }
    };

    run();
  }, []);

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 16
    }}>
      Logging you in...
    </div>
  );
}
