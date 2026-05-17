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
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          window.location.replace("/");
          return;
        }

        setTimeout(() => {
          window.location.replace("/video");
        }, 200);

      } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        window.location.replace("/");
      }
    };

    run();
  }, []);

  return <div>Logging you in...</div>;
}
