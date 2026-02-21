export const runtime = "edge";
"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { swrFetcher } from "@/lib/api";
import { ArrowLeft, BookOpen, Download, Loader2, Lock, Shield } from "lucide-react";
import Link from "next/link";
import { useRazorpay } from "@/lib/useRazorpay";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Resource {
  id: string;
  subject_id: string;
  chapter_id: string | null;
  category: string;
  title: string;
  is_public: number;
  price_in_inr: number;
  content_type: string;
  r2_object_key: string | null;
  external_url: string | null;
  rich_text_content: string | null;
  is_purchased?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://admin-backend.pixraglobal.workers.dev";
const R2_URL = process.env.NEXT_PUBLIC_R2_URL || "https://pub-[your-id].r2.dev"; // Placeholder

export default function UniversalReaderPage() {
  const params = useParams();
  const router = useRouter();
  const resourceId = params.resourceId as string;

  const { data: resource, isLoading, mutate } = useSWR<Resource>(
    `/api/resources/${resourceId}`,
    swrFetcher
  );
  const isRazorpayLoaded = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUnlock = async () => {
    if (!isRazorpayLoaded) {
      alert("Payment system is loading, please try again in a moment.");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/auth");
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch(`${API_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ resource_id: resourceId })
      });

      const orderData = await res.json();
      if (!orderData.success) throw new Error(orderData.message);

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: "INR",
        name: "QuduHub Premium",
        description: `Unlock ${resource?.title}`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${API_URL}/api/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                resource_id: resourceId
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              mutate();
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            console.error(err);
            alert("Error verifying payment.");
          }
        },
        prefill: {
          name: session.user.user_metadata?.name || "",
          email: session.user.email || "",
        },
        theme: {
          color: "#6366f1",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        console.error(response.error);
        alert(response.error.description);
      });
      rzp.open();

    } catch (err: any) {
      alert(err.message || "Failed to initiate payment");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 min-h-screen">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950 min-h-screen">
        <h2 className="text-xl font-bold text-white mb-2">Resource Not Found</h2>
        <p className="text-zinc-400">The content you are looking for does not exist.</p>
        <button onClick={() => router.back()} className="mt-4 text-indigo-400 hover:text-indigo-300">
          Go Back
        </button>
      </div>
    );
  }

  const renderContent = () => {
    if (resource.is_purchased === false) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-zinc-950 min-h-screen">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-zinc-700 shadow-inner">
              <Lock className="w-8 h-8 text-indigo-400" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">Premium Content</h3>
            <p className="text-zinc-400 mb-8 text-sm">
              This resource is locked. Purchase it to instantly unlock full access to this premium learning material.
            </p>
            
            <button 
              onClick={handleUnlock}
              disabled={isProcessing}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Unlock for ₹{resource.price_in_inr}</span>}
            </button>
            
            <p className="text-xs text-zinc-500 mt-4 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" /> Secure payment via Razorpay
            </p>
          </div>
        </div>
      );
    }

    switch (resource.content_type) {
      case "external_url":
        const proxyUrl = `${API_URL}/api/proxy-resource?id=${resource.id}`;
        return (
          <iframe 
            src={proxyUrl} 
            className="w-full h-[calc(100vh-4rem)] border-0 bg-white" 
            title={resource.title}
          />
        );
      
      case "r2_upload":
        if (!resource.r2_object_key) return <div className="p-8 text-center text-zinc-500">File missing.</div>;
        
        const fileUrl = `${R2_URL}/${resource.r2_object_key}`;
        const isVideo = resource.r2_object_key.endsWith('.mp4') || resource.r2_object_key.endsWith('.webm');
        
        if (isVideo) {
          return (
            <div className="max-w-5xl mx-auto p-4 sm:p-8">
              <video 
                controls 
                controlsList="nodownload"
                className="w-full h-auto bg-black rounded-xl shadow-2xl border border-zinc-800"
                src={fileUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          );
        } else {
          // Assume PDF for other files
          return (
            <object 
              data={fileUrl} 
              type="application/pdf" 
              className="w-full h-[calc(100vh-4rem)] border-0"
            >
              <div className="p-8 text-center text-zinc-400">
                <p>Unable to display PDF directly.</p>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline mt-2 inline-block">
                  Download PDF instead
                </a>
              </div>
            </object>
          );
        }

      case "internal_module":
        return (
          <div className="max-w-3xl mx-auto p-6 sm:p-12">
            <div className="prose prose-invert prose-indigo prose-lg max-w-none prose-headings:font-semibold prose-a:text-indigo-400" 
                 dangerouslySetInnerHTML={{ __html: resource.rich_text_content || "" }} 
            />
          </div>
        );

      default:
        return (
          <div className="p-8 text-center text-zinc-500">
            Unknown content type.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Reader Navbar */}
      <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-zinc-800 hidden sm:block"></div>
          <h1 className="text-sm sm:text-base font-semibold text-white line-clamp-1">
            {resource.title}
          </h1>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 uppercase tracking-wider ml-2">
            {resource.category.replace("_", " ")}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {resource.content_type === "internal_module" && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-sm font-medium transition-colors border border-indigo-500/20">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
          )}
        </div>
      </header>

      {/* Reader Body */}
      <main className="flex-1 w-full bg-zinc-950 overflow-hidden relative">
        {renderContent()}
      </main>
    </div>
  );
}
