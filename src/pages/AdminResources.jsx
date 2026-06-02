import React, { useState, useEffect } from "react";
import "./AdminResources.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// const API_BASE = "http://localhost:8080/api";
const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

/* ─── Sidebar Nav ─────────────────────────────── */
const NAV_ITEMS = [
  { label: "Dashboard",        Icon: HomeIcon      },
  { label: "Manage Resources", Icon: ResourcesIcon },
  { label: "Manage Users",    Icon: UsersNavIcon,  },
  { label: "Profile",          Icon: ProfileIcon   },
  { label: "Logout",           Icon: LogoutIcon    },
];

/* ─── Resource type → icon ───────────────────── */
const TYPE_ICON = {
  Lab:       LabIcon,
  Hall:      HallIcon,
  Classroom: ClassroomIcon,
};

/* ─── Department options ─────────────────────── */
const DEPARTMENTS = [
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

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function AdminResources() {
  const navigate = useNavigate();

  /* ── Read admin from localStorage ── */
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
  const adminName    = loggedInUser.fullName || "Admin";
  const adminInitial = adminName.charAt(0).toUpperCase();

  /* ── State ── */
  const [activeNav,    setActiveNav]    = useState("Manage Resources");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [resources,    setResources]    = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [searchText,   setSearchText]   = useState("");
  const [typeFilter,   setTypeFilter]   = useState("All Types");
  const [deptFilter,   setDeptFilter]   = useState("All Departments");
  const [toast,        setToast]        = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteId,     setDeleteId]     = useState(null);
  const [editResource, setEditResource] = useState(null);
  const [viewMode,     setViewMode]     = useState("grid");
  const [saving,       setSaving]       = useState(false);

  /* ── Add form ── */
  const EMPTY_FORM = {
    name: "", type: "Lab", capacity: "",
    location: "", amenities: "",
    department: "Computer Science and Engineering"
  };
  const [form, setForm] = useState(EMPTY_FORM);

  /* ── Fetch on mount ── */
  useEffect(() => {
    fetchResources();
  }, []);

  /* ── Apply filters ── */
  useEffect(() => {
    let list = [...resources];
    if (typeFilter !== "All Types")
      list = list.filter(r => r.type === typeFilter);
    if (deptFilter !== "All Departments")
      list = list.filter(r => r.department === deptFilter);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.location?.toLowerCase().includes(q) ||
        r.department?.toLowerCase().includes(q) ||
        r.amenities?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [resources, typeFilter, deptFilter, searchText]);

  /* ────────────────────────────────────────────
     FETCH ALL RESOURCES (Admin sees everything)
  ──────────────────────────────────────────── */
  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/resources`);
      setResources(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
      showToast("Failed to load resources.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ────────────────────────────────────────────
     ADD RESOURCE
  ──────────────────────────────────────────── */
  const handleAdd = async () => {
    if (!form.name.trim())        { showToast("Resource name is required.", "error"); return; }
    if (!form.capacity || isNaN(form.capacity)) { showToast("Enter a valid capacity.", "error"); return; }
    if (!form.location.trim())    { showToast("Location is required.", "error"); return; }

    setSaving(true);
    try {
      await axios.post(`${API_BASE}/resources/add`, {
        name:       form.name.trim(),
        type:       form.type,
        department: form.department,
        capacity:   Number(form.capacity),
        location:   form.location.trim(),
        amenities:  form.amenities.trim(),
      });
      showToast(`'${form.name}' added successfully!`, "success");
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      fetchResources();
    } catch (err) {
      showToast(err.response?.data || "Failed to add resource.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ────────────────────────────────────────────
     UPDATE RESOURCE
  ──────────────────────────────────────────── */
  const handleUpdate = async () => {
    if (!editResource.name?.trim()) { showToast("Name is required.", "error"); return; }
    if (!editResource.capacity || isNaN(editResource.capacity)) {
      showToast("Enter a valid capacity.", "error"); return;
    }
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/resources/${editResource.resourceId}`, {
        name:       editResource.name,
        type:       editResource.type,
        department: editResource.department,
        capacity:   Number(editResource.capacity),
        location:   editResource.location,
        amenities:  editResource.amenities,
      });
      showToast(`'${editResource.name}' updated successfully!`, "success");
      setEditResource(null);
      fetchResources();
    } catch (err) {
      showToast(err.response?.data || "Failed to update.", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ────────────────────────────────────────────
     DELETE RESOURCE
  ──────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_BASE}/resources/${deleteId}`);
      showToast("Resource deleted.", "success");
      setDeleteId(null);
      fetchResources();
    } catch (err) {
      showToast(err.response?.data || "Failed to delete.", "error");
      setDeleteId(null);
    }
  };

  /* ── Toast ── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Nav ── */
  const handleNav = (label) => {
    setSidebarOpen(false);
    setActiveNav(label);
    if (label === "Logout")           { localStorage.removeItem("loggedInUser"); navigate("/login"); }
    if (label === "Dashboard")        navigate("/admin-dashboard");
    if (label === "Profile")          navigate("/admin-profile");
    if (label === "Manage Users")     navigate("/admin-users");
  };

  /* ── Stats ── */
  const totalCount = resources.length;
  const labCount   = resources.filter(r => r.type === "Lab").length;
  const hallCount  = resources.filter(r => r.type === "Hall").length;
  const classCount = resources.filter(r => r.type === "Classroom").length;

  // unique departments that have resources
  const deptCount  = [...new Set(resources.map(r => r.department))].length;

  /* ═══ RENDER ═══ */
  return (
    <div className="ar-root">

      {/* ── Sidebar ── */}
      <aside className={`ar-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="ar-brand">
          <span className="ar-brand-icon"><GridIcon /></span>
          <span className="ar-brand-text">Resource Allocation<br />System</span>
        </div>
        <nav className="ar-nav">
          {NAV_ITEMS.map(({ label, Icon }) => (
            <button
              key={label}
              className={`ar-nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => handleNav(label)}
            >
              <span className="ar-nav-icon"><Icon /></span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main ── */}
      <div className="ar-main">

        {/* Header */}
        <header className="ar-header">
           <div className="ar-header-left">

                <button
                  className="ar-menu-btn"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  ☰
                </button>

                <div>
                  <h1 className="ar-title">Manage Resources</h1>
                  <p className="ar-subtitle">
                    Admin view — all resources across all departments.
                  </p>
                </div>

              </div>
          <div className="ar-header-right">
            <button className="ar-notif-btn"><BellIcon /></button>
            <div className="ar-user-chip">
              <div className="ar-avatar">{adminInitial}</div>
              <div className="ar-user-text">
                <span className="ar-user-name">{adminName}</span>
                <span className="ar-user-role">Administrator</span>
              </div>
              <ChevronDownIcon />
            </div>
          </div>
        </header>

        <div className="ar-content">

          {/* ── Stat Cards ── */}
          <div className="ar-stats">
            <StatCard icon={<TotalResIcon />} iconBg="#eff6ff"
              value={totalCount} label="Total Resources" />
            <StatCard icon={<LabStatIcon />}  iconBg="#f0fdf4"
              value={labCount}   label="Labs" />
            <StatCard icon={<HallStatIcon />} iconBg="#fefce8"
              value={hallCount}  label="Halls" />
            <StatCard icon={<ClassStatIcon />}iconBg="#f5f3ff"
              value={classCount} label="Classrooms" />
            <StatCard icon={<DeptIcon />}     iconBg="#fdf2f8"
              value={deptCount}  label="Departments" />
          </div>

          {/* ── Toolbar ── */}
          <div className="ar-toolbar">
            <div className="ar-search-box">
              <SearchIcon />
              <input
                type="text"
                placeholder="Search by name, location, department…"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
            </div>

            {/* Type filter */}
            <select
              className="ar-select"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option>All Types</option>
              <option>Lab</option>
              <option>Hall</option>
              <option>Classroom</option>
            </select>

            {/* Department filter — Admin exclusive */}
            <select
              className="ar-select ar-select--dept"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option>All Departments</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>

            <div className="ar-view-toggle">
              <button
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              ><GridViewIcon /></button>
              <button
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
                title="List view"
              ><ListViewIcon /></button>
            </div>

            <span className="ar-count-label">
              Showing <strong>{filtered.length}</strong> of <strong>{totalCount}</strong>
            </span>

            <button
              className="ar-add-btn"
              onClick={() => { setForm(EMPTY_FORM); setShowAddModal(true); }}
            >
              <PlusIcon /> Add Resource
            </button>
          </div>

          {/* ── Resource Grid / List ── */}
          {loading ? (
            <div className="ar-loading">Loading resources…</div>
          ) : filtered.length === 0 ? (
            <div className="ar-empty">
              <EmptyIcon />
              <p>No resources found{searchText ? ` for "${searchText}"` : ""}.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="ar-grid">
              {filtered.map(r => (
                <ResourceCard
                  key={r.resourceId}
                  resource={r}
                  onEdit={() => setEditResource({ ...r })}
                  onDelete={() => setDeleteId(r.resourceId)}
                />
              ))}
            </div>
          ) : (
            <div className="ar-list">
              <table className="ar-list-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Department</th>
                    <th>Capacity</th>
                    <th>Location</th>
                    <th>Amenities</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.resourceId}>
                      <td><strong>{r.name}</strong></td>
                      <td>
                        <span className={`ar-type-badge ar-type-badge--${r.type?.toLowerCase()}`}>
                          {r.type}
                        </span>
                      </td>
                      <td style={{ fontSize: "12px", color: "#6b7280", maxWidth: "160px" }}>
                        {r.department}
                      </td>
                      <td>{r.capacity} seats</td>
                      <td style={{ fontSize: "12px" }}>{r.location}</td>
                      <td style={{ fontSize: "12px", color: "#6b7280" }}>{r.amenities}</td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className="ar-edit-btn-sm"
                            onClick={() => setEditResource({ ...r })}
                          >
                            <EditIcon /> Edit
                          </button>
                          <button
                            className="ar-delete-btn-sm"
                            onClick={() => setDeleteId(r.resourceId)}
                          >
                            <TrashIcon /> Delete
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
      </div>

      {/* ══════════════════════════════════════════
          ADD RESOURCE MODAL
      ══════════════════════════════════════════ */}
      {showAddModal && (
        <div className="ar-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="ar-modal" onClick={e => e.stopPropagation()}>
            <div className="ar-modal-header">
              <h2>Add New Resource</h2>
              <button className="ar-modal-close" onClick={() => setShowAddModal(false)}>
                <XIcon />
              </button>
            </div>
            <div className="ar-modal-body">
              <div className="ar-form-group">
                <label>Resource Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Lab 3"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="ar-form-row">
                <div className="ar-form-group">
                  <label>Type *</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="Lab">Lab</option>
                    <option value="Hall">Hall</option>
                    <option value="Classroom">Classroom</option>
                  </select>
                </div>
                <div className="ar-form-group">
                  <label>Capacity *</label>
                  <input
                    type="number"
                    placeholder="e.g. 40"
                    min="1"
                    value={form.capacity}
                    onChange={e => setForm({ ...form, capacity: e.target.value })}
                  />
                </div>
              </div>
              <div className="ar-form-group">
                <label>Department *</label>
                <select
                  value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })}
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="ar-form-group">
                <label>Location *</label>
                <input
                  type="text"
                  placeholder="e.g. Block A, Level 2"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                />
              </div>
              <div className="ar-form-group">
                <label>Amenities</label>
                <input
                  type="text"
                  placeholder="e.g. Wi-Fi, Projector, AC"
                  value={form.amenities}
                  onChange={e => setForm({ ...form, amenities: e.target.value })}
                />
              </div>
            </div>
            <div className="ar-modal-footer">
              <button className="ar-modal-cancel" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="ar-modal-save" onClick={handleAdd} disabled={saving}>
                {saving ? "Saving…" : "Add Resource"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          EDIT RESOURCE MODAL
      ══════════════════════════════════════════ */}
      {editResource && (
        <div className="ar-modal-overlay" onClick={() => setEditResource(null)}>
          <div className="ar-modal" onClick={e => e.stopPropagation()}>
            <div className="ar-modal-header">
              <h2>Edit Resource</h2>
              <button className="ar-modal-close" onClick={() => setEditResource(null)}>
                <XIcon />
              </button>
            </div>
            <div className="ar-modal-body">
              <div className="ar-form-group">
                <label>Resource Name *</label>
                <input
                  type="text"
                  value={editResource.name}
                  onChange={e => setEditResource({ ...editResource, name: e.target.value })}
                />
              </div>
              <div className="ar-form-row">
                <div className="ar-form-group">
                  <label>Type *</label>
                  <select
                    value={editResource.type}
                    onChange={e => setEditResource({ ...editResource, type: e.target.value })}
                  >
                    <option value="Lab">Lab</option>
                    <option value="Hall">Hall</option>
                    <option value="Classroom">Classroom</option>
                  </select>
                </div>
                <div className="ar-form-group">
                  <label>Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    value={editResource.capacity}
                    onChange={e => setEditResource({ ...editResource, capacity: e.target.value })}
                  />
                </div>
              </div>
              <div className="ar-form-group">
                <label>Department *</label>
                <select
                  value={editResource.department}
                  onChange={e => setEditResource({ ...editResource, department: e.target.value })}
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="ar-form-group">
                <label>Location *</label>
                <input
                  type="text"
                  value={editResource.location || ""}
                  onChange={e => setEditResource({ ...editResource, location: e.target.value })}
                />
              </div>
              <div className="ar-form-group">
                <label>Amenities</label>
                <input
                  type="text"
                  value={editResource.amenities || ""}
                  onChange={e => setEditResource({ ...editResource, amenities: e.target.value })}
                />
              </div>
            </div>
            <div className="ar-modal-footer">
              <button className="ar-modal-cancel" onClick={() => setEditResource(null)}>
                Cancel
              </button>
              <button className="ar-modal-save" onClick={handleUpdate} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          DELETE CONFIRM MODAL
      ══════════════════════════════════════════ */}
      {deleteId && (
        <div className="ar-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="ar-modal ar-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="ar-modal-header">
              <h2>Delete Resource</h2>
              <button className="ar-modal-close" onClick={() => setDeleteId(null)}>
                <XIcon />
              </button>
            </div>
            <div className="ar-modal-body">
              <p style={{ color: "#374151", lineHeight: "1.6" }}>
                Are you sure you want to delete this resource?
                This will also remove all its timetable entries.
                This action cannot be undone.
              </p>
            </div>
            <div className="ar-modal-footer">
              <button className="ar-modal-cancel" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button className="ar-modal-delete" onClick={handleDelete}>
                <TrashIcon /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`ar-toast ar-toast--${toast.type}`}>
          {toast.type === "success" ? <CheckIcon /> : <WarnIcon />}
          &nbsp;{toast.msg}
        </div>
      )}
    </div>
  );
}

/* ─── Resource Card ───────────────────────────── */
function ResourceCard({ resource, onEdit, onDelete }) {
  const TypeIcon = TYPE_ICON[resource.type] || LabIcon;
  return (
    <div className="ar-card">
      <div className="ar-card-header">
        <div className="ar-card-icon-wrap"><TypeIcon /></div>
        <div style={{ display: "flex", gap: "6px" }}>
          <button className="ar-card-edit" onClick={onEdit} title="Edit">
            <EditIcon />
          </button>
          <button className="ar-card-delete" onClick={onDelete} title="Delete">
            <TrashIcon />
          </button>
        </div>
      </div>
      <h3 className="ar-card-name">{resource.name}</h3>
      <p className="ar-card-dept">{resource.department}</p>
      <div className="ar-card-meta">
        <span className="ar-card-meta-item"><LocationIcon /> {resource.location}</span>
        <span className="ar-card-meta-item"><SeatsIcon /> {resource.capacity} seats</span>
      </div>
      <div className="ar-card-footer">
        <span className={`ar-type-badge ar-type-badge--${resource.type?.toLowerCase()}`}>
          {resource.type}
        </span>
        {resource.amenities && (
          <span className="ar-card-amenities" title={resource.amenities}>
            {resource.amenities.split(",").slice(0, 2).join(", ")}
            {resource.amenities.split(",").length > 2 ? "…" : ""}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Stat Card ───────────────────────────────── */
function StatCard({ icon, iconBg, value, label }) {
  return (
    <div className="ar-stat">
      <div className="ar-stat-icon" style={{ background: iconBg }}>{icon}</div>
      <div className="ar-stat-body">
        <span className="ar-stat-value">{value}</span>
        <span className="ar-stat-label">{label}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SVG ICONS
═══════════════════════════════════════════════ */
function GridIcon()       { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor"/><rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor"/><rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor"/><rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor"/></svg>; }
function HomeIcon()       { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>; }
function ResourcesIcon()  { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function ProfileIcon()    { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>; }
function LogoutIcon()     { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function BellIcon()       { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
function ChevronDownIcon(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>; }
function SearchIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>; }
function PlusIcon()       { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function TrashIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>; }
function EditIcon()       { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function XIcon()          { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function CheckIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>; }
function WarnIcon()       { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>; }
function LocationIcon()   { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>; }
function SeatsIcon()      { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>; }
function GridViewIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function ListViewIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>; }
function EmptyIcon()      { return <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function LabIcon()        { return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.6"><path d="M9 3h6v11l3 7H6l3-7V3z"/><line x1="6" y1="14" x2="18" y2="14"/></svg>; }
function HallIcon()       { return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.6"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/></svg>; }
function ClassroomIcon()  { return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.6"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function LabStatIcon()    { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8"><path d="M9 3h6v11l3 7H6l3-7V3z"/><line x1="6" y1="14" x2="18" y2="14"/></svg>; }
function HallStatIcon()   { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>; }
function ClassStatIcon()  { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function TotalResIcon()   { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function DeptIcon()       { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function UsersNavIcon()   { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>; }
