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

        // Store token
        localStorage.setItem("token", token);

        // Validate token with backend
        const res = await fetch(`${BACKEND}/auth/me`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error("Invalid token");
        }

        // Optional: parse user data if needed
        // const data = await res.json();

        // Redirect immediately (no need for setTimeout)
        window.location.replace("/video");

      } catch (err) {
        console.error("Auth callback error:", err);
        localStorage.removeItem("token");
        window.location.replace("/");
      }
    };

    run();
  }, []);

  return <div>Logging you in...</div>;
}
