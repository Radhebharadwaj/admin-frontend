"use client";

import { useEffect, useState } from "react";

export function useRazorpay() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => {
      console.error("Razorpay SDK failed to load");
      setIsLoaded(false);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup not strictly necessary for third-party scripts, but good practice
    };
  }, []);

  return isLoaded;
}
