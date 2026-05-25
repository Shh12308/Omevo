import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallBack() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AuthCallback mounted");

    // Get token from query (?token=...)
    const searchParams = new URLSearchParams(window.location.search);

    // Also support hash (#token=...) just in case
    const hashParams = new URLSearchParams(
      window.location.hash.substring(1)
    );

    const token =
      searchParams.get("token") || hashParams.get("token");

    console.log("URL:", window.location.href);
    console.log("Token found:", token);

    if (!token) {
      console.error("❌ Missing token in callback URL");

      // Small delay to ensure navigation works reliably
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);

      return;
    }

    try {
      // Save token
      localStorage.setItem("token", token);

      console.log("✅ Token saved to localStorage");

      // Optional: verify it's actually stored
      const stored = localStorage.getItem("token");
      console.log("Stored token:", stored);

      // Redirect to app
      setTimeout(() => {
        navigate("/video", { replace: true });
      }, 100);
    } catch (err) {
      console.error("❌ Auth callback error:", err);

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    }
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Signing you in...</h2>
      <p>Please wait while we log you in.</p>
    </div>
  );
}
