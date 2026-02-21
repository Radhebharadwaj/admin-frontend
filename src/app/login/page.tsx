"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const { sessionToken, setSessionToken } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionToken(session.access_token);
        router.push("/admin");
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSessionToken(session.access_token);
        router.push("/admin");
      } else {
        setSessionToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, setSessionToken]);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: \`\${window.location.origin}/login\`,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 p-8 rounded-xl text-center shadow-2xl">
        <h1 className="text-2xl font-bold mb-2">QuduHub Command Center</h1>
        <p className="text-gray-400 mb-8">Strictly Internal Access Only.</p>
        
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
        >
          <LogIn size={20} />
          Login with Google
        </button>
      </div>
    </div>
  );
}
