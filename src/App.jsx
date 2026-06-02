import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login"; // New import
import FacultyDashboard from "./pages/FacultyDashboard";
import ResourceCalendar from "./pages/ResourceCalendar";
import ShowResources from "./pages/ShowResources";
import MyRequests from "./pages/MyRequests"; //
import HodDashboard from "./pages/HodDashboard";
import HodAllBookings from "./pages/HodAllBookings";
import HodResources from "./pages/HodResources";
import HodUploadTimetable from "./pages/HodUploadTimetable";
import HodProfile from "./pages/HodProfile"
import FacultyProfile from "./pages/FacultyProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminResources from "./pages/AdminResources";
// import AdminProfile from "./pages/AdminProfile";
import AdminManageUsers from "./pages/AdminManageUsers";



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/faculty-dashboard" element={<FacultyDashboard />} />
        <Route path="/resource-calendar" element={<ResourceCalendar />} />
        <Route path ="/show-resources" element={<ShowResources />} />
        <Route path="/my-requests" element={<MyRequests />} />
        <Route path="/hod-dashboard" element={<HodDashboard />} />
        <Route path="/hod-all-bookings" element={<HodAllBookings />} />
        <Route path="/hod-resources" element={<HodResources />} />
        <Route path="/hod-upload-timetable" element={<HodUploadTimetable />} />
        <Route path="/hod-profile" element={<HodProfile />} />
        <Route path="/faculty-profile" element={<FacultyProfile />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-resources" element={<AdminResources />} />
        {/* <Route path="/admin-profile" element={<AdminProfile />} /> */}
        <Route path="/admin-users" element={<AdminManageUsers />} />
      </Routes>
    </Router>
  );
}

export default App;