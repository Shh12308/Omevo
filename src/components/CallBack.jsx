import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { BACKEND } from "../utils/api";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    const error = params.get("error");
    const provider = params.get("provider");

    if (error) {
      console.error("OAuth error:", error);
      return navigate("/");
    }

    if (!code) {
      console.error("Missing code");
      return navigate("/");
    }

    const login = async () => {
      try {
        const res = await axios.post(`${BACKEND}/auth/callback`, {
          code,
          provider,
        });

        if (res.data?.token) {
          localStorage.setItem("token", res.data.token);
        }

        navigate("/video");
      } catch (err) {
        console.error("Auth failed:", err);
        navigate("/");
      }
    };

    login();
  }, [navigate, params]);

  return <p>Signing you in...</p>;
}
