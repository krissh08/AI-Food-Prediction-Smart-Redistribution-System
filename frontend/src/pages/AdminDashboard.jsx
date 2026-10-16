import React, { useEffect, useState } from "react";
import { adminAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StatCard } from "../components/StatCard";
import {
  ShieldCheck,
  Users,
  Building2,
  HeartHandshake,
  CheckCircle2,
  UserX,
  UserCheck,
  AlertTriangle,
  Clock,
  XCircle,
  FileText,
  Download,
  Filter,
  Search,
  Check,
  X,
  ExternalLink,
  ShieldAlert,
  History,
  Activity,
  LogOut,
  RefreshCw,
  Eye
} from "lucide-react";

export const AdminDashboard = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'pending', 'approved', 'rejected', 'donors', 'acceptors', 'history', 'audit'

  // Data states
  const [data, setData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Selected Application for Review Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Approval Modal
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection Modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Alert message
  const [bannerMsg, setBannerMsg] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dashRes, appsRes, auditRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getApplications(),
        adminAPI.getAuditLogs()
      ]);
      setData(dashRes);
      setApplications(appsRes);
      setAuditLogs(auditRes);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      setBannerMsg({ type: "error", text: err.message || "Failed to load admin data." });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [dashRes, appsRes, auditRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getApplications(),
        adminAPI.getAuditLogs()
      ]);
      setData(dashRes);
      setApplications(appsRes);
      setAuditLogs(auditRes);
      setBannerMsg({ type: "success", text: "Dashboard data refreshed successfully." });
      setTimeout(() => setBannerMsg(null), 4000);
    } catch (err) {
      setBannerMsg({ type: "error", text: err.message || "Refresh failed." });
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewApplication = async (appId) => {
    setReviewLoading(true);
    try {
      const detail = await adminAPI.getApplicationDetail(appId);
      setSelectedApp(detail);
    } catch (err) {
      setBannerMsg({ type: "error", text: "Could not load application details: " + err.message });
    } finally {
      setReviewLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      await adminAPI.approveApplication(selectedApp.id, { review_notes: approveNotes });
      setBannerMsg({
        type: "success",
        text: `Organization '${selectedApp.organization_name}' has been successfully approved! Account activated and notification email dispatched.`
      });
      setShowApproveModal(false);
      setSelectedApp(null);
      setApproveNotes("");
      await loadAllData();
    } catch (err) {
      setBannerMsg({ type: "error", text: "Approval failed: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    if (!rejectionReason.trim()) {
      alert("A specific rejection reason is required.");
      return;
    }
    setActionLoading(true);
    try {
      await adminAPI.rejectApplication(selectedApp.id, { rejection_reason: rejectionReason.trim() });
      setBannerMsg({
        type: "warning",
        text: `Application for '${selectedApp.organization_name}' has been rejected and closed permanently. Notification email dispatched.`
      });
      setShowRejectModal(false);
      setSelectedApp(null);
      setRejectionReason("");
      await loadAllData();
    } catch (err) {
      setBannerMsg({ type: "error", text: "Rejection failed: " + err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadDoc = async (docId, filename) => {
    if (!selectedApp) return;
    try {
      await adminAPI.downloadDocument(selectedApp.id, docId, filename);
    } catch (err) {
      alert("Failed to download document: " + err.message);
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      const res = await adminAPI.toggleUserStatus(userId);
      setBannerMsg({ type: "success", text: res.message });
      await loadAllData();
    } catch (err) {
      setBannerMsg({ type: "error", text: "Error toggling user: " + err.message });
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Loading Administrative Security & Compliance Center...
        </p>
      </div>
    );
  }

  const kpi = data?.kpi || {};
  const pendingApps = applications.filter((a) => a.status === "PENDING_APPROVAL" || a.status === "EMAIL_UNVERIFIED");
  const approvedApps = applications.filter((a) => a.status === "APPROVED");
  const rejectedApps = applications.filter((a) => a.status === "REJECTED");
  const allUsers = data?.recent_users || [];
  const donorUsers = allUsers.filter((u) => u.role === "donor");
  const acceptorUsers = allUsers.filter((u) => u.role === "acceptor");

  const getAppRole = (app) => (app?.account_role || app?.application_type || app?.role || "donor").toLowerCase();
  const isDonorRole = (app) => getAppRole(app) === "donor";

  // Filter application list based on search and role
  const filterList = (list) => {
    return list.filter((app) => {
      const matchesRole = roleFilter === "all" || getAppRole(app) === roleFilter;
      const matchesSearch =
        searchTerm === "" ||
        app.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.id?.toString().includes(searchTerm);
      return matchesRole && matchesSearch;
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              NourishSync Master Admin
            </span>
            <span className="bg-amber-400/20 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-400/30">
              Security Gateway Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
            Organization Verification & Compliance
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Manual administrative review portal. Review supporting documents, authorize legitimate food donors and charitable acceptors, and enforce security policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn btn-outline border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs px-3 py-2 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
          <button
            onClick={logout}
            className="btn btn-outline border-red-800 text-red-300 bg-red-950/40 hover:bg-red-900/60 text-xs px-3 py-2 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* Dynamic Banner Alert */}
      {bannerMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between shadow-sm border ${
            bannerMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : bannerMsg.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{bannerMsg.text}</span>
          </div>
          <button onClick={() => setBannerMsg(null)} className="text-xs font-bold hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-1.5">
        {[
          { id: "overview", label: "Overview", icon: ShieldCheck, badge: null },
          { id: "pending", label: "Pending Applications", icon: Clock, badge: pendingApps.length, badgeColor: "bg-amber-500 text-white" },
          { id: "approved", label: "Approved Organizations", icon: CheckCircle2, badge: approvedApps.length, badgeColor: "bg-emerald-600 text-white" },
          { id: "rejected", label: "Rejected Applications", icon: XCircle, badge: rejectedApps.length, badgeColor: "bg-red-500 text-white" },
          { id: "donors", label: "Donor Accounts", icon: Building2, badge: donorUsers.length },
          { id: "acceptors", label: "Acceptor Accounts", icon: HeartHandshake, badge: acceptorUsers.length },
          { id: "history", label: "Verification History", icon: History, badge: null },
          { id: "audit", label: "Audit Logs", icon: Activity, badge: auditLogs.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  tab.badgeColor || (isActive ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700")
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Platform Users" value={kpi.total_users || 0} icon={Users} color="slate" />
            <StatCard title="Pending Applications" value={kpi.pending_applications || pendingApps.length} icon={Clock} color="amber" />
            <StatCard title="Approved Organizations" value={kpi.approved_organizations || approvedApps.length} icon={CheckCircle2} color="emerald" />
            <StatCard title="Rejected Applications" value={kpi.rejected_applications || rejectedApps.length} icon={XCircle} color="red" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Actions & Compliance Status */}
            <div className="card space-y-4 lg:col-span-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Compliance Status
                </h3>
                <span className="badge badge-emerald">Enforced</span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span>Two-Stage Verification:</span>
                  <span className="font-bold text-emerald-700">Active</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span>Document Storage Isolation:</span>
                  <span className="font-bold text-emerald-700">Private & Secured</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span>Cryptographic Audit Trail:</span>
                  <span className="font-bold text-emerald-700">Enabled</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span>Operational Dashboard Gate:</span>
                  <span className="font-bold text-emerald-700">Strict Lock</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab("pending")}
                  className="btn btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" /> Review Pending Applications ({pendingApps.length})
                </button>
              </div>
            </div>

            {/* Pending Requests Preview */}
            <div className="card space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Action Items: Organizations Awaiting Review</h3>
                  <p className="text-xs text-slate-500">Require manual verification of supporting documents before activation</p>
                </div>
                <button
                  onClick={() => setActiveTab("pending")}
                  className="text-xs font-bold text-emerald-600 hover:underline"
                >
                  View All ({pendingApps.length})
                </button>
              </div>

              {pendingApps.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-semibold">Zero pending applications! All organizations have been reviewed.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingApps.slice(0, 5).map((app) => (
                    <div key={app.id} className="py-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{app.organization_name}</span>
                          <span className={`badge ${isDonorRole(app) ? 'badge-emerald' : 'badge-blue'}`}>
                            {isDonorRole(app) ? 'Food Donor' : 'Food Acceptor'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            app.email_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {app.email_verified ? 'Email Verified' : 'Email Unverified'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Contact: {app.contact_name} ({app.email}) • Submitted: {app.submitted_at || "Recent"}
                        </p>
                      </div>

                      <button
                        onClick={() => handleViewApplication(app.id)}
                        className="btn btn-outline text-xs px-3 py-1.5 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PENDING APPLICATIONS */}
      {/* ========================================================================= */}
      {activeTab === "pending" && (
        <div className="card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Pending Verification Requests
              </h3>
              <p className="text-xs text-slate-500">
                Organizations that have submitted documents and are awaiting your manual authorization.
              </p>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, email, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 w-48"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 border rounded-xl text-xs bg-white text-slate-700 outline-none"
              >
                <option value="all">All Roles</option>
                <option value="donor">Food Donors</option>
                <option value="acceptor">Food Acceptors</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">App ID</th>
                  <th className="py-3 px-2">Organization</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Role</th>
                  <th className="py-3 px-2">Contact Person</th>
                  <th className="py-3 px-2">Email Verification</th>
                  <th className="py-3 px-2">Docs</th>
                  <th className="py-3 px-2">Submitted</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filterList(pendingApps).length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400 font-semibold">
                      No pending applications match the current criteria.
                    </td>
                  </tr>
                ) : (
                  filterList(pendingApps).map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 font-mono text-slate-400">#{app.id}</td>
                      <td className="py-3 px-2">
                        <span className="font-bold text-slate-900 block">{app.organization_name}</span>
                        <span className="text-[10px] text-slate-400">{app.city}, {app.state}</span>
                      </td>
                      <td className="py-3 px-2 text-slate-600 font-medium">{app.organization_type}</td>
                      <td className="py-3 px-2">
                        <span className={`badge ${isDonorRole(app) ? 'badge-emerald' : 'badge-blue'}`}>
                          {isDonorRole(app) ? 'Food Donor' : 'Food Acceptor'}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-slate-800 font-medium block">{app.contact_name}</span>
                        <span className="text-[10px] text-slate-400">{app.phone}</span>
                      </td>
                      <td className="py-3 px-2">
                        {app.email_verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span className="badge badge-slate text-[10px]">
                          {app.documents_count} uploaded
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-400 text-[11px]">{app.submitted_at}</td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleViewApplication(app.id)}
                          className="btn btn-primary text-xs px-3 py-1.5 flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review Application
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: APPROVED ORGANIZATIONS */}
      {/* ========================================================================= */}
      {activeTab === "approved" && (
        <div className="card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Approved Organizations ({approvedApps.length})
              </h3>
              <p className="text-xs text-slate-500">
                Verified entities with operational permissions to list or claim surplus food.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search approved..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">App ID</th>
                  <th className="py-3 px-2">Organization</th>
                  <th className="py-3 px-2">Role</th>
                  <th className="py-3 px-2">Contact Person</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Approved Date</th>
                  <th className="py-3 px-2">Approved By</th>
                  <th className="py-3 px-2 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filterList(approvedApps).length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400 font-semibold">
                      No approved organizations found.
                    </td>
                  </tr>
                ) : (
                  filterList(approvedApps).map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 font-mono text-slate-400">#{app.id}</td>
                      <td className="py-3 px-2 font-bold text-slate-900">{app.organization_name}</td>
                      <td className="py-3 px-2">
                        <span className={`badge ${isDonorRole(app) ? 'badge-emerald' : 'badge-blue'}`}>
                          {isDonorRole(app) ? 'Food Donor' : 'Food Acceptor'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-700">{app.contact_name}</td>
                      <td className="py-3 px-2 text-slate-600">{app.email}</td>
                      <td className="py-3 px-2 text-slate-500">{app.reviewed_at || "Pre-Approved"}</td>
                      <td className="py-3 px-2 font-mono text-slate-500 text-[11px]">{app.reviewed_by_admin || "System Admin"}</td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleViewApplication(app.id)}
                          className="btn btn-outline text-xs px-2.5 py-1"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REJECTED APPLICATIONS */}
      {/* ========================================================================= */}
      {activeTab === "rejected" && (
        <div className="card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Rejected Applications ({rejectedApps.length})
              </h3>
              <p className="text-xs text-slate-500">
                Applications closed permanently due to failing verification standards.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">App ID</th>
                  <th className="py-3 px-2">Organization</th>
                  <th className="py-3 px-2">Role</th>
                  <th className="py-3 px-2">Contact Person</th>
                  <th className="py-3 px-2">Rejection Reason</th>
                  <th className="py-3 px-2">Rejected Date</th>
                  <th className="py-3 px-2">Decided By</th>
                  <th className="py-3 px-2 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filterList(rejectedApps).length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400 font-semibold">
                      No rejected applications recorded.
                    </td>
                  </tr>
                ) : (
                  filterList(rejectedApps).map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 font-mono text-slate-400">#{app.id}</td>
                      <td className="py-3 px-2 font-bold text-slate-900">{app.organization_name}</td>
                      <td className="py-3 px-2">
                        <span className={`badge ${isDonorRole(app) ? 'badge-emerald' : 'badge-blue'}`}>
                          {isDonorRole(app) ? 'Food Donor' : 'Food Acceptor'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-700">{app.contact_name}</td>
                      <td className="py-3 px-2 text-red-700 font-medium italic max-w-xs truncate">
                        "{app.rejection_reason || "Compliance criteria not met"}"
                      </td>
                      <td className="py-3 px-2 text-slate-500">{app.reviewed_at}</td>
                      <td className="py-3 px-2 font-mono text-slate-500 text-[11px]">{app.reviewed_by_admin || "Admin"}</td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => handleViewApplication(app.id)}
                          className="btn btn-outline text-xs px-2.5 py-1"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DONOR ACCOUNTS */}
      {/* ========================================================================= */}
      {activeTab === "donors" && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Food Donor Accounts ({donorUsers.length})</h3>
              <p className="text-xs text-slate-500">Manage account access and suspension for food providers</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">User ID</th>
                  <th className="py-3 px-2">Organization</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Approval</th>
                  <th className="py-3 px-2">Created</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donorUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2 font-mono text-slate-400">#{u.id}</td>
                    <td className="py-3 px-2 font-bold text-slate-900">{u.organization_name}</td>
                    <td className="py-3 px-2 text-slate-600">{u.email}</td>
                    <td className="py-3 px-2">
                      <span className={`badge ${u.is_active ? 'badge-emerald' : 'badge-danger'}`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`badge ${
                        u.approval_status === 'APPROVED'
                          ? 'badge-emerald'
                          : u.approval_status === 'REJECTED'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}>
                        {u.approval_status === 'APPROVED' ? 'Approved' : u.approval_status === 'REJECTED' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-400">{u.created_at}</td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleToggleUser(u.id)}
                        className={`btn btn-sm text-[11px] ${
                          u.is_active ? 'btn-outline text-red-600 hover:bg-red-50' : 'btn-primary bg-emerald-600'
                        }`}
                      >
                        {u.is_active ? (
                          <>
                            <UserX className="w-3.5 h-3.5" /> Suspend
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" /> Re-Activate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ACCEPTOR ACCOUNTS */}
      {/* ========================================================================= */}
      {activeTab === "acceptors" && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Food Acceptor Accounts ({acceptorUsers.length})</h3>
              <p className="text-xs text-slate-500">Manage NGO, food bank, and shelter accounts</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">User ID</th>
                  <th className="py-3 px-2">Organization</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Approval</th>
                  <th className="py-3 px-2">Created</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {acceptorUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2 font-mono text-slate-400">#{u.id}</td>
                    <td className="py-3 px-2 font-bold text-slate-900">{u.organization_name}</td>
                    <td className="py-3 px-2 text-slate-600">{u.email}</td>
                    <td className="py-3 px-2">
                      <span className={`badge ${u.is_active ? 'badge-emerald' : 'badge-danger'}`}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`badge ${
                        u.approval_status === 'APPROVED'
                          ? 'badge-emerald'
                          : u.approval_status === 'REJECTED'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}>
                        {u.approval_status === 'APPROVED' ? 'Approved' : u.approval_status === 'REJECTED' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-400">{u.created_at}</td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => handleToggleUser(u.id)}
                        className={`btn btn-sm text-[11px] ${
                          u.is_active ? 'btn-outline text-red-600 hover:bg-red-50' : 'btn-primary bg-emerald-600'
                        }`}
                      >
                        {u.is_active ? (
                          <>
                            <UserX className="w-3.5 h-3.5" /> Suspend
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" /> Re-Activate
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: VERIFICATION HISTORY */}
      {/* ========================================================================= */}
      {activeTab === "history" && (
        <div className="card space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              Administrative Verification History
            </h3>
            <p className="text-xs text-slate-500">
              Chronological ledger of all compliance reviews, approval transitions, and rejections.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {applications.filter((a) => a.reviewed_at).length === 0 ? (
              <p className="py-8 text-center text-slate-400 text-xs font-semibold">
                No formal review decisions recorded yet.
              </p>
            ) : (
              applications
                .filter((a) => a.reviewed_at)
                .map((app) => (
                  <div key={app.id} className="py-3.5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${app.status === 'APPROVED' ? 'badge-emerald' : 'badge-danger'}`}>
                          {app.status === 'APPROVED' ? 'APPROVED' : 'REJECTED'}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{app.organization_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">#{app.id}</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Decided by <strong>{app.reviewed_by_admin || "Admin"}</strong> on {app.reviewed_at}
                      </p>
                      {app.rejection_reason && (
                        <p className="text-xs text-red-700 italic bg-red-50 p-2 rounded-lg border border-red-200">
                          Reason: {app.rejection_reason}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleViewApplication(app.id)}
                      className="btn btn-outline text-xs px-3 py-1 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Details
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeTab === "audit" && (
        <div className="card space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Immutable System Audit Logs
              </h3>
              <p className="text-xs text-slate-500">
                Security-sensitive events, administrative decisions, registrations, and logins.
              </p>
            </div>
            <span className="badge badge-slate">{auditLogs.length} Events</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">ID</th>
                  <th className="py-3 px-2">Action</th>
                  <th className="py-3 px-2">Actor</th>
                  <th className="py-3 px-2">Target</th>
                  <th className="py-3 px-2">Metadata</th>
                  <th className="py-3 px-2 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors font-mono">
                    <td className="py-2.5 px-2 text-slate-400">#{log.id}</td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action.includes("APPROVED")
                          ? "bg-emerald-100 text-emerald-800"
                          : log.action.includes("REJECTED")
                          ? "bg-red-100 text-red-800"
                          : log.action.includes("ADMIN")
                          ? "bg-purple-100 text-purple-800"
                          : "bg-slate-100 text-slate-800"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-800 font-sans font-semibold">
                      {log.actor_name || `User #${log.actor_id}`}
                    </td>
                    <td className="py-2.5 px-2 text-slate-500 text-[11px]">
                      {log.target_type} {log.target_id ? `(#${log.target_id})` : ""}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[10px] text-slate-600 max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : "—"}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-400 text-[11px] font-sans">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPLICATION DETAIL & REVIEW MODAL */}
      {/* ========================================================================= */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-8 animate-in fade-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${isDonorRole(selectedApp) ? 'badge-emerald' : 'badge-blue'}`}>
                    {isDonorRole(selectedApp) ? 'Food Donor' : 'Food Acceptor'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedApp.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedApp.status === "REJECTED"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {selectedApp.status}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  {selectedApp.organization_name}
                </h2>
                <span className="text-xs text-slate-500">
                  Application ID #{selectedApp.id} • Submitted: {selectedApp.submitted_at}
                </span>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Application Overview Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Organization Type</span>
                <span className="font-bold text-slate-800">{selectedApp.organization_type}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Authorized Contact</span>
                <span className="font-bold text-slate-800">{selectedApp.contact_name}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Address</span>
                <span className="font-semibold text-slate-800">{selectedApp.email}</span>
                <span className={`ml-2 text-[10px] font-bold ${selectedApp.email_verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {selectedApp.email_verified ? '✓ Verified' : '⚠ Unverified'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Phone</span>
                <span className="font-semibold text-slate-800">{selectedApp.phone || "—"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Physical Address</span>
                <span className="text-slate-700">
                  {selectedApp.address}, {selectedApp.city}, {selectedApp.state} - {selectedApp.postal_code}
                </span>
              </div>

              {/* Donor Parent Institution Note */}
              {selectedApp.parent_institution && (
                <div className="col-span-2 bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                    Parent Institution Relationship:
                  </span>
                  <p className="text-slate-700 mt-0.5">{selectedApp.parent_institution}</p>
                </div>
              )}

              {/* Acceptor Activities Note */}
              {selectedApp.food_distribution_activities && (
                <div className="col-span-2 bg-white p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">
                    Food Distribution & Charitable Activities:
                  </span>
                  <p className="text-slate-700 mt-0.5">{selectedApp.food_distribution_activities}</p>
                </div>
              )}
            </div>

            {/* Supporting Documents Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Submitted Supporting Documents ({selectedApp.documents?.length || 0})
              </h4>

              {selectedApp.documents?.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  No supporting documents were uploaded for this application.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                  {selectedApp.documents?.map((doc) => (
                    <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-900 block truncate max-w-sm">
                          {doc.original_filename}
                        </span>
                        <div className="text-[11px] text-slate-400 flex gap-2">
                          <span>{doc.content_type}</span>
                          <span>•</span>
                          <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDownloadDoc(doc.id, doc.original_filename)}
                        className="btn btn-outline text-xs px-3 py-1.5 flex items-center gap-1 text-slate-700"
                      >
                        <Download className="w-3.5 h-3.5" /> Download / View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Decision Status / Actions Footer */}
            <div className="pt-4 border-t border-slate-100">
              {selectedApp.status === "PENDING_APPROVAL" || selectedApp.status === "EMAIL_UNVERIFIED" ? (
                <div className="space-y-3">
                  {!selectedApp.email_verified && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>
                        Applicant has not verified their email. Approval will be rejected by security policy until email is confirmed.
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="btn btn-outline border-red-300 text-red-600 hover:bg-red-50 flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Reject Application
                    </button>
                    <button
                      onClick={() => setShowApproveModal(true)}
                      disabled={!selectedApp.email_verified}
                      className="btn btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve & Activate Account
                    </button>
                  </div>
                </div>
              ) : selectedApp.status === "APPROVED" ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                  <span className="font-semibold">
                    ✓ Application was approved on {selectedApp.reviewed_at} by {selectedApp.reviewed_by_admin || "Admin"}.
                  </span>
                  <span className="badge badge-emerald">Operational</span>
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                  <span className="font-semibold block">
                    ✕ Application was rejected on {selectedApp.reviewed_at} by {selectedApp.reviewed_by_admin || "Admin"}.
                  </span>
                  <p className="italic text-[11px]">Reason: "{selectedApp.rejection_reason}"</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPROVAL CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showApproveModal && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">Confirm Organization Approval</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to approve <strong>{selectedApp.organization_name}</strong>?
              </p>
            </div>

            <div className="text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-600 space-y-1.5">
              <p className="font-bold text-slate-800">What happens next:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Account status will be marked <strong>APPROVED</strong>.</li>
                <li>Operational dashboard permissions will be immediately granted.</li>
                <li>Email C (Organization approved) will be transmitted to {selectedApp.email}.</li>
                <li>Approval timestamp and your admin ID will be recorded to the audit log.</li>
              </ul>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 block">
                Internal Review Notes (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Validated state restaurant license & contact phone"
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowApproveModal(false)}
                className="btn btn-outline flex-1 text-xs py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="btn btn-primary flex-1 text-xs py-2.5 shadow-lg shadow-emerald-600/30"
              >
                {actionLoading ? "Approving..." : "Confirm & Activate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REJECTION REASON & CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {showRejectModal && selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl mx-auto flex items-center justify-center">
              <XCircle className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">Reject Application</h3>
              <p className="text-xs text-slate-500">
                Application for <strong>{selectedApp.organization_name}</strong> will be permanently closed.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Rejection Reason (Required):
              </label>
              <textarea
                rows="3"
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Submitted registration document was illegible or could not be verified against the state commercial registry. Please resubmit with official credentials."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-500"
              ></textarea>
              <span className="text-[11px] text-slate-500 block">
                This explanation will be included in the notification email sent to the applicant.
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="btn btn-outline flex-1 text-xs py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="btn bg-red-600 hover:bg-red-700 text-white font-bold flex-1 text-xs py-2.5 shadow-lg shadow-red-600/30 disabled:opacity-50"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
