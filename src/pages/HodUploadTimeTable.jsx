import React, { useState, useRef, useCallback } from "react";
import "./HodUploadTimetable.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = "http://localhost:8080/api";

/* ─── Sidebar Nav ─────────────────────────────── */
const NAV_ITEMS = [
  { label: "Dashboard",         Icon: HomeIcon      },
  { label: "All Bookings",      Icon: BookingsIcon  },
  { label: "Upload Time Table", Icon: UploadNavIcon },
  { label: "Resources",         Icon: ResourcesIcon },
  { label: "Profile",           Icon: ProfileIcon   },
  { label: "Logout",            Icon: LogoutIcon    },
];

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function HodUploadTimetable() {
  const navigate  = useNavigate();
  const fileRef   = useRef();

  /* ── Read HOD from localStorage ── */
  const loggedInUser  = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
  const hodName       = loggedInUser.fullName   || "HOD";
  const hodDepartment = loggedInUser.department || "";
  const hodId         = loggedInUser.id;
  const hodInitial    = hodName.charAt(0).toUpperCase();

  /* ── State ── */
  const [activeNav, setActiveNav] = useState("Upload Time Table");
  const [dragging,  setDragging]  = useState(false);
  const [file,      setFile]      = useState(null);
  const [uploaded,  setUploaded]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState("");
  const [toast,     setToast]     = useState(null);
  const [history,   setHistory]   = useState([]);
  const [result,    setResult]    = useState(null);  // TimetableUploadResponseDTO

  /* ── Nav ── */
  const handleNav = (label) => {
    setActiveNav(label);
    if (label === "Logout")           { localStorage.removeItem("loggedInUser"); navigate("/login"); }
    if (label === "Dashboard")        navigate("/hod-dashboard");
    if (label === "All Bookings")     navigate("/hod-all-bookings");
    if (label === "Resources")        navigate("/hod-resources");
    if (label === "Upload Time Table") navigate("/hod-upload-timetable");
    // if (label === "Profile")          navigate("/hod-profile");
  };

  /* ── Toast ── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── Validate file type ── */
  const validateFile = (f) => {
    if (!f) return false;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls"].includes(ext)) {
      setError("Only .xlsx and .xls Excel files are supported.");
      return false;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File size must be under 10 MB.");
      return false;
    }
    return true;
  };

  /* ── Select file (drag or browse) ── */
  const selectFile = (f) => {
    if (!validateFile(f)) return;
    setError("");
    setFile(f);
    setUploaded(false);
    setResult(null);
  };

  /* ── Drag & Drop ── */
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
  }, []);

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()   => setDragging(false);
  const onFileChange = (e) => { if (e.target.files[0]) selectFile(e.target.files[0]); };

  /* ── Upload to Spring Boot ── */
  const handleUpload = async () => {
    if (!file) { setError("Please select a file first."); return; }
    if (!hodDepartment) { setError("Session expired. Please login again."); return; }

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file",       file);
    formData.append("department", hodDepartment);
    formData.append("hodId",      hodId);

    try {
      const res = await axios.post(
        `${API_BASE}/timetable/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const data = res.data;  // TimetableUploadResponseDTO
      setResult(data);
      setUploaded(true);

      // Add to upload history
      setHistory(prev => [{
        name:      file.name,
        size:      (file.size / 1024).toFixed(1) + " KB",
        resources: data.resourcesUpdated,
        slots:     data.rowsInserted,
        time:      new Date().toLocaleString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit"
        }),
      }, ...prev.slice(0, 4)]);

      showToast(`✓ ${data.message}`, "success");
    } catch (err) {
      const msg = err.response?.data || "Upload failed. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setUploading(false);
    }
  };

  /* ── Clear ── */
  const clearAll = () => {
    setFile(null);
    setUploaded(false);
    setError("");
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ── Download template ── */
  const downloadTemplate = () => {
    // Build a sample CSV that matches the Excel format
    const lines = [
      "Resource - Computer Lab 1,,,,",
      "Monday,,,,",
      ",Subject,Faculty,StartTime,EndTime",
      ",Data Structures,Dr. Emily Davis,09:00 AM,10:00 AM",
      ",Operating Systems,Prof. John Smith,10:00 AM,11:00 AM",

      "Tuesday,,,,",
      ",Subject,Faculty,StartTime,EndTime",
      ",DBMS,Dr. Sarah Wilson,11:00 AM,12:00 PM",
      ",Computer Networks,Dr. Raj Patel,12:00 PM,01:00 PM",

      "Resource - Seminar Hall,,,,",
      "Monday,,,,",
      ",Subject,Faculty,StartTime,EndTime",
      ",Seminar,Dr. Sarah Wilson,10:00 AM,12:00 PM",
    ].join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "Timetable_Template.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Template downloaded!", "success");
  };

  /* ═══ RENDER ═══ */
  return (
    <div className="tt-root">

      {/* ── Sidebar ── */}
      <aside className="tt-sidebar">
        <div className="tt-brand">
          <span className="tt-brand-icon"><GridIcon /></span>
          <span className="tt-brand-text">Resource Allocation<br />System</span>
        </div>
        <nav className="tt-nav">
          {NAV_ITEMS.map(({ label, Icon }) => (
            <button
              key={label}
              className={`tt-nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => handleNav(label)}
            >
              <span className="tt-nav-icon"><Icon /></span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main ── */}
      <div className="tt-main">

        {/* Header */}
        <header className="tt-header">
          <div>
            <h1 className="tt-title">Upload Time Table</h1>
            <p className="tt-subtitle">
              Upload the department timetable Excel file to auto-populate lecture slots.
              &nbsp;<strong style={{ color: "#15803d" }}>{hodDepartment}</strong>
            </p>
          </div>
          <div className="tt-header-right">
            <button className="tt-notif-btn"><BellIcon /></button>
            <div className="tt-user-chip">
              <div className="tt-avatar">{hodInitial}</div>
              <div className="tt-user-text">
                <span className="tt-user-name">{hodName}</span>
                <span className="tt-user-role">HOD</span>
              </div>
              <ChevronDownIcon />
            </div>
          </div>
        </header>

        <div className="tt-content">
          <div className="tt-top-row">

            {/* ── Upload Card ── */}
            <div className="tt-upload-card">
              <div className="tt-upload-card-header">
                <div className="tt-upload-card-icon"><ExcelIcon /></div>
                <div>
                  <h2 className="tt-upload-card-title">Upload Excel Timetable</h2>
                  <p className="tt-upload-card-sub">Supports .xlsx and .xls formats</p>
                </div>
              </div>

              {/* Drop zone */}
              <div
                className={`tt-dropzone
                  ${dragging  ? "tt-dropzone--drag" : ""}
                  ${uploaded  ? "tt-dropzone--done" : ""}
                  ${file && !uploaded ? "tt-dropzone--ready" : ""}
                `}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => !file && fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="tt-file-input"
                  onChange={onFileChange}
                />

                {/* State: uploading */}
                {uploading ? (
                  <div className="tt-parsing-state">
                    <div className="tt-spinner" />
                    <p className="tt-dz-title">Uploading & saving to database…</p>
                    <p className="tt-dz-sub">Please wait</p>
                  </div>

                /* State: uploaded successfully */
                ) : uploaded && result ? (
                  <div className="tt-done-state">
                    <div className="tt-done-icon"><CheckCircleIcon /></div>
                    <p className="tt-dz-title">{file?.name}</p>
                    <p className="tt-dz-sub">
                      {result.rowsInserted} lecture slots saved across&nbsp;
                      {result.resourcesUpdated} resource(s)
                    </p>
                    <button
                      className="tt-replace-btn"
                      onClick={(e) => { e.stopPropagation(); clearAll(); }}
                    >
                      <RefreshIcon /> Upload Another File
                    </button>
                  </div>

                /* State: file selected, not yet uploaded */
                ) : file ? (
                  <div className="tt-done-state">
                    <div className="tt-file-ready-icon"><FileIcon /></div>
                    <p className="tt-dz-title">{file.name}</p>
                    <p className="tt-dz-sub">
                      {(file.size / 1024).toFixed(1)} KB — ready to upload
                    </p>
                    <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                      <button
                        className="tt-upload-now-btn"
                        onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                      >
                        <UploadCloudSmIcon /> Upload Now
                      </button>
                      <button
                        className="tt-replace-btn"
                        onClick={(e) => { e.stopPropagation(); clearAll(); }}
                      >
                        <RefreshIcon /> Change File
                      </button>
                    </div>
                  </div>

                /* State: idle */
                ) : (
                  <div className="tt-idle-state">
                    <div className="tt-dz-icon"><UploadCloudIcon /></div>
                    <p className="tt-dz-title">Drag & drop your Excel file here</p>
                    <p className="tt-dz-sub">or click to browse from your computer</p>
                    <button
                      className="tt-browse-btn"
                      onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                    >
                      <FolderIcon /> Browse File
                    </button>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="tt-error-box">
                  <WarnIcon /> {error}
                </div>
              )}

              {/* Upload result summary */}
              {result && (
                <div className="tt-result-box">
                  <div className="tt-result-header">
                    <CheckSmIcon /> Upload Summary
                  </div>
                  <div className="tt-result-grid">
                    <div className="tt-result-item tt-result-item--blue">
                      <span className="tt-result-val">{result.totalRowsRead}</span>
                      <span className="tt-result-label">Rows Read</span>
                    </div>
                    <div className="tt-result-item tt-result-item--green">
                      <span className="tt-result-val">{result.rowsInserted}</span>
                      <span className="tt-result-label">Slots Saved</span>
                    </div>
                    <div className="tt-result-item tt-result-item--teal">
                      <span className="tt-result-val">{result.resourcesUpdated}</span>
                      <span className="tt-result-label">Resources Updated</span>
                    </div>
                    <div className="tt-result-item tt-result-item--orange">
                      <span className="tt-result-val">{result.rowsSkipped}</span>
                      <span className="tt-result-label">Rows Skipped</span>
                    </div>
                  </div>

                  {/* Resources updated list */}
                  {result.insertedFor?.length > 0 && (
                    <div className="tt-result-list">
                      <p className="tt-result-list-title">✓ Updated Resources:</p>
                      {result.insertedFor.map((r, i) => (
                        <div key={i} className="tt-result-list-item tt-result-list-item--green">
                          <CheckSmIcon /> {r}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings?.length > 0 && (
                    <div className="tt-result-list">
                      <p className="tt-result-list-title" style={{ color: "#b45309" }}>
                        ⚠ Warnings:
                      </p>
                      {result.warnings.map((w, i) => (
                        <div key={i} className="tt-result-list-item tt-result-list-item--warn">
                          <WarnIcon /> {w}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="tt-upload-actions">
                <button className="tt-template-btn" onClick={downloadTemplate}>
                  <DownloadIcon /> Download Template
                </button>
              </div>

              {/* Format guide */}
              <div className="tt-format-guide">
                <p className="tt-format-title"><InfoIcon /> Excel Format</p>
                <div className="tt-format-example-box">
                  <div className="tt-format-row tt-format-row--header">
                    Resource - Computer Lab 1
                  </div>
                  <div className="tt-format-row tt-format-row--sub">
                    &nbsp;&nbsp;Subject &nbsp;|&nbsp; Faculty &nbsp;|&nbsp;
                    StartTime &nbsp;|&nbsp; EndTime
                  </div>
                  <div className="tt-format-row">
                    &nbsp;&nbsp;Data Structures &nbsp;|&nbsp; Dr. Emily Davis
                    &nbsp;|&nbsp; 10:00 AM &nbsp;|&nbsp; 12:00 PM
                  </div>
                  <div className="tt-format-row">
                    &nbsp;&nbsp;Operating Systems &nbsp;|&nbsp; Prof. John Smith
                    &nbsp;|&nbsp; 02:00 PM &nbsp;|&nbsp; 04:00 PM
                  </div>
                  <div className="tt-format-row tt-format-row--header" style={{ marginTop: "6px" }}>
                    Resource - Seminar Hall
                  </div>
                  <div className="tt-format-row tt-format-row--sub">
                    &nbsp;&nbsp;Subject &nbsp;|&nbsp; Faculty &nbsp;|&nbsp;
                    StartTime &nbsp;|&nbsp; EndTime
                  </div>
                  <div className="tt-format-row">
                    &nbsp;&nbsp;Seminar &nbsp;|&nbsp; Dr. Sarah Wilson
                    &nbsp;|&nbsp; 10:00 AM &nbsp;|&nbsp; 12:00 PM
                  </div>
                </div>
                <p className="tt-format-note">
                  Each resource can have up to <strong>6 lecture slots</strong>.
                  Slots are saved as 1st Lecture, 2nd Lecture … 6th Lecture in order.
                  Existing entries for each resource are replaced on upload.
                </p>
              </div>
            </div>

            {/* ── Right Panel ── */}
            <div className="tt-right-col">

              {/* Upload history */}
              <div className="tt-history-card">
                <h3 className="tt-history-title">
                  <HistoryIcon /> Upload History
                </h3>
                {history.length === 0 ? (
                  <div className="tt-history-empty">
                    <p>No uploads yet this session.</p>
                  </div>
                ) : (
                  <div className="tt-history-list">
                    {history.map((h, i) => (
                      <div key={i} className="tt-history-row">
                        <div className="tt-history-icon"><ExcelSmallIcon /></div>
                        <div className="tt-history-info">
                          <p className="tt-history-name">{h.name}</p>
                          <p className="tt-history-meta">
                            {h.resources} resources · {h.slots} slots · {h.size}
                          </p>
                        </div>
                        <div className="tt-history-time">{h.time}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tips card */}
              <div className="tt-tips-card">
                <h3 className="tt-tips-title"><InfoIcon /> Tips</h3>
                <ul className="tt-tips-list">
                  <li>Resource names in Excel must match the names in the database exactly.</li>
                  <li>Each resource block can have a maximum of 6 lecture slots.</li>
                  <li>Old timetable entries for each resource are replaced when you upload.</li>
                  <li>Time format: <code>10:00 AM</code> or <code>14:00</code> both work.</li>
                  <li>Download the template to see the exact format required.</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`tt-toast tt-toast--${toast.type}`}>
          {toast.type === "success" ? <CheckSmIcon /> : <WarnIcon />}
          &nbsp;{toast.msg}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SVG ICONS
═══════════════════════════════════════════════ */
function GridIcon()         { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor"/><rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor"/><rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor"/><rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor"/></svg>; }
function HomeIcon()         { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>; }
function BookingsIcon()     { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function UploadNavIcon()    { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function ResourcesIcon()    { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function ProfileIcon()      { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>; }
function LogoutIcon()       { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function BellIcon()         { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
function ChevronDownIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>; }
function UploadCloudIcon()  { return <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>; }
function UploadCloudSmIcon(){ return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>; }
function FolderIcon()       { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>; }
function FileIcon()         { return <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; }
function CheckCircleIcon()  { return <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><circle cx="12" cy="12" r="9"/><polyline points="9 12 11 14 15 10"/></svg>; }
function RefreshIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>; }
function DownloadIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function InfoIcon()         { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="12" x2="12" y2="16"/><circle cx="12" cy="8" r="0.5" fill="currentColor"/></svg>; }
function WarnIcon()         { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>; }
function ExcelIcon()        { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="3" fill="#16a34a"/><path d="M8 8l3 4-3 4M16 8l-3 4 3 4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function ExcelSmallIcon()   { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="3" fill="#16a34a"/><path d="M8 8l3 4-3 4M16 8l-3 4 3 4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>; }
function HistoryIcon()      { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 109.95-8.95"/><polyline points="3 4 3 11 10 11"/></svg>; }
function CheckSmIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>; }