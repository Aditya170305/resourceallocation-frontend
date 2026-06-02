import React, { useState, useEffect } from "react";
import "./MyRequests.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:8080/api";

/* ─── Constants ─────────────────────────────── */
const TIME_SLOTS = [
  { label: "09:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "11:00 AM", value: "11:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "01:00 PM", value: "13:00" },
  { label: "02:00 PM", value: "14:00" },
  { label: "03:00 PM", value: "15:00" },
  { label: "04:00 PM", value: "16:00" },
];

// const getAvailableTimeSlots = (selectedDate) => {


//   const today =
//     new Date().toISOString().split("T")[0];

//   // future date → all slots
//   if (selectedDate !== today) {
//     return TIME_SLOTS;
//   }

//   const now = new Date();

//   const currentHour = now.getHours();

//   // exact current/future slot
//   return TIME_SLOTS.filter(slot => {

//     const slotHour =
//       parseInt(slot.value.split(":")[0]);

//     return slotHour >= currentHour;
//   });
// };

// const getAvailableTimeSlots = (selectedDate) => {

//   const today =
//     new Date().toISOString().split("T")[0];

//   // future date → all slots
//   if (selectedDate !== today) {
//     return TIME_SLOTS;
//   }

//   const now = new Date();

//   const currentHour = now.getHours();

//   /*
//     allow current and next possible slots
//   */

//   return TIME_SLOTS.filter(slot => {

//     const slotHour =
//       parseInt(slot.value.split(":")[0]);

//     // allow current ongoing slot also
//     return slotHour >= (currentHour - 1);
//   });
// };

const getAvailableTimeSlots = (selectedDate) => {

  const today =
    new Date().toISOString().split("T")[0];

  /*
    future date
  */
  if (selectedDate !== today) {
    return TIME_SLOTS;
  }

  const now = new Date();

  const currentHour = now.getHours();

  /*
    current day slots
  */
  const available =
    TIME_SLOTS.filter(slot => {

      const slotHour =
        parseInt(
          slot.value.split(":")[0]
        );

      return slotHour >= currentHour;
    });

  /*
    if college timing over
    still show all slots
    to avoid empty dropdown
  */
  if (available.length === 0) {
    return TIME_SLOTS;
  }

  return available;
};

const LECTURE_SLOTS = [
  "1st Lecture", "2nd Lecture", "3rd Lecture",
  "4th Lecture", "5th Lecture", "6th Lecture"
];

const NAV_ITEMS = [
  { label: "Dashboard",      Icon: HomeIcon     },
  { label: "Show Resources", Icon: SearchIcon   },
  { label: "My Requests",    Icon: RequestIcon  },
  { label: "Profile",        Icon: ProfileIcon  },
  { label: "Logout",         Icon: LogoutIcon   },
];

const TABS = ["All", "Confirmed", "Pending", "Cancelled"];

/* ─── Resource Icons Map ──────────────────────── */
const RESOURCE_ICON = {
  Lab:       LabIcon,
  Hall:      HallIcon,
  Classroom: ClassroomIcon,
};

// const [resources, setResources] = useState([]);

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function MyRequests() {
  const navigate = useNavigate();

  /* ── Get Logged In Faculty ── */
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser")) || {};
  const facultyId = loggedInUser.id;

  /* ── UI States ── */
  const [activeNav,   setActiveNav]   = useState("My Requests");
  const [activeTab,   setActiveTab]   = useState("All");
  const [showModal,   setShowModal]   = useState(false);
  const [cancelId,    setCancelId]    = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ── Dynamic Data States ── */
  const [bookings,  setBookings]  = useState([]);
  const [resources, setResources] = useState([]); // Dynamic dropdown for form
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [stats,     setStats]     = useState({ total: 0, confirmed: 0, pending: 0, cancelled: 0 });
  const [loading,   setLoading]   = useState(true);

  /* ── Form State (Matches BookingRequestDTO) ── */
  const [form, setForm] = useState({
    resourceId: "",
    date: "",
    lectureSlot: "1st Lecture",
    startTime: "09:00",
    endTime: "10:00",
    purpose: "",
  });
  const [formError, setFormError] = useState("");

  /* ── Init Fetch ── */
  useEffect(() => {
    if (!facultyId) {
      navigate("/login");
      return;
    }
    fetchBookingsAndStats();
    fetchAvailableResources();
  }, []);

  useEffect(() => {

  if (
    form.resourceId &&
    form.date
  ) {

    fetchOccupiedSlots(
      form.resourceId,
      form.date
    );
  }

}, [
  form.resourceId,
  form.date
]);

  /* ── API: Fetch Bookings & Stats ── */
  const fetchBookingsAndStats = async () => {
    try {
      setLoading(true);
      // Fetch Bookings
      const res = await axios.get(`${API_BASE}/bookings/my`, {
        params: { facultyId, status: "ALL" }
      });
      
      // Map Backend Statuses to UI Statuses cleanly
      const formatted = res.data.map((b) => ({
        id: b.bookingId,
        resource: b.resourceName,
        resourceType: b.resourceType,
        date: b.bookingDate,
        startTime: formatTime(b.startTime),
        endTime: formatTime(b.endTime),
        purpose: b.purpose,
        status: b.status === "APPROVED" ? "Confirmed"
              : (b.status === "REJECTED" || b.status === "CANCELLED") ? "Cancelled"
              : "Pending",
        bookedOn: b.requestedAt ? b.requestedAt.split('T') : "N/A",
        hallBooking: b.hallBooking,
        remarks: b.hodRemarks
      }));
      setBookings(formatted);

      // Fetch Stats
      const statRes = await axios.get(`${API_BASE}/bookings/my/stats`, {
        params: { facultyId }
      });
      setStats({
        total: statRes.data.total,
        confirmed: statRes.data.approved,
        pending: statRes.data.pending,
        cancelled: statRes.data.cancelled + statRes.data.rejected 
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── API: Fetch Allowed Resources for Dropdown ── */
  const fetchAvailableResources = async () => {
    try {
      const dept = loggedInUser.department || "";
      const labs = await axios.get(`${API_BASE}/resources/category?name=Labs&department=${dept}&role=Faculty`);
      const halls = await axios.get(`${API_BASE}/resources/category?name=Halls&department=${dept}&role=Faculty`);
      const classrooms = await axios.get(`${API_BASE}/resources/category?name=Classrooms&department=${dept}&role=Faculty`);
      
      setResources([...labs.data, ...halls.data, ...classrooms.data]);
    } catch (err) {
      console.error("Failed to load resources for form.", err);
    }
  };

  const fetchOccupiedSlots = async (
  resourceId,
  bookingDate
) => {

  if (!resourceId || !bookingDate) {
    setOccupiedSlots([]);
    return;
  }

  try {

    // timetable
    const timetableRes =
      await axios.get(
        `${API_BASE}/resources/${resourceId}/timetable`
      );

    // approved bookings
    const bookingsRes =
      await axios.get(
        `${API_BASE}/bookings/resource/${resourceId}/approved`
      );

    const occupied = [];

    // timetable lectures
    timetableRes.data.forEach(t => {

      if (
        t.bookingDate === bookingDate ||
        !t.bookingDate
      ) {

        occupied.push(
          t.lectureSlot
        );
      }
    });

    // approved booking lectures
    bookingsRes.data.forEach(b => {

      if (
        b.bookingDate === bookingDate
      ) {

        occupied.push(
          b.lectureSlot
        );
      }
    });

    // setOccupiedSlots(
    //   [...new Set(occupied)]
    // );

    const uniqueOccupied =
  [...new Set(occupied)];

setOccupiedSlots(uniqueOccupied);

/*
  auto-select first free lecture
*/

const freeLectures =
  LECTURE_SLOTS.filter(
    slot => !uniqueOccupied.includes(slot)
  );

if (freeLectures.length > 0) {

  setForm(prev => ({
    ...prev,
    lectureSlot: freeLectures[0]
  }));
}

  } catch (err) {

    console.error(
      "Failed to fetch occupied slots",
      err
    );
  }
};

  /* ── Handlers ── */
  const handleNav = (item) => {
    setActiveNav(item.label);
    if (item.label === "Logout") {
      localStorage.removeItem("loggedInUser");
      navigate("/login");
    }
    if (item.label === "Dashboard") navigate("/faculty-dashboard");
    if (item.label === "My Requests") navigate("/my-requests");
    if (item.label === "Show Resources") navigate("/show-resources");
    // if (item.label === "Profile") navigate("/faculty-profile");
  };

  const selectedResource = resources.find(
  r => r.resourceId === parseInt(form.resourceId)
  );

  const selectedResourceType =
  selectedResource?.type?.toLowerCase();

  const handleFormChange = (e) => {

  const { name, value } = e.target;

  let updatedForm = {
    ...form,
    [name]: value
  };

  if (name === "resourceId") {

  const selected = resources.find(
    r => r.resourceId === parseInt(value)
  );

  const type =
    selected?.type?.toLowerCase();

  // labs/classrooms → today only
  if (
    type === "lab" ||
    type === "classroom"
  ) {

    // updatedForm.date =
    //   new Date()
    //     .toISOString()
    //     .split("T")[0];
    const todayDate =
  new Date()
    .toISOString()
    .split("T")[0];

updatedForm.date = todayDate;

/*
  auto-set first available time
*/

const availableSlots =
  getAvailableTimeSlots(todayDate);

if (availableSlots.length > 0) {

  updatedForm.startTime =
    availableSlots[0].value;

  updatedForm.endTime =
    availableSlots[1]
      ? availableSlots[1].value
      : availableSlots[0].value;
}
  }
}

  // auto-update end time when start time changes
  if (name === "startTime") {

    const slots =
      getAvailableTimeSlots(form.date);

    const currentIndex =
      slots.findIndex(
        s => s.value === value
      );

    if (
      currentIndex !== -1 &&
      slots[currentIndex + 1]
    ) {
      updatedForm.endTime =
        slots[currentIndex + 1].value;
    }
  }

  setForm(updatedForm);

  setFormError("");
};

  /* ── API: Submit Request ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.resourceId || !form.date || !form.purpose.trim()) {
      setFormError("Please fill in all fields before submitting.");
      return;
    }
    if (form.startTime >= form.endTime) {
      setFormError("End time must be after start time.");
      return;
    }

    const selectedResource = resources.find(
  r => r.resourceId === parseInt(form.resourceId)
);

if (selectedResource) {

  const resourceType =
    selectedResource.type?.toLowerCase();

  const today =
    new Date().toISOString().split("T")[0];

  /*
    HALL RULE
    Minimum 2 days advance booking
  */
  if (resourceType === "hall") {

    const bookingDate =
      new Date(form.date);

    const currentDate =
      new Date();

    const diffDays = Math.ceil(
      (bookingDate - currentDate) /
      (1000 * 60 * 60 * 24)
    );

    if (diffDays < 2) {

      setFormError(
        "Hall bookings must be made at least 2 days in advance."
      );

      return;
    }
  }

  /*
    LAB + CLASSROOM RULE
    Only current day booking allowed
  */
  if (
    resourceType === "lab" ||
    resourceType === "classroom"
  ) {

    if (form.date !== today) {

      setFormError(
        "Labs and classrooms can only be booked for today."
      );

      return;
    }
  }
}

      if (
      occupiedSlots.length ===
      LECTURE_SLOTS.length
    ) {

      setFormError(
        "No lecture slots available for this resource."
      );

      return;
    }

    try {
      const payload = {
        resourceId: parseInt(form.resourceId),
        bookingDate: form.date,
        lectureSlot: form.lectureSlot,
        startTime: form.startTime + ":00", 
        endTime: form.endTime + ":00",
        purpose: form.purpose
      };

      await axios.post(`${API_BASE}/bookings/request?facultyId=${facultyId}`, payload);
      
      setShowModal(false);
      setForm({ resourceId: "", date: "", lectureSlot: "1st Lecture", startTime: "09:00", endTime: "10:00", purpose: "" });
      setFormError("");
      fetchBookingsAndStats(); // Refresh grid instantly

    } catch (error) {
      setFormError(error.response?.data || "Failed to submit booking request.");
    }
  };

  /* ── API: Cancel Request ── */
  const handleCancelClick = (id) => {
    setCancelId(id);
    setShowConfirm(true);
  };

  const confirmCancel = async () => {
    try {
      await axios.put(`${API_BASE}/bookings/${cancelId}/cancel`, {}, {
        params: { requesterId: facultyId, role: "Faculty" }
      });
      setShowConfirm(false);
      setCancelId(null);
      fetchBookingsAndStats();
    } catch (err) {
      alert(err.response?.data || "Cancel failed");
    }
  };

  /* ── Utility: Format Time to AM/PM ── */
  const formatTime = (time24) => {
    if(!time24) return "";
    const [h, m] = time24.split(":");
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2,"0")}:${m} ${ampm}`;
  };

  /* ── Filtered bookings mapping ── */
  const filtered = activeTab === "All"
    ? bookings
    : bookings.filter(b => b.status === activeTab);

  /* ═══ RENDER ═══ */
  return (
    <div className="mb-root">

      {/* ── Sidebar ── */}
      <aside className="mb-sidebar">
        <div className="mb-brand">
          <span className="mb-brand-icon"><GridIcon /></span>
          <span className="mb-brand-text">Resource Allocation<br />System</span>
        </div>
        <nav className="mb-nav">
          {NAV_ITEMS.map(({ label, Icon }) => (
            <button
              key={label}
              className={`mb-nav-item ${activeNav === label ? "active" : ""}`}
              onClick={() => handleNav({ label })}
            >
              <span className="mb-nav-icon"><Icon /></span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main ── */}
      <div className="mb-main">

        <header className="mb-header">
          <div>
            <h1 className="mb-title">My Bookings</h1>
            <p className="mb-subtitle">Manage and track all your resource reservations.</p>
          </div>
          <div className="mb-header-right">
            <button className="mb-notif-btn">
              <BellIcon />
              <span className="mb-notif-badge">2</span>
            </button>
            <div className="mb-user-chip">
              <div className="mb-avatar">{loggedInUser.fullName ? loggedInUser.fullName.charAt(0) : "F"}</div>
              <div className="mb-user-text">
                <span className="mb-user-name">{loggedInUser.fullName || "Faculty"}</span>
                <span className="mb-user-role">{loggedInUser.department || "Faculty"}</span>
              </div>
              <ChevronDownIcon />
            </div>
          </div>
        </header>

        <div className="mb-content">

          {/* Stats */}
          <div className="mb-stats">
            <StatCard value={stats.total}     label="Total Bookings"   color="blue"   icon={<TotalIcon />}     />
            <StatCard value={stats.confirmed} label="Confirmed"        color="green"  icon={<ConfirmedIcon />} />
            <StatCard value={stats.pending}   label="Pending Approval" color="orange" icon={<PendingIcon />}   />
            <StatCard value={stats.cancelled} label="Cancelled"        color="red"    icon={<CancelledIcon />} />
          </div>

          {/* Toolbar */}
          <div className="mb-toolbar">
            <div className="mb-tabs">
              {TABS.map(tab => (
                <button
                  key={tab}
                  className={`mb-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button className="mb-new-btn" onClick={() => setShowModal(true)}>
              <PlusIcon />
              New Booking Request
            </button>
          </div>

          {/* Booking Cards */}
          {loading ? (
             <div className="mb-empty"><p>Loading bookings...</p></div>
          ) : filtered.length === 0 ? (
            <div className="mb-empty">
              <EmptyIcon />
              <p>No {activeTab === "All" ? "" : activeTab.toLowerCase()} bookings found.</p>
            </div>
          ) : (
            <div className="mb-cards">
              {filtered.map(b => {
                const RIcon = RESOURCE_ICON[b.resourceType] || LabIcon;
                return (
                  <div key={b.id} className={`mb-card mb-card--${b.status.toLowerCase()}`}>
                    <div className="mb-card-left">
                      <div className={`mb-card-icon mb-card-icon--${b.resourceType.toLowerCase()}`}>
                        <RIcon />
                      </div>
                    </div>

                    <div className="mb-card-body">
                      <div className="mb-card-top">
                        <div>
                          <h3 className="mb-card-resource">{b.resource}</h3>
                          <span className="mb-card-type">{b.resourceType}</span>
                          {b.hallBooking && <span style={{marginLeft:"10px", fontSize:"10px", background:"#fef3c7", color:"#b45309", padding:"2px 6px", borderRadius:"4px"}}>48h Rule</span>}
                        </div>
                        <span className={`mb-badge mb-badge--${b.status.toLowerCase()}`}>
                          {b.status === "Confirmed" && <CheckIcon />}
                          {b.status === "Pending"   && <ClockIcon />}
                          {b.status === "Cancelled" && <XIcon />}
                          {b.status}
                        </span>
                      </div>

                      <div className="mb-card-meta">
                        <span className="mb-meta-item">
                          <CalSmallIcon />
                          {b.date}
                        </span>
                        <span className="mb-meta-item">
                          <ClockSmallIcon />
                          {b.startTime} – {b.endTime}
                        </span>
                        <span className="mb-meta-item">
                          <NoteIcon />
                          {b.purpose}
                        </span>
                      </div>

                      {b.status === "Cancelled" && b.remarks && (
                         <div style={{marginTop: "8px", fontSize: "12px", color: "#dc2626"}}>
                            <strong>HOD Remark:</strong> {b.remarks}
                         </div>
                      )}
                    </div>

                    <div className="mb-card-actions">
                      <span className="mb-booked-on">Booked on {b.bookedOn}</span>
                      {b.status === "Pending" && (
                        <button
                          className="mb-cancel-btn"
                          onClick={() => handleCancelClick(b.id)}
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ New Booking Modal ══════════════ */}
      {showModal && (
        <div className="mb-overlay" onClick={() => setShowModal(false)}>
          <div className="mb-modal" onClick={e => e.stopPropagation()}>
            <div className="mb-modal-header">
              <div>
                <h2 className="mb-modal-title">New Booking Request</h2>
                <p className="mb-modal-sub">Fill in the details to request a resource.</p>
              </div>
              <button className="mb-modal-close" onClick={() => {setShowModal(false); setFormError("");}}>
                <XIcon />
              </button>
            </div>

            <form className="mb-form" onSubmit={handleSubmit}>
              <div className="mb-form-group">
                <label className="mb-label">Resource</label>
                <select name="resourceId" className="mb-select" value={form.resourceId} onChange={handleFormChange} required>
                  <option value="">Select a resource</option>
                  {resources.map(r => (
                    <option key={r.resourceId} value={r.resourceId}>{r.name} ({r.type})</option>
                  ))}
                </select>
              </div>

              <div className="mb-form-group">
                <label className="mb-label">Date</label>
                <input
                    type="date"
                    name="date"
                    className="mb-input"
                    value={
                      selectedResourceType === "lab" ||
                      selectedResourceType === "classroom"
                        ? new Date().toISOString().split("T")[0]
                        : form.date
                    }
                    onChange={handleFormChange}
                    min={new Date().toISOString().split("T")[0]}
                    disabled={
                      selectedResourceType === "lab" ||
                      selectedResourceType === "classroom"
                    }
                    required
                  />
              </div>
              
              <div className="mb-form-group">
                 <label className="mb-label">Lecture Slot</label>
                 <select name="lectureSlot" className="mb-select" value={form.lectureSlot} onChange={handleFormChange} required>
                    {LECTURE_SLOTS.filter(
                      slot =>
                        !occupiedSlots.includes(slot)
                    ).
                    map(l => <option key={l} value={l}>{l}</option>)}
                 </select>
              </div>
              
                      {occupiedSlots.length ===
        LECTURE_SLOTS.length && (

          <div className="mb-form-error">
            No lecture slots available
            for this resource on
            selected date.
          </div>

          )}

              <div className="mb-form-row">
                <div className="mb-form-group">
                  <label className="mb-label">Start Time</label>
                  <select name="startTime" className="mb-select" value={form.startTime} onChange={handleFormChange} required>
                    <option value="">Select start time</option>
                      {getAvailableTimeSlots(form.date)
                              .slice(0, -1)
                              .map(t => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                            ))}
                  </select>
                </div>
                <div className="mb-form-group">
                  <label className="mb-label">End Time</label>
                  <select name="endTime" className="mb-select" value={form.endTime} onChange={handleFormChange} required>
                    <option value="">Select end time</option>
                    {getAvailableTimeSlots(form.date)
                            .filter(slot => {

                              if (!form.startTime) return false;

                              return slot.value > form.startTime;
                            })
                            .map(t => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                          ))}
                  </select>
                </div>
              </div>

              {/* {form.date && getAvailableTimeSlots(form.date).length === 0 &&
                form.date === new Date().toISOString().split("T")[0] && (

                <div className="mb-form-error">
                No booking slots available for today.
              </div>
            )} */}


              <div className="mb-form-group">
                <label className="mb-label">Purpose / Note</label>
                <textarea
                  name="purpose"
                  className="mb-textarea"
                  placeholder="Describe the purpose of your booking..."
                  value={form.purpose}
                  onChange={handleFormChange}
                  rows={3}
                  required
                />
              </div>

              {formError && (
                <div className="mb-form-error">
                  <InfoIcon /> {formError}
                </div>
              )}

              <div className="mb-form-actions">
                <button type="button" className="mb-btn-cancel" onClick={() => { setShowModal(false); setFormError(""); }}>
                  Cancel
                </button>
                <button type="submit" className="mb-btn-submit">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Cancel Confirmation Dialog ═════ */}
      {showConfirm && (
        <div className="mb-overlay" onClick={() => setShowConfirm(false)}>
          <div className="mb-confirm" onClick={e => e.stopPropagation()}>
            <div className="mb-confirm-icon"><WarnIcon /></div>
            <h3 className="mb-confirm-title">Cancel This Booking?</h3>
            <p className="mb-confirm-msg">This action cannot be undone. The time slot will be released.</p>
            <div className="mb-confirm-actions">
              <button className="mb-btn-cancel" onClick={() => setShowConfirm(false)}>Keep Booking</button>
              <button className="mb-btn-danger" onClick={confirmCancel}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ─── Stat Card ─────────────────────────────── */
function StatCard({ value, label, color, icon }) {
  return (
    <div className={`mb-stat mb-stat--${color}`}>
      <div className={`mb-stat-icon mb-stat-icon--${color}`}>{icon}</div>
      <div>
        <p className="mb-stat-value">{value}</p>
        <p className="mb-stat-label">{label}</p>
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
function SearchIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>;
}
function CalendarIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function RequestIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
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
function PlusIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function CheckIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
}
function ClockIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>;
}
function XIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function CalSmallIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function ClockSmallIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>;
}
function NoteIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>;
}
function InfoIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>;
}
function WarnIcon() {
  return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function EmptyIcon() {
  return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function TotalIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function ConfirmedIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><polyline points="9 12 11 14 15 10"/></svg>;
}
function PendingIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>;
}
function CancelledIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
}
function LabIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 3h6M9 3v6l-4 9a1 1 0 00.9 1.5h12.2A1 1 0 0019 18l-4-9V3"/><line x1="6.5" y1="14" x2="17.5" y2="14"/></svg>;
}
function HallIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function ClassroomIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
}