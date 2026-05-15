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
    const provider = params.get("provider") || "discord";

    const login = async () => {
      try {
        if (error) {
          console.error("OAuth error:", error);
          navigate("/");
          return;
        }

        if (!code) {
          console.error("Missing code");
          navigate("/");
          return;
        }

        const res = await axios.post(`${BACKEND}/auth/callback`, {
          code,
          provider,
        });

        const token = res.data?.token;

        if (!token) {
          console.error("No token returned from backend");
          navigate("/");
          return;
        }

        localStorage.setItem("token", token);
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
