"use client";

import {
  IconAlertCircle,
  IconCheck,
  IconLoader2,
  IconMail,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

  // Email validation
  const isEmailValid = (email: string): boolean => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password confirmation match
  const passwordsMatch =
    mode === "signup" &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

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
        } catch (_error) {
          // Error handled via user-facing message
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
  const validatePassword = (pwd: string) => {
    return {
      hasMinLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
  };

  const getPasswordStrength = (
    checks: ReturnType<typeof validatePassword>,
  ): "weak" | "medium" | "strong" => {
    const passedChecks = Object.values(checks).filter(Boolean).length;
    if (passedChecks <= 2) return "weak";
    if (passedChecks <= 4) return "medium";
    return "strong";
  };

  const passwordChecks = mode === "signup" ? validatePassword(password) : null;
  const passwordStrength = passwordChecks
    ? getPasswordStrength(passwordChecks)
    : null;

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
            <IconMail
              size={18}
              className="text-muted-foreground"
              stroke={1.5}
            />
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
            className="pl-10 pr-10"
          />
          {email && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              {isEmailValid(email) ? (
                <IconCheck
                  size={18}
                  className="text-emerald-600 dark:text-emerald-500"
                  stroke={2}
                />
              ) : (
                <IconX size={18} className="text-destructive" stroke={2} />
              )}
            </div>
          )}
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

      {mode === "signup" && password && passwordChecks && (
        <div className="space-y-3">
          {/* Password Strength Bar */}
          <div className="space-y-1.5">
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
                    : "bg-muted"
                }`}
              />
              <div
                className={`h-1 flex-1 rounded-full transition-all ${
                  passwordStrength === "strong" ? "bg-emerald-500" : "bg-muted"
                }`}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Password strength:{" "}
              <span
                className={
                  passwordStrength === "weak"
                    ? "text-red-600 dark:text-red-500 font-medium"
                    : passwordStrength === "medium"
                      ? "text-amber-600 dark:text-amber-500 font-medium"
                      : "text-emerald-600 dark:text-emerald-500 font-medium"
                }
              >
                {passwordStrength}
              </span>
            </p>
          </div>

          {/* Password Requirements Checklist */}
          <div className="space-y-1.5 rounded-lg bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Password must contain:
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                {passwordChecks.hasMinLength ? (
                  <IconCheck
                    size={14}
                    className="text-emerald-600 dark:text-emerald-500"
                    stroke={2.5}
                  />
                ) : (
                  <IconX
                    size={14}
                    className="text-muted-foreground"
                    stroke={2.5}
                  />
                )}
                <span
                  className={
                    passwordChecks.hasMinLength
                      ? "text-emerald-600 dark:text-emerald-500"
                      : "text-muted-foreground"
                  }
                >
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {passwordChecks.hasUppercase ? (
                  <IconCheck
                    size={14}
                    className="text-emerald-600 dark:text-emerald-500"
                    stroke={2.5}
                  />
                ) : (
                  <IconX
                    size={14}
                    className="text-muted-foreground"
                    stroke={2.5}
                  />
                )}
                <span
                  className={
                    passwordChecks.hasUppercase
                      ? "text-emerald-600 dark:text-emerald-500"
                      : "text-muted-foreground"
                  }
                >
                  One uppercase letter
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {passwordChecks.hasLowercase ? (
                  <IconCheck
                    size={14}
                    className="text-emerald-600 dark:text-emerald-500"
                    stroke={2.5}
                  />
                ) : (
                  <IconX
                    size={14}
                    className="text-muted-foreground"
                    stroke={2.5}
                  />
                )}
                <span
                  className={
                    passwordChecks.hasLowercase
                      ? "text-emerald-600 dark:text-emerald-500"
                      : "text-muted-foreground"
                  }
                >
                  One lowercase letter
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {passwordChecks.hasNumber ? (
                  <IconCheck
                    size={14}
                    className="text-emerald-600 dark:text-emerald-500"
                    stroke={2.5}
                  />
                ) : (
                  <IconX
                    size={14}
                    className="text-muted-foreground"
                    stroke={2.5}
                  />
                )}
                <span
                  className={
                    passwordChecks.hasNumber
                      ? "text-emerald-600 dark:text-emerald-500"
                      : "text-muted-foreground"
                  }
                >
                  One number
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {passwordChecks.hasSpecialChar ? (
                  <IconCheck
                    size={14}
                    className="text-emerald-600 dark:text-emerald-500"
                    stroke={2.5}
                  />
                ) : (
                  <IconX
                    size={14}
                    className="text-muted-foreground"
                    stroke={2.5}
                  />
                )}
                <span
                  className={
                    passwordChecks.hasSpecialChar
                      ? "text-emerald-600 dark:text-emerald-500"
                      : "text-muted-foreground"
                  }
                >
                  One special character (!@#$%^&*)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === "signup" && (
        <div className="space-y-2">
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
          {confirmPassword && (
            <p className="flex items-center gap-1.5 text-xs">
              {passwordsMatch ? (
                <>
                  <IconCheck
                    size={14}
                    className="text-emerald-600 dark:text-emerald-500"
                    stroke={2.5}
                  />
                  <span className="text-emerald-600 dark:text-emerald-500">
                    Passwords match
                  </span>
                </>
              ) : (
                <>
                  <IconX size={14} className="text-destructive" stroke={2.5} />
                  <span className="text-destructive">
                    Passwords do not match
                  </span>
                </>
              )}
            </p>
          )}
        </div>
      )}

      {mode === "signin" && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              disabled={isPending}
            />
            <label
              htmlFor="remember"
              className="text-sm text-muted-foreground select-none cursor-pointer"
            >
              Remember me
            </label>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
            disabled={isPending}
          >
            Forgot password?
          </button>
        </div>
      )}

      {mode === "signup" && (
        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            disabled={isPending}
            className="mt-1"
          />
          <label
            htmlFor="terms"
            className="text-sm text-muted-foreground select-none"
          >
            I agree to the{" "}
            <button
              type="button"
              className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
              disabled={isPending}
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              type="button"
              className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
              disabled={isPending}
            >
              Privacy Policy
            </button>
          </label>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
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
