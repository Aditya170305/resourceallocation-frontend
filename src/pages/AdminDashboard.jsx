import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:8080/api";

const NAV_ITEMS = [
  { label: "Dashboard",        Icon: DashboardIcon,  path: "/admin-dashboard"   },
  { label: "Manage Resources", Icon: ResourceIcon,   path: "/admin-resources"   },
  { label: "Manage Users",     Icon: UsersNavIcon,  path: "/admin-users"      },
  { label: "Profile",          Icon: ProfileIcon,    path: "/admin-profile"     },
  { label: "Logout",           Icon: LogoutIcon,     path: "/login"             },
];

const DEPARTMENTS = [
  "All Departments",
  "Computer Science and Engineering",
  "Electronics and Communication Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Mechanical Engineering",
  "Artificial Intelligence and Machine Learning",
  "Artificial Intelligence and Data Science",
  "Cyber Security",
  "Information Technology",
  "Chemical Engineering",
];

const STATUS_OPTIONS = ["All Status", "APPROVED", "REJECTED", "PENDING", "CANCELLED"];

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
  const adminName    = loggedInUser.fullName || "Admin";
  const adminInitial = adminName.charAt(0).toUpperCase();

  const [activeNav,    setActiveNav]    = useState("Dashboard");
  const [bookings,     setBookings]     = useState([]);
  const [stats,        setStats]        = useState({ total: 0, active: 0, approved: 0, rejected: 0 });
  const [deptFilter,   setDeptFilter]   = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [searchQ,      setSearchQ]      = useState("");
  const [loading,      setLoading]      = useState(true);
  const [totalUsers,   setTotalUsers]   = useState(0);
  const [totalRes,     setTotalRes]     = useState(0);

  const [departments, setDepartments] =
    useState([]);

  const [selectedDepartment,
  setSelectedDepartment] =
    useState("All Departments");

  const [selectedStatus,
  setSelectedStatus] =
  useState("All Status");

  const fetchDepartments = async () => {

  try {

    const res = await axios.get(
      "http://localhost:8080/api/resources/departments"
    );

    setDepartments(res.data);

  } catch (err) {

    console.error(err);

  }
};

  const fetchBookings = async () => {
  try {

    const res = await axios.get(
      "http://localhost:8080/api/admin/bookings",
      {
        params: {
          department: selectedDepartment,
          status: selectedStatus
        }
      }
    );

    const data = res.data;

    setBookings(data);

    setStats({
      total: data.length,

      pending: data.filter(
        b => b.status?.toUpperCase() === "PENDING"
      ).length,

      approved: data.filter(
        b => b.status?.toUpperCase() === "APPROVED"
      ).length,

      rejected: data.filter(
        b =>
          b.status?.toUpperCase() === "REJECTED" ||
          b.status?.toUpperCase() === "CANCELLED"
      ).length
    });

  } catch (err) {
    console.error(err);
  }
};

const fetchDashboardCounts = async () => {

  try {

    // RESOURCES COUNT
    const resourceRes =
      await axios.get(
        "http://localhost:8080/api/resources/count",
        {
          params: {
            department: selectedDepartment
          }
        }
      );

    setTotalRes(resourceRes.data);

    // USERS COUNT
    const usersRes =
      await axios.get(
        "http://localhost:8080/api/users/count",
        {
          params: {
            department: selectedDepartment
          }
        }
      );

    setTotalUsers(usersRes.data);

  } catch (err) {

    console.error(err);

  }
};

useEffect(() => {

  fetchDepartments();

}, []);

useEffect(() => {

  fetchBookings();

}, [
  selectedDepartment,
  selectedStatus
]);

useEffect(() => {

  fetchDashboardCounts();

}, [selectedDepartment]);


  /* ── Fetch on mount ── */
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      /* Fetch bookings for all departments in parallel */
      const allBookingsRes = await axios.get(`${API_BASE}/bookings/admin/all`);
      const all = allBookingsRes.data || [];
      setBookings(all);

      setStats({
        total:    all.length,
        active:   all.filter(b => b.status === "PENDING").length,
        approved: all.filter(b => b.status === "APPROVED").length,
        rejected: all.filter(b => b.status === "REJECTED" || b.status === "CANCELLED").length,
      });

      /* Fetch total resources count */
      try {
        const resRes = await axios.get(`${API_BASE}/resources/count`);
        setTotalRes(resRes.data || 0);
      } catch { setTotalRes(bookings.length); }

      /* Fetch total users count */
      try {
        const userRes = await axios.get(`${API_BASE}/users/count`);
        setTotalUsers(userRes.data || 0);
      } catch { setTotalUsers(0); }

    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Filtered bookings ── */
  const filtered = bookings.filter(b => {
    // const deptMatch   = deptFilter   === "All Departments" || b.department === deptFilter;
    const deptMatch =
  selectedDepartment === "All Departments" ||
  b.department === selectedDepartment;
    // const statusMatch = statusFilter === "All Status"      || b.status     === statusFilter;
    const statusMatch =
  selectedStatus === "All Status" ||
  b.status === selectedStatus;
    const searchMatch = !searchQ.trim() ||
      b.facultyName?.toLowerCase().includes(searchQ.toLowerCase()) ||
      b.resourceName?.toLowerCase().includes(searchQ.toLowerCase()) ||
      b.department?.toLowerCase().includes(searchQ.toLowerCase());
    return deptMatch && statusMatch && searchMatch;
  });

  /* ── Sort: latest first ── */
  const sorted = [...filtered].sort((a, b) =>
    new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0)
  ).slice(0, 50);

  /* ── Nav ── */
  const handleNav = (item) => {
    setActiveNav(item.label);
    if (item.label === "Logout") {
      localStorage.removeItem("loggedInUser");
      navigate("/login");
    } else {
      navigate(item.path);
    }
  };

  /* ── Format date ── */
  const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  /* ── Dept abbreviation ── */
  const deptShort = (dept) => {
    const map = {
      "Computer Science and Engineering": "CSE",
      "Electronics and Communication Engineering": "ECE",
      "Electrical Engineering": "EE",
      "Civil Engineering": "Civil",
      "Mechanical Engineering": "Mech",
      "Artificial Intelligence and Machine Learning": "AI & ML",
      "Artificial Intelligence and Data Science": "AI & DS",
      "Cyber Security": "Cyber",
      "Information Technology": "IT",
      "Chemical Engineering": "Chem",
    };
    return map[dept] || dept || "—";
  };

  /* ═══ RENDER ═══ */
  return (
    <div className="ad-root">

      {/* ── Sidebar ── */}
      <aside className="ad-sidebar">
        <div className="ad-brand">
          <span className="ad-brand-icon"><GridIcon /></span>
          <span className="ad-brand-text">Resource Allocation<br />System</span>
        </div>
        <nav className="ad-nav">
          {NAV_ITEMS.map(({ label, Icon, path }) => (
            <button
              key={label}
              className={`ad-nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => handleNav({ label, path })}
            >
              <span className="ad-nav-icon"><Icon /></span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main ── */}
      <main className="ad-main">

        {/* Header */}
        <header className="ad-header">
          <div>
            <h1 className="ad-title">Dashboard</h1>
            <p className="ad-subtitle">System-wide overview — all departments &amp; resources.</p>
          </div>
          <div className="ad-user-card">
            <div className="ad-avatar">{adminInitial}</div>
            <div className="ad-user-info">
              <span className="ad-user-name">{adminName}</span>
              <span className="ad-user-role">Administrator</span>
            </div>
            <ChevronIcon />
          </div>
        </header>

        {/* ── Stat Cards ── */}
        <section className="ad-stats-grid">
          <StatCard title="Total Resources"  value={totalRes || "—"}        sub="All Resources"     Icon={ResourceCardIcon} color="blue"   />
          <StatCard title="Pending Requests" value={stats.active}           sub="Need Action"        Icon={PendingIcon}      color="orange" />
          <StatCard title="Approved"         value={stats.approved}         sub="This Month"         Icon={ApprovedIcon}     color="green"  />
          <StatCard title="Total Users"      value={totalUsers || "—"}      sub="Faculty + HOD"      Icon={UsersIcon}        color="purple" />
        </section>

        {/* ── Recent Activity ── */}
        <section className="ad-section">

          {/* Section header */}
          <div className="ad-section-header">
            <div>
              <h2 className="ad-section-title">Recent Booking Activity</h2>
              <p className="ad-section-sub">Live feed of all booking requests across departments.</p>
            </div>
            <button className="ad-refresh-btn" onClick={fetchAll}>
              <RefreshIcon /> Refresh
            </button>
          </div>

          {/* Filters row */}
          <div className="ad-filters-row">
            {/* Search */}
            <div className="ad-search-wrap">
              <SearchIcon />
              <input
                className="ad-search"
                placeholder="Search by faculty, resource, department…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
              {searchQ && (
                <button className="ad-search-clear" onClick={() => setSearchQ("")}>
                  <XIcon />
                </button>
              )}
            </div>

            {/* Department filter */}
            <div className="ad-filter-group">
              <FilterIcon />
              <select
                className="ad-filter-select"
                value={selectedDepartment}
                onChange={(e) =>
                  setSelectedDepartment(
                    e.target.value
                  )
                }
              >

                <option>
                  All Departments
                </option>

                {departments.map((dept) => (

                  <option
                    key={dept}
                    value={dept}
                  >
                    {dept}
                  </option>

                ))}

              </select>
            </div>

            {/* Status filter */}
            <select
              className="ad-filter-select ad-filter-select--status"
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(
                  e.target.value
                )
              }
            >

              <option>
                All Status
              </option>

              <option>
                Pending
              </option>

              <option>
                Approved
              </option>

              <option>
                Rejected
              </option>

              <option>
                Cancelled
              </option>

            </select>
          </div>

          {/* Results count */}
          <div className="ad-results-bar">
            Showing <strong>{sorted.length}</strong> of <strong>{filtered.length}</strong> bookings
            {selectedDepartment !== "All Departments" && (
              <span className="ad-active-filter"> · {deptFilter}</span>
            )}
          </div>

          {/* Table */}
          <div className="ad-table-wrapper">
            {loading ? (
              <div className="ad-loading">
                <div className="ad-spinner" />
                <p>Loading activity…</p>
              </div>
            ) : sorted.length === 0 ? (
              <div className="ad-empty">
                <EmptyIcon />
                <p>No bookings match your filters.</p>
              </div>
            ) : (
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Faculty</th>
                    <th>Resource</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Lecture Slot</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>

                    {sorted.map((booking) => (

                      <tr
                        key={booking.bookingId}
                        className="ad-tr"
                      >

                        <td>
                          <span className="ad-booking-id">
                            #{booking.bookingId}
                          </span>
                        </td>

                        <td>

                          <div className="ad-faculty-cell">

                            <div className="ad-faculty-avatar">

                              {
                                booking.facultyName
                                  ?.charAt(0)
                              }

                            </div>

                            <div className="ad-faculty-name">
                              {booking.facultyName}
                            </div>

                          </div>

                        </td>

                        <td>

                          <div className="ad-resource-name">
                            {booking.resourceName}
                          </div>

                        </td>

                        <td>

                          <span className="ad-dept-badge">
                            {booking.department}
                          </span>

                        </td>

                        <td>
                          <span
                            className={`ad-badge ad-badge--${booking.status.toLowerCase()}`}
                          >
                            {booking.status}
                          </span>
                        </td>

                      </tr>

                    ))}

                  </tbody>
              </table>
            )}
          </div>

        </section>
      </main>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ title, value, sub, Icon, color }) {
  return (
    <div className="ad-stat-card">
      <div className={`ad-stat-icon ad-stat-icon--${color}`}>
        <Icon />
      </div>
      <div className="ad-stat-content">
        <span className="ad-stat-title">{title}</span>
        <span className="ad-stat-value">{value}</span>
        <span className="ad-stat-sub">{sub}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SVG ICONS
═══════════════════════════════════════════════════════════ */
function GridIcon()        { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor"/><rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor"/><rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor"/><rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor"/></svg>; }
function DashboardIcon()   { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>; }
function ResourceIcon()    { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function ProfileIcon()     { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7"/></svg>; }
function LogoutIcon()      { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function ChevronIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>; }
function SearchIcon()      { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>; }
function FilterIcon()      { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>; }
function XIcon()           { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function CheckIcon()       { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>; }
function ClockIcon()       { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>; }
function RefreshIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>; }
function EmptyIcon()       { return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.4"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function ResourceCardIcon(){ return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function PendingIcon()     { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>; }
function ApprovedIcon()    { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><polyline points="9 12 11 14 15 10"/></svg>; }
function UsersIcon()       { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>; }
function UsersNavIcon()   { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>; }
