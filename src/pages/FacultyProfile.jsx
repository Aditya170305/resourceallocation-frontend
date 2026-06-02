import React, { useState, useEffect } from "react";
import "./HodProfile.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// const API_BASE = "http://localhost:8080/api";
const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const DEPARTMENTS = [
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

/* ─── Nav configs per role ─────────────────────────────── */
const FACULTY_NAV = [
  { label: "Dashboard",      Icon: HomeIcon,    path: "/faculty-dashboard" },
  { label: "Show Resources", Icon: SearchIcon,  path: "/show-resources"    },
  { label: "My Requests",    Icon: RequestIcon, path: "/my-requests"       },
  { label: "Profile",        Icon: ProfileIcon, path: "/faculty-profile"           },
  { label: "Logout",         Icon: LogoutIcon,  path: "/login"             },
];

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function Profile() {
  const navigate = useNavigate();

  /* ── Read user from localStorage ── */
  const loggedInUser  = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
  const userId        = loggedInUser.id;
  const userRole      = loggedInUser.role || "Faculty";
  const isHOD         = userRole === "HOD";

  const NAV_ITEMS = isHOD ? HOD_NAV : FACULTY_NAV;
  const dashPath  = isHOD ? "/hod-dashboard" : "/faculty-dashboard";

  /* ── State ── */
  const [activeNav,   setActiveNav]   = useState("Profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab,   setActiveTab]   = useState("info");   // "info" | "security"

  /* profile view fields */
  const [profile,     setProfile]     = useState(null);
  const [loadingProf, setLoadingProf] = useState(true);

  /* edit fields */
  const [editMode,    setEditMode]    = useState(false);
  const [form,        setForm]        = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError,   setSaveError]   = useState("");

  /* password fields */
  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword:     "",
    confirmPassword: "",
  });
  const [showPw,    setShowPw]    = useState({ cur: false, nw: false, cf: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError,   setPwError]   = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  /* toast */
  const [toast, setToast] = useState(null);

  /* ── Fetch profile on mount ── */
  useEffect(() => {
    if (!userId) { navigate("/login"); return; }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoadingProf(true);
    try {
      const res = await axios.get(`${API_BASE}/profile`, {
        params: { userId }
      });
      setProfile(res.data);
      setForm({
        fullName:   res.data.fullName   || "",
        email:      res.data.email      || "",
        phone:      res.data.phone      || "",
        department: res.data.department || "",
        dob:        res.data.dob        || "",
      });
    } catch (err) {
      showToast("Failed to load profile.", "error");
    } finally {
      setLoadingProf(false);
    }
  };

  /* ── Save profile changes ── */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError("");
    try {
      const res = await axios.put(`${API_BASE}/profile/update`, form, {
        params: { userId }
      });
      // Update localStorage so header reflects new name immediately
      const updated = { ...loggedInUser, ...res.data };
      localStorage.setItem("loggedInUser", JSON.stringify(updated));
      setProfile(res.data);
      setEditMode(false);
      showToast("Profile updated successfully!");
    } catch (err) {
      setSaveError(err.response?.data || "Failed to update profile.");
    } finally {
      setSaveLoading(false);
    }
  };

  /* ── Change password ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (pw.newPassword !== pw.confirmPassword) {
      setPwError("New password and confirm password do not match.");
      return;
    }
    setPwLoading(true);
    try {
      const res = await axios.put(
        `${API_BASE}/profile/change-password`,
        pw,
        { params: { userId } }
      );
      setPwSuccess(res.data);
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast("Password changed successfully!");
    } catch (err) {
      setPwError(err.response?.data || "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  };

  /* ── Toast ── */
  const showToast = (msg, type = "success") => {
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

  /* ── Helpers ── */
  const initial = profile?.fullName?.charAt(0).toUpperCase() || "U";
  const roleColor = isHOD ? "hod" : "faculty";

  /* ═══ RENDER ═══ */
  return (
    <div className={`pf-root pf-root--${roleColor}`}>

      {/* ── Sidebar ── */}
      <aside className={`pf-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="pf-brand">
          <span className="pf-brand-icon"><GridIcon /></span>
          <span className="pf-brand-text">Resource Allocation<br />System</span>
        </div>
        <nav className="pf-nav">
          {NAV_ITEMS.map(({ label, Icon, path }) => (
            <button
              key={label}
              className={`pf-nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => handleNav({ label, path })}
            >
              <span className="pf-nav-icon"><Icon /></span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main ── */}
      <div className="pf-main">

        {/* Header */}
        <header className="pf-header">
          <div className="pf-header-left">
             <button
                  className="pf-menu-btn"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  ☰
                </button>
            <button className="pf-back-btn" onClick={() => navigate(dashPath)}>
              <ArrowLeftIcon />
            </button>
            <div>
              <h1 className="pf-title">My Profile</h1>
              <p className="pf-subtitle">View and manage your account information.</p>
            </div>
          </div>
          <div className="pf-header-right">
            <div className="pf-user-chip">
              <div className="pf-avatar">{initial}</div>
              <div className="pf-user-text">
                <span className="pf-user-name">{profile?.fullName || "—"}</span>
                <span className="pf-user-role">{userRole}</span>
              </div>
              <ChevronDownIcon />
            </div>
          </div>
        </header>

        {loadingProf ? (
          <div className="pf-loading">
            <div className="pf-spinner" />
            <p>Loading profile…</p>
          </div>
        ) : (
          <div className="pf-content">

            {/* ── Profile hero card ── */}
            <div className="pf-hero-card">
              <div className="pf-hero-left">
                <div className="pf-big-avatar">{initial}</div>
                <div className="pf-hero-info">
                  <h2 className="pf-hero-name">{profile?.fullName}</h2>
                  <p className="pf-hero-role">
                    <span className={`pf-role-badge pf-role-badge--${roleColor}`}>
                      {userRole}
                    </span>
                  </p>
                  <p className="pf-hero-dept">{profile?.department}</p>
                  <p className="pf-hero-username">@{profile?.username}</p>
                </div>
              </div>
              <div className="pf-hero-right">
                <div className="pf-hero-stat">
                  <span className="pf-hero-stat-label">Member Since</span>
                  <span className="pf-hero-stat-val">
                    {profile?.createdAt || "2025"}
                  </span>
                </div>
                <div className="pf-hero-stat">
                  <span className="pf-hero-stat-label">Email</span>
                  <span className="pf-hero-stat-val">{profile?.email}</span>
                </div>
                <div className="pf-hero-stat">
                  <span className="pf-hero-stat-label">Phone</span>
                  <span className="pf-hero-stat-val">{profile?.phone || "—"}</span>
                </div>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="pf-tabs">
              <button
                className={`pf-tab ${activeTab === "info" ? "active" : ""}`}
                onClick={() => setActiveTab("info")}
              >
                <UserIcon /> Personal Info
              </button>
              <button
                className={`pf-tab ${activeTab === "security" ? "active" : ""}`}
                onClick={() => setActiveTab("security")}
              >
                <LockIcon /> Security
              </button>
            </div>

            {/* ══ TAB: Personal Info ══ */}
            {activeTab === "info" && (
              <div className="pf-card">
                <div className="pf-card-header">
                  <div>
                    <h3 className="pf-card-title">Personal Information</h3>
                    <p className="pf-card-sub">Update your personal details here.</p>
                  </div>
                  {!editMode && (
                    <button
                      className="pf-edit-btn"
                      onClick={() => { setEditMode(true); setSaveError(""); }}
                    >
                      <EditIcon /> Edit Profile
                    </button>
                  )}
                </div>

                {!editMode ? (
                  /* ── View mode ── */
                  <div className="pf-info-grid">
                    <InfoRow icon={<UserIcon />}     label="Full Name"  value={profile?.fullName}   />
                    <InfoRow icon={<EmailIcon />}    label="Email"      value={profile?.email}      />
                    <InfoRow icon={<PhoneIcon />}    label="Phone"      value={profile?.phone || "Not provided"} />
                    <InfoRow icon={<BuildingIcon />} label="Department" value={profile?.department} />
                    <InfoRow icon={<IdIcon />}       label="Username"   value={`@${profile?.username}`} />
                    <InfoRow icon={<CakeIcon />}     label="Date of Birth" value={profile?.dob || "Not provided"} />
                    <InfoRow icon={<ShieldIcon />}   label="Role"       value={userRole} highlight />
                  </div>
                ) : (
                  /* ── Edit mode ── */
                  <form className="pf-form" onSubmit={handleSave}>
                    <div className="pf-form-row">
                      <div className="pf-form-group">
                        <label className="pf-label">Full Name</label>
                        <input
                          className="pf-input"
                          value={form.fullName}
                          onChange={e => setForm({...form, fullName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="pf-form-group">
                        <label className="pf-label">Email Address</label>
                        <input
                          className="pf-input"
                          type="email"
                          value={form.email}
                          onChange={e => setForm({...form, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="pf-form-row">
                      <div className="pf-form-group">
                        <label className="pf-label">Phone Number</label>
                        <input
                          className="pf-input"
                          type="tel"
                          value={form.phone}
                          placeholder="Enter phone number"
                          onChange={e => setForm({...form, phone: e.target.value})}
                        />
                      </div>
                      <div className="pf-form-group">
                        <label className="pf-label">Date of Birth</label>
                        <input
                          className="pf-input"
                          type="date"
                          value={form.dob}
                          onChange={e => setForm({...form, dob: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="pf-form-group pf-form-group--full">
                      <label className="pf-label">Department</label>
                      <select
                        className="pf-select"
                        value={form.department}
                        onChange={e => setForm({...form, department: e.target.value})}
                        required
                      >
                        <option value="">Select department</option>
                        {DEPARTMENTS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="pf-form-group pf-form-group--full pf-readonly-row">
                      <label className="pf-label">Username <span className="pf-readonly-tag">Read-only</span></label>
                      <input
                        className="pf-input pf-input--readonly"
                        value={profile?.username || ""}
                        readOnly
                      />
                    </div>

                    {saveError && (
                      <div className="pf-form-error"><WarnIcon /> {saveError}</div>
                    )}

                    <div className="pf-form-actions">
                      <button
                        type="button"
                        className="pf-btn-cancel"
                        onClick={() => { setEditMode(false); setSaveError(""); }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="pf-btn-save"
                        disabled={saveLoading}
                      >
                        {saveLoading ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ══ TAB: Security ══ */}
            {activeTab === "security" && (
              <div className="pf-card">
                <div className="pf-card-header">
                  <div>
                    <h3 className="pf-card-title">Change Password</h3>
                    <p className="pf-card-sub">
                      Keep your account secure with a strong password.
                    </p>
                  </div>
                </div>

                <form className="pf-form" onSubmit={handleChangePassword}>

                  <div className="pf-form-group pf-form-group--full">
                    <label className="pf-label">Current Password</label>
                    <div className="pf-pw-wrap">
                      <input
                        className="pf-input"
                        type={showPw.cur ? "text" : "password"}
                        value={pw.currentPassword}
                        placeholder="Enter current password"
                        onChange={e => setPw({...pw, currentPassword: e.target.value})}
                        required
                      />
                      <button type="button" className="pf-pw-toggle"
                        onClick={() => setShowPw(p => ({...p, cur: !p.cur}))}>
                        {showPw.cur ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  <div className="pf-form-row">
                    <div className="pf-form-group">
                      <label className="pf-label">New Password</label>
                      <div className="pf-pw-wrap">
                        <input
                          className="pf-input"
                          type={showPw.nw ? "text" : "password"}
                          value={pw.newPassword}
                          placeholder="Min 6 characters"
                          onChange={e => setPw({...pw, newPassword: e.target.value})}
                          required
                        />
                        <button type="button" className="pf-pw-toggle"
                          onClick={() => setShowPw(p => ({...p, nw: !p.nw}))}>
                          {showPw.nw ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>
                    <div className="pf-form-group">
                      <label className="pf-label">Confirm New Password</label>
                      <div className="pf-pw-wrap">
                        <input
                          className="pf-input"
                          type={showPw.cf ? "text" : "password"}
                          value={pw.confirmPassword}
                          placeholder="Re-enter new password"
                          onChange={e => setPw({...pw, confirmPassword: e.target.value})}
                          required
                        />
                        <button type="button" className="pf-pw-toggle"
                          onClick={() => setShowPw(p => ({...p, cf: !p.cf}))}>
                          {showPw.cf ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password strength hints */}
                  <div className="pf-pw-hints">
                    <PwHint ok={pw.newPassword.length >= 6}       label="At least 6 characters" />
                    <PwHint ok={/[A-Z]/.test(pw.newPassword)}     label="One uppercase letter"  />
                    <PwHint ok={/[0-9]/.test(pw.newPassword)}     label="One number"            />
                    <PwHint ok={pw.newPassword === pw.confirmPassword && pw.newPassword !== ""} label="Passwords match" />
                  </div>

                  {pwError   && <div className="pf-form-error"><WarnIcon /> {pwError}</div>}
                  {pwSuccess && <div className="pf-form-success"><CheckIcon /> {pwSuccess}</div>}

                  <div className="pf-form-actions">
                    <button
                      type="submit"
                      className="pf-btn-save"
                      disabled={pwLoading}
                    >
                      {pwLoading ? "Updating…" : "Update Password"}
                    </button>
                  </div>
                </form>

                {/* Account info section */}
                <div className="pf-security-info">
                  <h4 className="pf-security-info-title">Account Details</h4>
                  <div className="pf-security-rows">
                    <div className="pf-security-row">
                      <span className="pf-security-label"><IdIcon /> User ID</span>
                      <span className="pf-security-val">#{profile?.id}</span>
                    </div>
                    <div className="pf-security-row">
                      <span className="pf-security-label"><ShieldIcon /> Role</span>
                      <span className={`pf-role-badge pf-role-badge--${roleColor}`}>{userRole}</span>
                    </div>
                    <div className="pf-security-row">
                      <span className="pf-security-label"><UserIcon /> Username</span>
                      <span className="pf-security-val">@{profile?.username}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`pf-toast pf-toast--${toast.type}`}>
          {toast.type === "success" ? <CheckIcon /> : <WarnIcon />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ── Helper sub-components ── */
function InfoRow({ icon, label, value, highlight }) {
  return (
    <div className="pf-info-row">
      <span className="pf-info-icon">{icon}</span>
      <div className="pf-info-body">
        <span className="pf-info-label">{label}</span>
        <span className={`pf-info-value ${highlight ? "pf-info-value--hl" : ""}`}>
          {value || "—"}
        </span>
      </div>
    </div>
  );
}

function PwHint({ ok, label }) {
  return (
    <div className={`pf-pw-hint ${ok ? "pf-pw-hint--ok" : ""}`}>
      {ok ? <CheckSmIcon /> : <DotIcon />}
      <span>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SVG ICONS
═══════════════════════════════════════════════════════════ */
function GridIcon()     { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor"/><rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor"/><rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor"/><rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor"/></svg>; }
function HomeIcon()     { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>; }
function SearchIcon()   { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>; }
function RequestIcon()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg>; }
function BookingIcon()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function UploadIcon()   { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function ResIcon()      { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function ProfileIcon()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>; }
function LogoutIcon()   { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function ArrowLeftIcon(){ return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>; }
function ChevronDownIcon(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>; }
function EditIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function UserIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>; }
function LockIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>; }
function EmailIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>; }
function PhoneIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>; }
function BuildingIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>; }
function IdIcon()       { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>; }
function CakeIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-8a2 2 0 00-2-2H6a2 2 0 00-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2 1 2 1"/><line x1="12" y1="11" x2="12" y2="3"/><path d="M10 3s1 1 2 1 2-1 2-1"/></svg>; }
function ShieldIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function EyeIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOffIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }
function CheckIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>; }
function CheckSmIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>; }
function WarnIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>; }
function DotIcon()      { return <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg>; }