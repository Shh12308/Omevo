import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      console.error("OAuth error:", error);
      navigate("/");
      return;
    }

    if (!token) {
      console.error("Missing token");
      navigate("/");
      return;
    }

    localStorage.setItem("token", token);
    navigate("/video");
  }, [navigate, params]);

  return <p>Signing you in...</p>;
}
