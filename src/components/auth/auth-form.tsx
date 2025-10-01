"use client";

import {
  IconAlertCircle,
  IconLoader2,
  IconMail,
  IconUser,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthFormProps {
  mode: "signin" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation for sign up
    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (!agreedToTerms) {
        setError("You must agree to the Terms of Service and Privacy Policy");
        return;
      }
    }

    startTransition(async () => {
      if (mode === "signup") {
        try {
          const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name, password }),
          });

          if (response.ok) {
            // Auto sign in after successful signup
            const result = await signIn("credentials", {
              email,
              password,
              redirect: false,
            });

            if (result?.error) {
              setError("Failed to sign in after signup");
            } else {
              router.push("/dashboard");
            }
          } else {
            const data = await response.json();
            setError(data.error || "Signup failed");
          }
        } catch (error) {
          console.error("Signup error:", error);
          setError("An error occurred during signup");
        }
      } else {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Invalid email or password");
        } else {
          router.push("/dashboard");
        }
      }
    });
  };

  // Calculate password strength for signup
  const getPasswordStrength = (pwd: string): "weak" | "medium" | "strong" => {
    if (pwd.length < 6) return "weak";
    if (pwd.length < 10) return "medium";
    return "strong";
  };

  const passwordStrength =
    mode === "signup" ? getPasswordStrength(password) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {mode === "signup" && (
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <IconUser
                size={18}
                className="text-muted-foreground"
                stroke={1.5}
              />
            </div>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={isPending}
              autoComplete="name"
              className="pl-10"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <IconMail size={18} className="text-muted-foreground" stroke={1.5} />
          </div>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={isPending}
            autoComplete="email"
            className="pl-10"
          />
        </div>
      </div>

      <PasswordInput
        id="password"
        label="Password"
        value={password}
        onChange={setPassword}
        placeholder="Enter your password"
        disabled={isPending}
        minLength={6}
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
      />

      {mode === "signup" && password && (
        <div className="space-y-1">
          <div className="flex gap-1">
            <div
              className={`h-1 flex-1 rounded-full transition-all ${
                passwordStrength === "weak"
                  ? "bg-red-500"
                  : passwordStrength === "medium"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full transition-all ${
                passwordStrength === "medium" || passwordStrength === "strong"
                  ? passwordStrength === "medium"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                  : "bg-slate-200"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full transition-all ${
                passwordStrength === "strong" ? "bg-emerald-500" : "bg-slate-200"
              }`}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Password strength:{" "}
            <span
              className={
                passwordStrength === "weak"
                  ? "text-red-600"
                  : passwordStrength === "medium"
                    ? "text-amber-600"
                    : "text-emerald-600"
              }
            >
              {passwordStrength}
            </span>
          </p>
        </div>
      )}

      {mode === "signup" && (
        <PasswordInput
          id="confirm-password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Confirm your password"
          disabled={isPending}
          minLength={6}
          autoComplete="new-password"
        />
      )}

      {mode === "signin" && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isPending}
              className="size-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <label
              htmlFor="remember"
              className="text-sm text-slate-600 select-none cursor-pointer"
            >
              Remember me
            </label>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
            disabled={isPending}
          >
            Forgot password?
          </button>
        </div>
      )}

      {mode === "signup" && (
        <div className="flex items-start space-x-2">
          <input
            id="terms"
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            disabled={isPending}
            className="mt-1 size-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <label htmlFor="terms" className="text-sm text-slate-600 select-none">
            I agree to the{" "}
            <button
              type="button"
              className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
              disabled={isPending}
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              type="button"
              className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
              disabled={isPending}
            >
              Privacy Policy
            </button>
          </label>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          <IconAlertCircle size={18} className="mt-0.5 shrink-0" stroke={1.5} />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? (
          <span className="flex items-center gap-2">
            <IconLoader2 size={18} className="animate-spin" stroke={1.5} />
            {mode === "signin" ? "Signing in..." : "Creating account..."}
          </span>
        ) : mode === "signin" ? (
          "Sign In"
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
}
