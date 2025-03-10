"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SSOCallback() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to home page after a brief delay
    const timer = setTimeout(() => {
      router.push('/');
    }, 100);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Completing authentication...</p>
    </div>
  );
}