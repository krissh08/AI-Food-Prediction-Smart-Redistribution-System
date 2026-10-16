import React, { useState, useEffect } from "react";
import { authAPI } from "../services/api";
import { CheckCircle2, XCircle, Mail, ArrowRight, Loader2, RefreshCw } from "lucide-react";

export const VerifyEmailPage = ({ onNavigate }) => {
  const [token, setToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  });

  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', 'error', 'prompt'
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendDevUrl, setResendDevUrl] = useState("");

  useEffect(() => {
    if (token) {
      handleVerify(token);
    } else {
      setStatus("prompt");
    }
  }, []);

  const handleVerify = async (verificationToken) => {
    setStatus("verifying");
    setMessage("");
    try {
      const res = await authAPI.verifyEmail(verificationToken);
      setStatus("success");
      setMessage(res.message || "Your email address has been successfully verified!");
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Email verification failed. The link may be expired or invalid.");
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResendLoading(true);
    setResendMsg("");
    setResendDevUrl("");

    try {
      const res = await authAPI.resendVerification(resendEmail);
      setResendMsg(res.message || "Verification link sent! Please check your inbox.");
      if (res.verification_url) {
        setResendDevUrl(res.verification_url);
      }
    } catch (err) {
      setResendMsg(err.message || "Failed to resend verification link.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6 text-center">
        
        {/* VERIFYING STATE */}
        {status === "verifying" && (
          <div className="space-y-4 py-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full mx-auto flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Verifying Email...</h2>
            <p className="text-xs text-slate-500">
              Please wait while we confirm your email verification token with the server.
            </p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === "success" && (
          <div className="space-y-5 py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Your email has been verified.</h2>
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs space-y-1.5 text-amber-900">
                <p className="font-bold text-amber-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Your organization is awaiting admin approval.
                </p>
                <p className="text-slate-600">
                  You cannot access NourishSync features until your application is approved.
                </p>
                <p className="text-[11px] text-slate-500">
                  Our compliance team reviews submitted organization details and supporting documentation. You will receive an email once a decision has been reached.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => onNavigate("/application-status")}
                className="btn btn-primary w-full text-xs font-bold py-3 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
              >
                View Application Status <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate("/")}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-medium py-1"
              >
                Return to Homepage
              </button>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {status === "error" && (
          <div className="space-y-5 text-left">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center">
                <XCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">Verification Failed</h2>
              <p className="text-xs text-red-600">{message}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                Resend Verification Link
              </h3>
              <form onSubmit={handleResend} className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your registered email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="btn btn-primary w-full text-xs py-2"
                >
                  {resendLoading ? "Sending..." : "Send New Verification Link"}
                </button>
              </form>
              {resendMsg && (
                <p className="text-[11px] text-slate-600 mt-1">{resendMsg}</p>
              )}
            </div>

            <button
              onClick={() => onNavigate("/login")}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Back to Sign In
            </button>
          </div>
        )}

        {/* PROMPT STATE (No token provided in URL) */}
        {status === "prompt" && (
          <div className="space-y-5 text-left">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full mx-auto flex items-center justify-center">
                <Mail className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">Email Verification</h2>
              <p className="text-xs text-slate-500">
                Please check your email inbox for the verification link sent during registration.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-800">Need a new verification link?</h3>
              <form onSubmit={handleResend} className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your registered email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="btn btn-primary w-full text-xs py-2"
                >
                  {resendLoading ? "Sending..." : "Send Verification Link"}
                </button>
              </form>
              {resendMsg && (
                <p className="text-[11px] text-slate-600 mt-1">{resendMsg}</p>
              )}
            </div>

            <button
              onClick={() => onNavigate("/login")}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Back to Sign In
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
