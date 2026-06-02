import React, { useState, useEffect } from "react";
import "./HodDashboard.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// const API_BASE = "http://localhost:8080/api";
const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

/* ─── Nav ─────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Dashboard",       Icon: HomeIcon,     path: "/hod-dashboard"        },
  { label: "All Bookings",    Icon: BookingsIcon, path: "/hod-all-bookings"     },
  { label: "Upload Time Table", Icon: UploadNavIcon, path: "/hod-upload-timetable" },
  { label: "Resources",       Icon: ResourcesIcon, path: "/hod-resources"       },
  { label: "Profile",         Icon: ProfileIcon,  path: "/hod-profile"          },
  { label: "Logout",          Icon: LogoutIcon,   path: "/login"                },
];

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function HodDashboard() {
  const navigate = useNavigate();

  /* ── Read HOD from localStorage ── */
  const loggedInUser   = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
  const hodName        = loggedInUser.fullName   || "HOD";
  const hodDepartment  = loggedInUser.department || "";
  const hodId          = loggedInUser.id;
  const hodInitial     = hodName.charAt(0).toUpperCase();

  /* ── State ── */
  const [activeNav,  setActiveNav]  = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requests,   setRequests]   = useState([]);   // pending requests from API
  const [stats,      setStats]      = useState({ total: 0, approved: 0, pending: 0, rejected: 0, cancelled: 0 });
  const [recentActions, setRecentActions] = useState([]); // approved/rejected
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState(null);
  const [remarkMap,  setRemarkMap]  = useState({});  // bookingId → remark string

  /* ── Fetch on mount ── */
  useEffect(() => {
    if (!hodDepartment) {
      alert("Session expired. Please login again.");
      navigate("/login");
      return;
    }
    fetchPendingRequests();
    fetchStats();
    fetchRecentActions();
  }, []);

  /* ── Fetch PENDING requests for HOD's department ── */
  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/bookings/department`, {
        params: { dept: hodDepartment, status: "PENDING" }
      });
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch pending requests:", err);
      showToast("Failed to load requests.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── Fetch stats ── */
  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/bookings/department/stats`, {
        params: { dept: hodDepartment }
      });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  /* ── Fetch recent approved/rejected actions ── */
  const fetchRecentActions = async () => {
    try {
      const [approvedRes, rejectedRes] = await Promise.all([
        axios.get(`${API_BASE}/bookings/department`, {
          params: { dept: hodDepartment, status: "APPROVED" }
        }),
        axios.get(`${API_BASE}/bookings/department`, {
          params: { dept: hodDepartment, status: "REJECTED" }
        }),
      ]);
      // Merge and sort by reviewedAt desc, take latest 5
      const combined = [
        ...approvedRes.data,
        ...rejectedRes.data,
      ].sort((a, b) =>
        new Date(b.reviewedAt || b.requestedAt) -
        new Date(a.reviewedAt || a.requestedAt)
      ).slice(0, 5);
      setRecentActions(combined);
    } catch (err) {
      console.error("Failed to fetch recent actions:", err);
    }
  };

  /* ── Approve ── */
  const handleApprove = async (bookingId) => {
    try {
      await axios.put(`${API_BASE}/bookings/${bookingId}/approve`, {
        hodId:   hodId,
        action:  "APPROVE",
        remarks: remarkMap[bookingId] || "Approved by HOD."
      });
      showToast(`Booking #${bookingId} approved successfully!`, "success");
      // Refresh all data
      fetchPendingRequests();
      fetchStats();
      fetchRecentActions();
    } catch (err) {
      const msg = err.response?.data || "Failed to approve booking.";
      showToast(msg, "error");
    }
  };

  /* ── Reject ── */
  const handleReject = async (bookingId) => {
    const remark = remarkMap[bookingId];
    if (!remark || remark.trim() === "") {
      showToast("Please enter a reason before rejecting.", "error");
      return;
    }
    try {
      await axios.put(`${API_BASE}/bookings/${bookingId}/reject`, {
        hodId:   hodId,
        action:  "REJECT",
        remarks: remark
      });
      showToast(`Booking #${bookingId} rejected.`, "error");
      fetchPendingRequests();
      fetchStats();
      fetchRecentActions();
    } catch (err) {
      const msg = err.response?.data || "Failed to reject booking.";
      showToast(msg, "error");
    }
  };

  /* ── Toast ── */
  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Nav handler ── */
  const handleNav = (item) => {
    setSidebarOpen(false);
    setActiveNav(item.label);
    if (item.label === "Logout") {
      localStorage.removeItem("loggedInUser");
      navigate("/login");
    } else {
      navigate(item.path);
    }
  };

  /* ── Format date ── */
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
  };

  /* ── Format time ── */
  const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${String(h12).padStart(2,"0")}:${String(m).padStart(2,"0")} ${ampm}`;
  };

  /* ── Hall booking badge ── */
  const HallBadge = ({ isHall }) => isHall
    ? <span className="hod-hall-badge">48hr Rule</span>
    : null;

  /* ═══ RENDER ═══ */
  return (
    <div className="hod-root">

      {/* ── Sidebar ── */}
      <aside className={`hod-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="hod-brand">
          <span className="hod-brand-icon"><GridIcon /></span>
          <span className="hod-brand-text">Resource Allocation<br />System</span>
        </div>
        <nav className="hod-nav">
          {NAV_ITEMS.map(({ label, Icon, path }) => (
            <button
              key={label}
              className={`hod-nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => handleNav({ label, path })}
            >
              <span className="hod-nav-icon"><Icon /></span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
  <div
    className="hod-overlay"
    onClick={() => setSidebarOpen(false)}
  />
)}

      {/* ── Main ── */}
      <div className="hod-main">

        {/* Header */}
        <header className="hod-header">
           <div className="hod-header-left">

    <button
      className="hod-menu-btn"
      onClick={() => setSidebarOpen(!sidebarOpen)}
    >
      ☰
    </button>

    <div>
      <h1 className="hod-title">Dashboard</h1>
      <p className="hod-subtitle">
        Welcome back, {hodName}!
      </p>
    </div>

  </div>
          <div className="hod-header-right">
            <button className="hod-notif-btn">
              <BellIcon />
              {stats.pending > 0 && (
                <span className="hod-notif-badge">{stats.pending}</span>
              )}
            </button>
            <div className="hod-user-chip">
              <div className="hod-avatar">{hodInitial}</div>
              <div className="hod-user-text">
                <span className="hod-user-name">{hodName}</span>
                <span className="hod-user-role">HOD</span>
              </div>
              <ChevronDownIcon />
            </div>
          </div>
        </header>

        <div className="hod-content">

          {/* ── Stat Cards ── */}
          <div className="hod-stats">
            <StatCard
              icon={<TotalReqIcon />}   iconBg="hod-stat-icon--blue"
              value={stats.total}       label="Total Requests"   sub="All Time"
            />
            <StatCard
              icon={<PendingReqIcon />} iconBg="hod-stat-icon--orange"
              value={stats.pending}     label="Pending"          sub="Need Approval"
            />
            <StatCard
              icon={<ApprovedReqIcon />} iconBg="hod-stat-icon--green"
              value={stats.approved}    label="Approved"         sub="This Dept"
            />
            <StatCard
              icon={<TotalResIcon />}   iconBg="hod-stat-icon--teal"
              value={stats.rejected}    label="Rejected"         sub="This Dept"
            />
          </div>

          {/* ── Pending Requests Table ── */}
          <div className="hod-table-section">
            <div className="hod-table-header">
              <div>
                <h2 className="hod-table-title">Pending Requests</h2>
                <p className="hod-table-sub">
                  Review and action faculty booking requests for {hodDepartment}.
                </p>
              </div>
              <span className="hod-pending-pill">{stats.pending} Pending</span>
            </div>

            {loading ? (
              <div className="hod-empty">
                <p style={{ color: "#6b7280" }}>Loading requests…</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="hod-empty">
                <AllDoneIcon />
                <p>All requests have been actioned. Nothing pending!</p>
              </div>
            ) : (
              <div className="hod-table-wrap">
                <table className="hod-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Resource</th>
                      <th>Requested By</th>
                      <th>Date</th>
                      <th>Slot / Time</th>
                      <th>Purpose</th>
                      <th>Remarks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.bookingId} className="hod-tr">
                        <td>
                          <span className="hod-req-id">#{r.bookingId}</span>
                          <HallBadge isHall={r.hallBooking} />
                        </td>
                        <td>
                          <span className="hod-resource-name">{r.resourceName}</span>
                          <br />
                          <span style={{ fontSize: "11px", color: "#6b7280" }}>
                            {r.resourceType}
                          </span>
                        </td>
                        <td>
                          <span className="hod-faculty-name">{r.facultyName}</span>
                        </td>
                        <td>
                          <span className="hod-date">{formatDate(r.bookingDate)}</span>
                        </td>
                        <td>
                          <span className="hod-time">
                            {r.lectureSlot}<br />
                            <span style={{ fontSize: "11px", color: "#6b7280" }}>
                              {formatTime(r.startTime)} – {formatTime(r.endTime)}
                            </span>
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "12px", color: "#374151" }}>
                            {r.purpose}
                          </span>
                        </td>
                        <td>
                          {/* HOD types a remark before approving/rejecting */}
                          <input
                            type="text"
                            className="hod-remark-input"
                            placeholder="Add remark…"
                            value={remarkMap[r.bookingId] || ""}
                            onChange={e => setRemarkMap(prev => ({
                              ...prev,
                              [r.bookingId]: e.target.value
                            }))}
                          />
                        </td>
                        <td>
                          <div className="hod-action-btns">
                            <button
                              className="hod-btn-approve"
                              onClick={() => handleApprove(r.bookingId)}
                            >
                              <CheckSmallIcon /> Approve
                            </button>
                            <button
                              className="hod-btn-reject"
                              onClick={() => handleReject(r.bookingId)}
                            >
                              <XSmallIcon /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Recent Actions ── */}
          {recentActions.length > 0 && (
            <div className="hod-activity-section">
              <h2 className="hod-table-title" style={{ marginBottom: "14px" }}>
                Recent Actions
              </h2>
              <div className="hod-activity-list">
                {recentActions.map(r => (
                  <div
                    key={r.bookingId}
                    className={`hod-activity-row hod-activity-row--${r.status.toLowerCase()}`}
                  >
                    <span className={`hod-activity-dot hod-activity-dot--${r.status.toLowerCase()}`} />
                    <span className="hod-activity-id">#{r.bookingId}</span>
                    <span className="hod-activity-resource">{r.resourceName}</span>
                    <span className="hod-activity-by">{r.facultyName}</span>
                    <span className="hod-activity-time">
                      {formatTime(r.startTime)} – {formatTime(r.endTime)}
                    </span>
                    <span className={`hod-activity-badge hod-activity-badge--${r.status.toLowerCase()}`}>
                      {r.status === "APPROVED" ? "Approved" : "Rejected"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`hod-toast hod-toast--${toast.type}`}>
          {toast.type === "success" ? <CheckSmallIcon /> : <XSmallIcon />}
          &nbsp;{toast.msg}
        </div>
      )}

    </div>
  );
}

/* ─── Stat Card ─────────────────────────────── */
function StatCard({ icon, iconBg, value, label, sub }) {
  return (
    <div className="hod-stat">
      <div className={`hod-stat-icon ${iconBg}`}>{icon}</div>
      <div className="hod-stat-body">
        <span className="hod-stat-label">{label}</span>
        <span className="hod-stat-value">{value}</span>
        <span className="hod-stat-sub">{sub}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SVG ICONS
═══════════════════════════════════════════════ */
function GridIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor"/><rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor"/><rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor"/><rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor"/></svg>;
}
function HomeIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>;
}
function UploadNavIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
}
function BookingsIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function ResourcesIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
}
function ProfileIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
}
function LogoutIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function BellIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>;
}
function ChevronDownIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>;
}
function CheckSmallIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
}
function XSmallIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function TotalReqIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}
function PendingReqIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>;
}
function ApprovedReqIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><polyline points="9 12 11 14 15 10"/></svg>;
}
function TotalResIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
}
function AllDoneIcon() {
  return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.4"><circle cx="12" cy="12" r="9"/><polyline points="9 12 11 14 15 10"/></svg>;
}