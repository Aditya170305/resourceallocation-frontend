import React, { useState, useEffect } from "react";
import "./AdminManageUsers.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:8080/api";

/* ─── Sidebar Nav ─────────────────────────────── */
const NAV_ITEMS = [
  { label: "Dashboard",        Icon: DashboardIcon, path: "/admin-dashboard"  },
  { label: "Manage Resources", Icon: ResourceIcon,  path: "/admin-resources"  },
  { label: "Manage Users",     Icon: UsersNavIcon,  path: "/admin-users"      },
  { label: "Profile",          Icon: ProfileIcon,   path: "/admin-profile"    },
  { label: "Logout",           Icon: LogoutIcon,    path: "/login"            },
];

const DEPARTMENTS = [
  "All Departments",
  "Computer Science and Engineering",
  "Electronics and Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Artificial Intelligence and ML",
  "AI and Data Science",
  "Cyber Security",
  "Physics",
  "Chemistry",
  "General",
];

const ROLES = ["All Roles", "Faculty", "HOD"];

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function AdminManageUsers() {
  const navigate = useNavigate();

  /* ── Read admin from localStorage ── */
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
  const adminName    = loggedInUser.fullName || "Admin";
  const adminInitial = adminName.charAt(0).toUpperCase();

  /* ── State ── */
  const [activeNav,   setActiveNav]   = useState("Manage Users");
  const [users,       setUsers]       = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [deptFilter,  setDeptFilter]  = useState("All Departments");
  const [roleFilter,  setRoleFilter]  = useState("All Roles");
  const [searchText,  setSearchText]  = useState("");
  const [stats,       setStats]       = useState({ total: 0, faculty: 0, hod: 0 });
  const [deleteId,    setDeleteId]    = useState(null);
  const [toast,       setToast]       = useState(null);
  const [viewMode,    setViewMode]    = useState("table"); // "table" | "card"

  /* ── Fetch on mount ── */
  useEffect(() => {
  fetchUsers();
}, []);

useEffect(() => {
  fetchStats();
}, [deptFilter]);

  /* ── Apply filters whenever users/filters change ── */
  useEffect(() => {
    let list = [...users];

    if (deptFilter !== "All Departments")
      list = list.filter(u => u.department === deptFilter);

    if (roleFilter !== "All Roles")
      list = list.filter(u => u.role === roleFilter);

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(u =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q)
      );
    }

    setFiltered(list);
  }, [users, deptFilter, roleFilter, searchText]);

  /* ────────────────────────────────────────────
     FETCH USERS
  ──────────────────────────────────────────── */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/users/all`);
      // Only show Faculty and HOD (not Admin)
      const usersData = res.data.filter(
        u => u.role === "Faculty" || u.role === "HOD"
      );
      setUsers(usersData);
    } catch (err) {
      console.error("Fetch users error:", err);
      showToast("Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ────────────────────────────────────────────
     FETCH STATS
  ──────────────────────────────────────────── */
  const fetchStats = async () => {

  try {

    const res = await axios.get(
      `${API_BASE}/users/stats`,
      {
        params: {
          department: deptFilter
        }
      }
    );

    setStats({
      total:   res.data.total   || 0,
      faculty: res.data.faculty || 0,
      hod:     res.data.hod     || 0,
    });

  } catch (err) {

    console.error("Fetch stats error:", err);

  }
};

  /* ────────────────────────────────────────────
     DELETE USER
  ──────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_BASE}/users/${deleteId}`);
      showToast("User deleted successfully.", "success");
      setDeleteId(null);
      fetchUsers();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data || "Failed to delete user.", "error");
      setDeleteId(null);
    }
  };

  /* ── Toast ── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Nav ── */
  const handleNav = (label, path) => {
    setActiveNav(label);
    if (label === "Logout") {
      localStorage.removeItem("loggedInUser");
      navigate("/login");
    } else {
      navigate(path);
    }
  };

  /* ── Department breakdown ── */
  const deptBreakdown = users.reduce((acc, u) => {
    const dept = u.department || "Unknown";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  /* ── Role color ── */
  const roleColor = (role) => {
    if (role === "HOD")     return "au-role-badge--hod";
    if (role === "Faculty") return "au-role-badge--faculty";
    return "au-role-badge--other";
  };

  /* ── Avatar initials ── */
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  /* ── Avatar color by name ── */
  const AVATAR_COLORS = [
    "#2563eb","#7c3aed","#db2777","#16a34a",
    "#d97706","#0891b2","#dc2626","#059669",
  ];
  const avatarColor = (name) => {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  };

  /* ═══ RENDER ═══ */
  return (
    <div className="au-root">

      {/* ── Sidebar ── */}
      <aside className="au-sidebar">
        <div className="au-brand">
          <span className="au-brand-icon"><GridIcon /></span>
          <span className="au-brand-text">Resource Allocation<br />System</span>
        </div>
        <nav className="au-nav">
          {NAV_ITEMS.map(({ label, Icon, path }) => (
            <button
              key={label}
              className={`au-nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => handleNav(label, path)}
            >
              <span className="au-nav-icon"><Icon /></span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main ── */}
      <div className="au-main">

        {/* Header */}
        <header className="au-header">
          <div>
            <h1 className="au-title">Manage Users</h1>
            <p className="au-subtitle">
              View all Faculty and HOD members across departments.
            </p>
          </div>
          <div className="au-header-right">
            <button className="au-notif-btn"><BellIcon /></button>
            <div className="au-user-chip">
              <div className="au-avatar-sm"
                style={{ background: "#2563eb" }}>
                {adminInitial}
              </div>
              <div className="au-user-text">
                <span className="au-user-name">{adminName}</span>
                <span className="au-user-role">Administrator</span>
              </div>
              <ChevronDownIcon />
            </div>
          </div>
        </header>

        <div className="au-content">

          {/* ── Stat Cards ── */}
          <div className="au-stats">
            <StatCard
              icon={<TotalUsersIcon />} bg="#eff6ff"
              value={stats.total} label="Total Users" sub="Faculty + HOD"
            />
            <StatCard
              icon={<FacultyIcon />} bg="#f0fdf4"
              value={stats.faculty} label="Faculty" sub="Teaching Staff"
            />
            <StatCard
              icon={<HodIcon />} bg="#fef9c3"
              value={stats.hod} label="HOD" sub="Dept Heads"
            />
            <StatCard
              icon={<DeptCountIcon />} bg="#f5f3ff"
              value={Object.keys(deptBreakdown).length}
              label="Departments" sub="With Users"
            />
          </div>

          {/* ── Department Quick Filter Chips ── */}
          <div className="au-dept-chips">
            <button
              className={`au-chip ${deptFilter === "All Departments" ? "active" : ""}`}
              onClick={() => setDeptFilter("All Departments")}
            >
              All ({users.length})
            </button>
            {Object.entries(deptBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([dept, count]) => (
                <button
                  key={dept}
                  className={`au-chip ${deptFilter === dept ? "active" : ""}`}
                  onClick={() => setDeptFilter(dept)}
                >
                  {dept.length > 30 ? dept.substring(0, 28) + "…" : dept} ({count})
                </button>
              ))
            }
          </div>

          {/* ── Toolbar ── */}
          <div className="au-toolbar">
            <div className="au-search-box">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search by name, email, username…"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
              {searchText && (
                <button className="au-search-clear" onClick={() => setSearchText("")}>
                  <XIcon />
                </button>
              )}
            </div>

            {/* Department filter */}
            <select
              className="au-select au-select--dept"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>

            {/* Role filter */}
            <select
              className="au-select"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>

            {/* View toggle */}
            <div className="au-view-toggle">
              <button
                className={viewMode === "table" ? "active" : ""}
                onClick={() => setViewMode("table")}
                title="Table view"
              ><ListIcon /></button>
              <button
                className={viewMode === "card" ? "active" : ""}
                onClick={() => setViewMode("card")}
                title="Card view"
              ><GridViewIcon /></button>
            </div>

            <span className="au-count-label">
              Showing <strong>{filtered.length}</strong> of <strong>{users.length}</strong> users
            </span>
          </div>

          {/* ── Users Table ── */}
          {loading ? (
            <div className="au-loading">Loading users…</div>
          ) : filtered.length === 0 ? (
            <div className="au-empty">
              <EmptyIcon />
              <p>No users found{searchText ? ` for "${searchText}"` : ""}.</p>
            </div>
          ) : viewMode === "table" ? (

            /* ── TABLE VIEW ── */
            <div className="au-table-wrap">
              <table className="au-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id} className="au-tr">
                      <td>
                        <div className="au-user-cell">
                          <div
                            className="au-avatar"
                            style={{ background: avatarColor(u.fullName) }}
                          >
                            {getInitials(u.fullName)}
                          </div>
                          <span className="au-full-name">{u.fullName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="au-username">@{u.username}</span>
                      </td>
                      <td>
                        <span className={`au-role-badge ${roleColor(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className="au-dept-text">{u.department || "—"}</span>
                      </td>
                      <td>
                        <span className="au-email">{u.email}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: "13px", color: "#6b7280" }}>
                          {u.phone || "—"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="au-delete-btn"
                          onClick={() => setDeleteId(u.id)}
                        >
                          <TrashIcon /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          ) : (

            /* ── CARD VIEW ── */
            <div className="au-card-grid">
              {filtered.map(u => (
                <div key={u.id} className="au-user-card">
                  <div className="au-user-card-header">
                    <div
                      className="au-avatar-lg"
                      style={{ background: avatarColor(u.fullName) }}
                    >
                      {getInitials(u.fullName)}
                    </div>
                    <button
                      className="au-card-delete"
                      onClick={() => setDeleteId(u.id)}
                      title="Remove user"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  <h3 className="au-card-name">{u.fullName}</h3>
                  <p className="au-card-username">@{u.username}</p>
                  <span className={`au-role-badge ${roleColor(u.role)}`}>
                    {u.role}
                  </span>
                  <div className="au-card-info">
                    <span><DeptIcon /> {u.department || "—"}</span>
                    <span><EmailIcon /> {u.email}</span>
                    {u.phone && <span><PhoneIcon /> {u.phone}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── Delete Confirm Modal ── */}
      {deleteId && (
        <div className="au-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="au-modal" onClick={e => e.stopPropagation()}>
            <div className="au-modal-header">
              <h2>Remove User</h2>
              <button className="au-modal-close" onClick={() => setDeleteId(null)}>
                <XIcon />
              </button>
            </div>
            <div className="au-modal-body">
              <p>
                Are you sure you want to remove this user from the system?
                Their booking history will be retained but they will no longer
                be able to log in.
              </p>
            </div>
            <div className="au-modal-footer">
              <button className="au-modal-cancel" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button className="au-modal-delete" onClick={handleDelete}>
                <TrashIcon /> Remove User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`au-toast au-toast--${toast.type}`}>
          {toast.type === "success" ? <CheckIcon /> : <WarnIcon />}
          &nbsp;{toast.msg}
        </div>
      )}
    </div>
  );
}

/* ─── Stat Card ── */
function StatCard({ icon, bg, value, label, sub }) {
  return (
    <div className="au-stat">
      <div className="au-stat-icon" style={{ background: bg }}>{icon}</div>
      <div className="au-stat-body">
        <span className="au-stat-value">{value}</span>
        <span className="au-stat-label">{label}</span>
        <span className="au-stat-sub">{sub}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SVG ICONS
═══════════════════════════════════════════════ */
function GridIcon()       { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor"/><rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor"/><rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor"/><rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor"/></svg>; }
function DashboardIcon()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>; }
function ResourceIcon()   { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function UsersNavIcon()   { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>; }
function ProfileIcon()    { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7"/></svg>; }
function LogoutIcon()     { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function BellIcon()       { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
function ChevronDownIcon(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>; }
function SearchIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>; }
function XIcon()          { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function TrashIcon()      { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>; }
function CheckIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>; }
function WarnIcon()       { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>; }
function ListIcon()       { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>; }
function GridViewIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function EmptyIcon()      { return <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>; }
function TotalUsersIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>; }
function FacultyIcon()    { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7"/></svg>; }
function HodIcon()        { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8"><path d="M12 2l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6z"/></svg>; }
function DeptCountIcon()  { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function DeptIcon()       { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>; }
function EmailIcon()      { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>; }
function PhoneIcon()      { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.17 9.19a19.79 19.79 0 01-3.07-8.63A2 2 0 012.08 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.1 6.1l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>; }