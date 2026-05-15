import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { BACKEND } from "../utils/api";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
  const token = params.get("token");
  const error = params.get("error");

  if (error) {
    console.error("OAuth error:", error);
    return navigate("/");
  }

  if (!token) {
    console.error("Missing token");
    return navigate("/");
  }

  localStorage.setItem("token", token);
  navigate("/video");
}, [navigate, params]);

    login();
  }, [navigate, params]);

  return <p>Signing you in...</p>;
}
