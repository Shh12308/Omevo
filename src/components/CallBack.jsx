import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BACKEND } from "../utils/api"; // 👈 important

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    const error = params.get("error");
    const provider = params.get("provider"); // optional

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
        const res = await api.post("/auth/callback", {
          code,
          provider, // send if backend supports multiple providers
        });

        // Save token (or skip if using cookies)
        if (res.data?.token) {
          localStorage.setItem("token", res.data.token);
        }

        // 🚀 Redirect to video page
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
