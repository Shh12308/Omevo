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
      navigate("/");
      return;
    }

    if (!token) {
      console.error("Missing token");
      navigate("/");
      return;
    }

    try {
      // store token
      localStorage.setItem("token", token);

      // optional: set default header for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      navigate("/video");
    } catch (err) {
      console.error("Auth failed:", err);
      navigate("/");
    }
  }, [navigate, params]);

  return <p>Signing you in...</p>;
}
