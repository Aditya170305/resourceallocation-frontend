import React, { useState, useEffect } from "react";
import "./FacultyDashboard.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// const API_BASE = "http://localhost:8080/api";
const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const NAV_ITEMS = [
  { label: "Dashboard",      icon: HomeIcon,     path: "/faculty-dashboard" },
  { label: "Show Resources", icon: SearchIcon,   path: "/show-resources"    },
  { label: "My Requests",    icon: RequestsIcon, path: "/my-requests"       },
  { label: "Profile",        icon: ProfileIcon,  path: "/faculty-profile"   },
  { label: "Logout",         icon: LogoutIcon,   path: "/login"             },
];

/* lecture slot labels exactly matching the DB enum */
const LECTURE_LABELS = [
  "Lecture - 1",
  "Lecture - 2",
  "Lecture - 3",
  "Lecture - 4",
  "Lecture - 5",
  "Lecture - 6",
];

/* ─── Helper: "10:00" → "10:00 AM" ─── */
function to12h(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${String(h12).padStart(2,"0")}:${String(m).padStart(2,"0")} ${ampm}`;
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function FacultyDashboard() {
  const navigate = useNavigate();

  /* ── Read logged-in faculty ── */
  const loggedInUser  = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
  const facultyId     = loggedInUser.id;
  const facultyName   = loggedInUser.fullName  || "Faculty";
  const facultyDept   = loggedInUser.department || "";

  /* ── State ── */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav,      setActiveNav]      = useState("Dashboard");
  const [loading,        setLoading]        = useState(true);
  const [stats,          setStats]          = useState({ total: 0, approved: 0, pending: 0, cancelled: 0 });
  /* scheduleRows: array of FacultyScheduleDTO from API */
  const [scheduleRows,   setScheduleRows]   = useState([]);

  /* ── Fetch on mount ── */
  useEffect(() => {
    if (!facultyId) { navigate("/login"); return; }
    fetchDashboardData();
  }, []);

  // ── Replace ONLY the fetchDashboardData function in FacultyDashboard.jsx ──
// Everything else stays the same.

const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Booking stats
      const statRes = await axios.get(`${API_BASE}/bookings/my/stats`, {
        params: { facultyId }
      });
      setStats({
        total:     statRes.data.total,
        approved:  statRes.data.approved,
        pending:   statRes.data.pending,
        cancelled: (statRes.data.cancelled || 0) + (statRes.data.rejected || 0),
      });

      // 2. Faculty schedule from timetable_entries
      //    Returns only resources where this faculty has lectures.
      //    Each row has 6 SlotInfo: { hasClass, startTime, endTime, classType, lectureSlot }
      const schedRes = await axios.get(`${API_BASE}/resources/faculty-schedule`, {
        params: { facultyName }   // e.g. "Dr. Emily Davis"
      });
      setScheduleRows(schedRes.data);

    } catch (err) {
      console.error("Dashboard fetch error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
};

  const handleNav = (item) => {
    setActiveNav(item.label);
    if (item.label === "Logout") {
      localStorage.removeItem("loggedInUser");
      navigate("/login");
    } else {
      navigate(item.path);
    }
  };

  /* ── Render ── */
  return (
    <div className="fd-root">

      {/* Sidebar */}
      <aside className={`fd-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="fd-brand">
          <span className="fd-brand-icon"><GridIcon /></span>
          <span className="fd-brand-text">Resource Allocation<br />System</span>
        </div>
        <nav className="fd-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`fd-nav-item ${activeNav === item.label ? "active" : ""}`}
              onClick={() => handleNav(item)}
            >
              <span className="fd-nav-icon"><item.icon /></span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
          <div
            className="fd-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

      {/* Main */}
      <main className="fd-main">

        {/* Header */}
        <header className="fd-header">
          <button
              className="fd-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <GridIcon />
            </button>
          <div className="fd-welcome">
            <h1>Welcome back, {facultyName}!</h1>
            <p>Here's an overview of your resources and bookings.</p>
          </div>
          <div className="fd-header-right">
            <button className="fd-notif-btn">
              <BellIcon />
              {stats.pending > 0 && (
                <span className="fd-notif-badge">{stats.pending}</span>
              )}
            </button>
            <div className="fd-user-info">
              <div className="fd-avatar">{facultyName.charAt(0).toUpperCase()}</div>
              <div className="fd-user-text">
                <span className="fd-user-name">{facultyName}</span>
                <span className="fd-user-role">Faculty</span>
              </div>
              <ChevronIcon />
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="fd-stats-grid">
          <StatCard icon={<BookingCardIcon />}   iconBg="var(--stat-blue-bg)"
            value={stats.total}     label="My Bookings"  sub="Total Requests"    />
          <StatCard icon={<RequestCardIcon />}   iconBg="var(--stat-orange-bg)"
            value={stats.pending}   label="My Requests"  sub="Pending Approval"  />
          <StatCard icon={<ApprovedCardIcon />}  iconBg="var(--stat-green-bg)"
            value={stats.approved}  label="Approved"     sub="Confirmed Slots"   />
          <StatCard icon={<CancelledCardIcon />} iconBg="var(--stat-red-bg)"
            value={stats.cancelled} label="Cancelled"    sub="Declined/Revoked"  />
        </section>

        {/* Today's Schedule */}
        <section className="fd-avail-section">
          <div className="fd-avail-header">
            <div>
              <h2 className="fd-avail-title">Today's Class Schedule</h2>
              <p className="fd-avail-sub">
                Your lecture slots across all assigned resources.
              </p>
            </div>
            <button
              className="fd-view-calendar-btn"
              onClick={() => navigate("/show-resources")}
            >
              <CalendarIcon /> View Calendar
            </button>
          </div>

          <div className="fd-table-wrapper">
            {loading ? (
              <div className="fd-loading-msg">Loading schedule…</div>
            ) : scheduleRows.length === 0 ? (
              <div className="fd-empty-msg">
                No classes scheduled for you yet. Contact your HOD to upload the timetable.
              </div>
            ) : (
              <table className="fd-table">
                <thead>
                  <tr>
                    <th className="fd-th-resource">Resource</th>
                    {LECTURE_LABELS.map(l => (
                      <th key={l} className="fd-th-date">
                        <span className="fd-date-label">{l}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scheduleRows.map((row) => (
                    <tr key={row.resourceId} className="fd-tr">
                      <td className="fd-td-resource">
                        <span className="fd-resource-name">{row.resourceName}</span>
                        {row.resourceType && (
                          <span className="fd-resource-type">{row.resourceType}</span>
                        )}
                      </td>

                      {row.slots.map((slot, idx) => (
                        <td key={idx} className="fd-td-status">
                          {slot.hasClass ? (
                            /* ── Faculty HAS a class in this slot ── */
                            <div className="fd-slot-class">
                              <span className="fd-slot-time">
                                {to12h(slot.startTime)} – {to12h(slot.endTime)}
                              </span>
                              {slot.classType && (
                                <span className="fd-slot-type">{slot.classType}</span>
                              )}
                            </div>
                          ) : (
                            /* ── Empty slot ── */
                            <span className="fd-badge fd-badge--empty">Empty</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Legend */}
          <div className="fd-legend">
            <span className="fd-legend-item">
              <span className="fd-dot fd-dot--empty" />Empty
            </span>
            <span className="fd-legend-item">
              <span className="fd-dot fd-dot--class" />Your Class
            </span>
          </div>
        </section>

      </main>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ icon, iconBg, value, label, sub }) {
  return (
    <div className="fd-stat-card">
      <div className="fd-stat-icon" style={{ background: iconBg }}>{icon}</div>
      <div className="fd-stat-body">
        <span className="fd-stat-label">{label}</span>
        <span className="fd-stat-value">{value}</span>
        <span className="fd-stat-sub">{sub}</span>
      </div>
    </div>
  );
}

/* ── SVG Icons ── */
function GridIcon() {
  return (<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor"/><rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor"/><rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor"/><rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor"/></svg>);
}
function HomeIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>);
}
function SearchIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>);
}
function RequestsIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>);
}
function ProfileIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>);
}
function LogoutIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
}
function BellIcon() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>);
}
function ChevronIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>);
}
function CalendarIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
}
function BookingCardIcon() {
  return (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
}
function RequestCardIcon() {
  return (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>);
}
function ApprovedCardIcon() {
  return (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><polyline points="9 12 11 14 15 10"/></svg>);
}
function CancelledCardIcon() {
  return (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>);
}