import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallBack() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      console.error("Missing token in callback URL");
      navigate("/");
      return;
    }

    try {
      localStorage.setItem("token", token);
      console.log("Token saved");
      navigate("/video");
    } catch (err) {
      console.error("Auth callback error:", err);
      navigate("/");
    }
  }, [navigate]);

  return <div>Signing you in...</div>;
}
