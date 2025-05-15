import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // This will parse the URL and update the session if needed
    supabase.auth.getSession().then(({ data, error }) => {
      // Optionally handle errors or update your app state
      navigate("/"); // Redirect to home or dashboard
    });
  }, [navigate]);

  return <div>Confirming your email, please wait...</div>;
}