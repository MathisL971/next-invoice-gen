"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Lazy initialize Supabase client to avoid build-time errors
  const [supabase] = useState(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  });

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        setMessage(error.message);
        toast.error("Failed to send OTP", {
          description: error.message,
        });
        setLoading(false);
      } else {
        setMessage("Check your email for the OTP code!");
        toast.success("OTP sent!", {
          description: "Check your email for the verification code",
        });
        setStep("otp");
        setLoading(false);
      }
    } catch (err) {
      console.error("Unexpected error sending OTP:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setMessage(errorMessage);
      toast.error("Failed to send OTP", {
        description: errorMessage,
      });
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) {
        setMessage(error.message);
        toast.error("Invalid OTP", {
          description: error.message,
        });
        setLoading(false);
        return;
      }

      // Check session first to ensure it's established
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("Error getting session:", sessionError);
        setMessage("Authentication successful but session not established");
        toast.error("Session error", {
          description: sessionError?.message || "Failed to establish session",
        });
        setLoading(false);
        return;
      }

      // Get user from session
      const user = session.user;

      if (user) {
        try {
          const { error: profileError } = await supabase
            .from("profiles")
            .upsert({
              id: user.id,
              email: user.email,
              updated_at: new Date().toISOString(),
            });

          if (profileError) {
            console.error("Error creating profile:", profileError);
            // Don't block the login flow if profile creation fails
          }
        } catch (profileErr) {
          console.error("Unexpected error creating profile:", profileErr);
          // Don't block the login flow
        }
      }

      toast.success("Signed in successfully!");
      // Use window.location.replace to avoid back button issues
      window.location.replace("/dashboard");
    } catch (err) {
      console.error("Unexpected error during OTP verification:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setMessage(errorMessage);
      toast.error("Verification failed", {
        description: errorMessage,
      });
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white dark:bg-zinc-900 p-8 shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {step === "email"
              ? "We'll send you a verification code to sign in"
              : "Enter the verification code sent to your email"}
          </p>
        </div>

        {step === "email" ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            {message && (
              <div
                className={`rounded-md p-4 ${
                  message.includes("Check your email")
                    ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                    : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                }`}
              >
                <p className="text-sm">{message}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send verification code"}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Verification code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-zinc-800 px-3 py-2 text-center text-2xl tracking-widest text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="000000"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Code sent to {email}
              </p>
            </div>

            {message && (
              <div
                className={`rounded-md p-4 ${
                  message.includes("Check your email")
                    ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                    : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                }`}
              >
                <p className="text-sm">{message}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setMessage("");
                }}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Change email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
