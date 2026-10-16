import React, { useState, useEffect } from "react";
import { authAPI } from "../services/api";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Search,
  ArrowRight,
  ShieldAlert,
  Building2,
  RefreshCw,
  FileText
} from "lucide-react";

export const ApplicationStatusPage = ({ onNavigate }) => {
  const [emailInput, setEmailInput] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("email") || "";
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusData, setStatusData] = useState(null);

  // Resend state
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  useEffect(() => {
    if (emailInput) {
      handleLookup(emailInput);
    }
  }, []);

  const handleLookup = async (lookupEmail) => {
    if (!lookupEmail) return;
    setLoading(true);
    setError("");
    setResendMsg("");

    try {
      const data = await authAPI.checkStatusByEmail(lookupEmail);
      setStatusData(data);
    } catch (err) {
      setStatusData(null);
      setError(err.message || "No registered organization was found matching this email.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleLookup(emailInput);
  };

  const handleResendVerification = async () => {
    if (!statusData?.email && !emailInput) return;
    const targetEmail = statusData?.email || emailInput;
    setResendLoading(true);
    setResendMsg("");

    try {
      const res = await authAPI.resendVerification(targetEmail);
      setResendMsg(res.message || "Verification email sent! Please check your inbox.");
    } catch (err) {
      setResendMsg(err.message || "Failed to dispatch verification email.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-xl w-full space-y-6">
        
        {/* Lookup Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
              <Clock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Organization Application Status</h1>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Track the verification and manual administrative compliance review of your NourishSync organization registration.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your registered organization email"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary px-5 text-xs flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Checking...
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" /> Look Up
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STATUS DISPLAY WHEN FOUND */}
          {statusData && (
            <div className="border-t border-slate-100 pt-6 space-y-5">
              
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    {statusData.organization_name}
                  </span>
                  <span className={`badge ${
                    statusData.role === "donor" ? "badge-emerald" : "badge-blue"
                  }`}>
                    {statusData.role === "donor" ? "Food Donor" : "Food Acceptor"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Registered: <strong>{statusData.email}</strong></span>
                  {statusData.submitted_at && <span>Submitted: {statusData.submitted_at}</span>}
                  {statusData.application_id && <span>App ID: #{statusData.application_id}</span>}
                </div>
              </div>

              {/* STATE 1: PENDING APPROVAL */}
              {statusData.status === "PENDING_APPROVAL" && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4 text-amber-900">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 block">
                        Review in Progress
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Your email has been verified.
                      </h3>
                      <p className="text-xs font-bold text-amber-800">
                        Your organization is awaiting admin approval.
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 bg-white/80 p-3.5 rounded-xl border border-amber-200/60 space-y-2">
                    <p className="font-semibold text-slate-800">
                      You cannot access NourishSync features until your application is approved.
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Our system administration and compliance team is currently reviewing your organization details, registration evidence, and supporting documentation.
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      We will email you at <strong>{statusData.email}</strong> as soon as a verification decision has been reached.
                    </p>
                  </div>
                </div>
              )}

              {/* STATE 2: REJECTED */}
              {statusData.status === "REJECTED" && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4 text-red-900">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-700 block">
                        Application Closed
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Your application was not approved.
                      </h3>
                    </div>
                  </div>

                  <div className="text-xs bg-white p-3.5 rounded-xl border border-red-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Admin Provided Reason:
                    </span>
                    <p className="text-xs text-red-700 font-medium italic">
                      "{statusData.rejection_reason || "Application did not meet compliance criteria."}"
                    </p>
                    <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                      This application is permanently closed. To apply again, submit a new application with the required information and supporting evidence.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => onNavigate(`/register/${statusData.role || 'donor'}`)}
                      className="btn btn-primary w-full text-xs py-2.5"
                    >
                      Submit New {statusData.role === "acceptor" ? "Acceptor" : "Donor"} Application
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 3: EMAIL UNVERIFIED */}
              {statusData.status === "EMAIL_UNVERIFIED" && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-4 text-blue-900">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 block">
                        Action Required
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Email Address Not Verified
                      </h3>
                      <p className="text-xs text-slate-600">
                        Please click the verification link sent to your inbox to submit your application for review.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="btn btn-primary text-xs py-2.5 flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? "animate-spin" : ""}`} />
                      {resendLoading ? "Sending..." : "Resend Verification Email"}
                    </button>
                    {resendMsg && <p className="text-xs text-slate-700 text-center font-semibold">{resendMsg}</p>}
                  </div>
                </div>
              )}

              {/* STATE 4: APPROVED */}
              {statusData.status === "APPROVED" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4 text-emerald-900">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 block">
                        Verification Complete
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">
                        Organization Approved!
                      </h3>
                      <p className="text-xs text-slate-600">
                        Your organization has been fully verified and approved by the NourishSync administrator.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate("/login")}
                    className="btn btn-primary w-full text-xs py-3 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                  >
                    Proceed to Sign In <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          )}

          <div className="pt-2 text-center">
            <button
              onClick={() => onNavigate("/")}
              className="text-xs text-slate-400 hover:text-slate-600 underline font-medium"
            >
              Return to NourishSync Homepage
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
