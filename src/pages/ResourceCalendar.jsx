import React, { useState, useEffect } from "react";
import "./ShowResources.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/* ─── Constants ─────────────────────────────────── */
const HOUR_HEIGHT = 64;
const BASE_HOUR   = 9;
// const HOURS = [9,10,11,12,13,14,15,16];
const LECTURE_TIMES = {

  "1st Lecture": {
    start: "09:00",
    end: "10:00"
  },

  "2nd Lecture": {
    start: "10:00",
    end: "11:00"
  },

  "3rd Lecture": {
    start: "11:00",
    end: "12:00"
  },

  "4th Lecture": {
    start: "12:00",
    end: "13:00"
  },

  "5th Lecture": {
    start: "14:00",
    end: "15:00"
  },

  "6th Lecture": {
    start: "15:00",
    end: "16:00"
  }

};

const HOURS = [9,10,11,12,13,14,15,16];

// const API_BASE = "http://localhost:8080/api";
const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

const CATEGORIES = ["Labs", "Halls", "Classrooms"];

const WEEK_DAYS = [
  { lecture: "Lecture - 1", idx: 0 },
  { lecture: "Lecture - 2", idx: 1 },
  { lecture: "Lecture - 3", idx: 2 },
  { lecture: "Lecture - 4", idx: 3 },
  { lecture: "Lecture - 5", idx: 4 },
  { lecture: "Lecture - 6", idx: 5 },
];

/* ─── Helpers ────────────────────────────────────── */
function to12h(time24) {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

// function eventStyle(start, end) {
//   const [sh, sm] = start.split(":").map(Number);
//   const [eh, em] = end.split(":").map(Number);
//   const top    = ((sh - BASE_HOUR) + sm / 60) * HOUR_HEIGHT;
//   const height = ((eh * 60 + em) - (sh * 60 + sm)) / 60 * HOUR_HEIGHT - 3;
//   return { top: `${top}px`, height: `${height}px` };
// }

function eventStyle(start, end) {

  const [sh, sm] =
    start.split(":").map(Number);

  const [eh, em] =
    end.split(":").map(Number);

  const top =
    (((sh - BASE_HOUR) * 60) + sm)
      / 60 * HOUR_HEIGHT;

  const height =
    (((eh * 60 + em) -
      (sh * 60 + sm)) / 60)
      * HOUR_HEIGHT;

  return {
    top: `${top}px`,
    height: `${height}px`
  };
}

function hourLabel(h) {
  const ampm = h >= 12 ? "PM" : "AM";
  const h12  = h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2,"0")}:00 ${ampm}`;
}

/* ─── Nav ────────────────────────────────────────── */
const NAV = [
  { label: "Dashboard",      Icon: HomeIcon     },
  { label: "Show Resources", Icon: SearchIcon   },
  { label: "My Requests",    Icon: RequestsIcon },
  { label: "Profile",        Icon: ProfileIcon  },
  { label: "Logout",         Icon: LogoutIcon   },
];

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
export default function ShowResources() {
  const navigate = useNavigate();
  const [activeNav,   setActiveNav]   = useState("Show Resources");
  const [category,    setCategory]    = useState("Labs");
  const [viewMode,    setViewMode]    = useState("week");

  // Data from API
  const [resources,   setResources]   = useState([]);   // [{resourceId, name, type, ...}]
  const [selected,    setSelected]    = useState(null);  // currently selected resource object
  const [timetable,   setTimetable]   = useState([]);   // [{id, lectureIndex, startTime, endTime, facultyName, classType, ...}]
  const [loading,     setLoading]     = useState(false);
  const [timetableLoading, setTimetableLoading] = useState(false);

  /* ── Fetch resources whenever category changes ── */
  useEffect(() => {
    fetchResources(category);
  }, [category]);

  /* ── Fetch timetable whenever selected resource changes ── */
  useEffect(() => {
    if (selected) fetchTimetable(selected.resourceId);
  }, [selected]);

  // ── paste these two functions replacing old ones ──

  const fetchResources = async (cat) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/resources/category`, {
        params: { name: cat }
      });
      console.log("DATA:", res.data);   // ← add this
      const list = res.data;
      setResources(list);
      if (list.length > 0) setSelected(list[0]);
      else { setSelected(null); setTimetable([]); }
    } catch (err) {
      console.error("ERROR:", err.response?.data || err.message);  // ← add this
    } finally {
      setLoading(false);   // ← this must always run
    }
};

  const lectureToIndex = (slot) => {

  switch (slot) {

    case "1st Lecture":
      return 0;

    case "2nd Lecture":
      return 1;

    case "3rd Lecture":
      return 2;

    case "4th Lecture":
      return 3;

    case "5th Lecture":
      return 4;

    case "6th Lecture":
      return 5;

    default:
      return 0;
  }
};

  const fetchTimetable = async (resourceId) => {

  setTimetableLoading(true);

  try {

    const [timetableRes, bookingsRes] = await Promise.all([

      axios.get(
        `${API_BASE}/resources/${resourceId}/timetable`
      ),

      axios.get(
        `${API_BASE}/bookings/resource/${resourceId}/approved`
      )

    ]);

    console.log("Timetable:", timetableRes.data);
    console.log("Approved Bookings:", bookingsRes.data);

    /* ─────────────────────────────────────────────
       Convert timetable entries
    ───────────────────────────────────────────── */
    const timetableEvents = timetableRes.data.map((t, index) => ({

      id: `tt-${index}`,

      // lectureIndex:
      //   typeof t.lectureIndex === "number"
      //     ? t.lectureIndex
      //     : Math.max(
      //         0,
      //         parseInt(
      //           String(t.lectureSlot || "1")
      //             .replace(/\D/g, "")
      //         ) - 1
      //       ),

      lectureIndex:
        lectureToIndex(t.lectureSlot),

      // startTime:
      //   t.startTime?.slice(0, 5),

      // endTime:
      //   t.endTime?.slice(0, 5),

      // startTime:
      //   LECTURE_TIMES[t.lectureSlot]?.start || "09:00",

      // endTime:
      //   LECTURE_TIMES[t.lectureSlot]?.end || "10:00",

      startTime:
        t.startTime?.slice(0, 5),

      endTime:
        t.endTime?.slice(0, 5),

      facultyName:
        t.facultyName || "Faculty",

      classType:
        t.classType || "Lecture",

      eventType: "TIMETABLE"

    }));

    /* ─────────────────────────────────────────────
       Convert approved bookings
    ───────────────────────────────────────────── */
    const approvedEvents = bookingsRes.data.map((b, index) => ({

      id: `bk-${index}`,

      // lectureIndex:
      //   Math.max(
      //     0,
      //     parseInt(
      //       String(b.lectureSlot || "1")
      //         .replace(/\D/g, "")
      //     ) - 1
      //   ),

      lectureIndex:
        lectureToIndex(b.lectureSlot),

      // startTime:
      //   b.startTime?.slice(0, 5),

      // endTime:
      //   b.endTime?.slice(0, 5),

      // startTime:
      //   LECTURE_TIMES[b.lectureSlot]?.start || "09:00",

      // endTime:
      //   LECTURE_TIMES[b.lectureSlot]?.end || "10:00",

      startTime:
        b.startTime?.slice(0, 5),

      endTime:
        b.endTime?.slice(0, 5),

      facultyName:
        b.facultyName || "Faculty",

      classType:
        b.purpose || "Approved Booking",

      eventType: "APPROVED"

    }));

    /* ─────────────────────────────────────────────
       Merge both
    ───────────────────────────────────────────── */
    const merged = [

      ...timetableEvents,
      ...approvedEvents

    ];

    console.log("Merged Events:", merged);

    setTimetable(merged);

  } catch (err) {

    console.error(
      "fetchTimetable error:",
      err.response?.data || err.message
    );

    setTimetable([]);

  } finally {

    setTimetableLoading(false);
  }
};

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    // fetchResources is triggered by useEffect above
  };

  /* ── Build events for the calendar from timetable ── */
  // Booked slots come from timetable_entries (already scheduled classes).
  // We mark remaining slots as "available" for display purposes.
  const buildEvents = () => {

  return timetable.map((t) => ({

    dayIdx: t.lectureIndex,

    start: t.startTime,

    end: t.endTime,

    type:
      t.eventType === "APPROVED"
        ? "pending"
        : "booked",

    name: t.facultyName,

    activity: t.classType

  }));
};

  const events = buildEvents();

  const details = selected
    ? {
        type:     selected.type,
        capacity: selected.capacity ? `${selected.capacity} Students` : "N/A",
        location: selected.location || "N/A",
        kind:     selected.type,
        amenities: selected.amenities || "N/A",
      }
    : { type: "", capacity: "", location: "", kind: "", amenities: "" };

  return (
    <div className="rc-root">

      {/* ── Sidebar ─────────────────────── */}
      <aside className="rc-sidebar">
        <div className="rc-brand">
          <span className="rc-brand-icon"><GridIcon /></span>
          <span className="rc-brand-text">Resource Allocation<br />System</span>
        </div>
        <nav className="rc-nav">
          {NAV.map(({ label, Icon }) => (
            <button
              key={label}
              className={`rc-nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => {
                setActiveNav(label);
                if (label === "Logout")    navigate("/login");
                if (label === "Dashboard") navigate("/faculty-dashboard");
                if (label === "My Requests") navigate("/my-requests");
                if (label === "Show Resources") navigate("/show-resources");
                // if (label === "Profile") navigate("/faculty-profile");

              }}
            >
              <span className="rc-nav-icon"><Icon /></span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main ────────────────────────── */}
      <div className="rc-main">

        {/* Top header */}
        <header className="rc-header">
          <div className="rc-header-left">
            <button className="rc-back-btn" onClick={() => navigate("/faculty-dashboard")}>
              <ArrowLeftIcon />
            </button>
            <div>
              <h1 className="rc-title">Resource Availability Calendar</h1>
              <p className="rc-subtitle">View availability of resources and time slots.</p>
            </div>
          </div>
          <div className="rc-header-right">
            <button className="rc-notif-btn">
              <BellIcon />
              <span className="rc-notif-badge">2</span>
            </button>
            <div className="rc-user-chip">
              <div className="rc-avatar">E</div>
              <div className="rc-user-text">
                <span className="rc-user-name">Dr. Emily Davis</span>
                <span className="rc-user-role">Faculty</span>
              </div>
              <ChevronDownIcon />
            </div>
          </div>
        </header>

        {/* Controls bar */}
        <div className="rc-controls">

          {/* Category filter */}
          <div className="rc-resource-select-wrap">
            <label className="rc-control-label">Category</label>
            <div className="rc-select-box">
              <select
                className="rc-select"
                value={category}
                onChange={e => handleCategoryChange(e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDownIcon />
            </div>
          </div>

          <span className="rc-filter-arrow"><ChevronRightIcon /></span>

          {/* Resource filter (populated from API) */}
          <div className="rc-resource-select-wrap">
            <label className="rc-control-label">Resource</label>
            <div className="rc-select-box">
              <select
                className="rc-select rc-select--resource"
                value={selected?.resourceId ?? ""}
                onChange={e => {
                  const picked = resources.find(r => r.resourceId === Number(e.target.value));
                  if (picked) setSelected(picked);
                }}
                disabled={loading}
              >
                {loading
                  ? <option>Loading…</option>
                  : resources.map(r => (
                      <option key={r.resourceId} value={r.resourceId}>{r.name}</option>
                    ))
                }
              </select>
              <ChevronDownIcon />
            </div>
          </div>

          <div className="rc-week-nav">
            <button className="rc-nav-arrow"><ChevronLeftIcon /></button>
            <button className="rc-today-btn">Today</button>
            <button className="rc-nav-arrow"><ChevronRightIcon /></button>
          </div>

          <span className="rc-date-range">Lecture 1 – Lecture 6</span>

          <div className="rc-view-toggle">
            <button
              className={`rc-toggle-btn ${viewMode === "week" ? "active" : ""}`}
              onClick={() => setViewMode("week")}
            >Week View</button>
            <button
              className={`rc-toggle-btn ${viewMode === "day" ? "active" : ""}`}
              onClick={() => setViewMode("day")}
            >Day View</button>
          </div>
        </div>

        {/* Calendar body + right panel */}
        <div className="rc-body-wrap">

          {/* ── Calendar grid ── */}
          <div className="rc-calendar">

            {/* Lecture headers */}
            <div className="rc-col-headers">
              <div className="rc-time-spacer" />
              {WEEK_DAYS.map(d => (
                <div key={d.idx} className="rc-col-header">
                  <span className="rc-col-date">{d.lecture}</span>
                </div>
              ))}
            </div>

            {/* Scrollable grid */}
            <div className="rc-grid-scroll">
              {timetableLoading ? (
                <div className="rc-loading">Loading schedule…</div>
              ) : (
                <div className="rc-grid-inner">

                  {/* Time labels */}
                  <div className="rc-time-col">
                    {HOURS.map(h => (
                      <div key={h} className="rc-time-cell">
                        <span className="rc-time-label">{hourLabel(h)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {WEEK_DAYS.map(d => (
                    <div key={d.idx} className="rc-day-col">
                      {HOURS.map(h => (
                        <div key={h} className="rc-hour-line"
                             style={{ top: `${(h - BASE_HOUR) * HOUR_HEIGHT}px` }} />
                      ))}

                      {events
                        .filter(ev => ev.dayIdx === d.idx)
                        .map((ev, i) => (
                          <div
                            key={i}
                            className={`rc-event rc-event--${ev.type}`}
                            style={eventStyle(ev.start, ev.end)}
                          >
                            <span className="rc-event-time">
                              {to12h(ev.start)} - {to12h(ev.end)}
                            </span>
                            {ev.type === "booked" && (
                              <>
                                <span className="rc-event-name">{ev.name}</span>
                                <span className="rc-event-activity">{ev.activity}</span>
                              </>
                            )}
                            {ev.type === "available" && (
                              <span className="rc-event-status">Available</span>
                            )}
                            {ev.type === "pending" && (
                              <span className="rc-event-status">Pending</span>
                            )}
                          </div>
                        ))
                      }
                    </div>
                  ))}

                </div>
              )}
            </div>
          </div>

          {/* ── Right panel ── */}
          <aside className="rc-panel">

            <h3 className="rc-panel-heading">Selected Resource</h3>
            <div className="rc-resource-card">
              <div className="rc-resource-card-icon"><MonitorIcon /></div>
              <div>
                <p className="rc-resource-card-name">{selected?.name ?? "—"}</p>
                <p className="rc-resource-card-type">
                  {selected?.type === "Lab"       && "Computer Laboratory"}
                  {selected?.type === "Hall"      && "Seminar / Hall"}
                  {selected?.type === "Classroom" && "Classroom"}
                </p>
              </div>
            </div>

            <h3 className="rc-panel-heading rc-panel-heading--mt">Resource Details</h3>
            <table className="rc-details-table">
              <tbody>
                <tr>
                  <td className="rc-detail-key">Capacity</td>
                  <td className="rc-detail-val">{details.capacity}</td>
                </tr>
                <tr>
                  <td className="rc-detail-key">Location</td>
                  <td className="rc-detail-val">{details.location}</td>
                </tr>
                <tr>
                  <td className="rc-detail-key">Type</td>
                  <td className="rc-detail-val rc-detail-val--accent">{details.kind}</td>
                </tr>
                <tr>
                  <td className="rc-detail-key">Amenities</td>
                  <td className="rc-detail-val">{details.amenities}</td>
                </tr>
              </tbody>
            </table>

            <h3 className="rc-panel-heading rc-panel-heading--mt">Legend</h3>
            <div className="rc-legend">
              <div className="rc-legend-item">
                <span className="rc-legend-dot rc-legend-dot--available" />
                <div>
                  <p className="rc-legend-label">Available</p>
                  <p className="rc-legend-desc">Time slot is available</p>
                </div>
              </div>
              <div className="rc-legend-item">
                <span className="rc-legend-dot rc-legend-dot--booked" />
                <div>
                  <p className="rc-legend-label">Booked</p>
                  <p className="rc-legend-desc">Time slot is already booked</p>
                </div>
              </div>
              <div className="rc-legend-item">
                <span className="rc-legend-dot rc-legend-dot--pending" />
                <div>
                  <p className="rc-legend-label">Pending</p>
                  <p className="rc-legend-desc">Awaiting approval</p>
                </div>
              </div>
            </div>

            <div className="rc-info-box">
              <span className="rc-info-icon"><InfoIcon /></span>
              <p className="rc-info-text">Click on any time slot to make a booking request.</p>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SVG ICONS  (same as original)
═══════════════════════════════════════════════════ */
function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor"/>
      <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor"/>
      <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor"/>
      <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor"/>
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7"/>
      <line x1="16.5" y1="16.5" x2="22" y2="22"/>
    </svg>
  );
}
function RequestsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function ProfileIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  );
}
function ArrowLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
function MonitorIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
      <circle cx="12" cy="12" r="9"/>
      <line x1="12" y1="8" x2="12" y2="8"/>
      <line x1="12" y1="12" x2="12" y2="16"/>
    </svg>
  );
}