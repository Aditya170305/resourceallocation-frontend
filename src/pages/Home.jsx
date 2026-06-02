import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function App() {
  const navigate = useNavigate();
  return (
    <div className="landing-container">
      {/* 🔷 Navbar */}
      <nav className="navbar">
        <div className="nav-logo">
          <span>📅</span>
          <h2 className="heading">Resource Allocation System</h2>
        </div>

        <ul className="nav-links">
          <li className="active">Home</li>
          <li>About</li>
          <li>Resources</li>
          <li>Contact</li>
        </ul>

        <div className="nav-auth">
          {/* <button className="btn-login-outline">Login</button> */}
          <button className="btn-login-outline" onClick={() => navigate("/login")}>Login</button>
          {/* <button className="btn-register">Register</button> */}
          <button className="btn-register" onClick={() => navigate("/register")}>Register</button>
        </div>
      </nav>

      {/* 🔷 Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <span className="badge">Smart • Simple • Efficient</span>

          <h1>
            Smart Resource Allocation for a <br />
            <span>Smarter Campus</span>
          </h1>

          <p>
            Resource Allocation System helps you book and manage labs,
            classrooms, equipment and other resources easily. Built for
            students, faculty and administrators.
          </p>

          <div className="hero-btns">
            {/* <button className="btn-primary">Login to Your Account</button> */}
            <button className="btn-primary" onClick={() => navigate("/login")}>Login to Your Account</button>
            {/* <button className="btn-secondary">Create an Account</button> */}
            <button className="btn-secondary" onClick={() => navigate("/register")}>Create an Account</button>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <strong>1000+</strong> Users
            </div>
            <div className="stat-item">
              <strong>2500+</strong> Bookings
            </div>
            <div className="stat-item">
              <strong>120+</strong> Resources
            </div>
            <div className="stat-item">
              <strong>99.9%</strong> Availability
            </div>
          </div>
        </div>

        <div className="hero-image">
          <img src="computer1.svg" alt="Hero" />
        </div>
      </header>

      {/* 🔷 Features Section */}
      <section className="features-section">
        <p className="sub-tag">WHY CHOOSE US</p>
        <h2 className="section-title">Powerful Features for Every User</h2>

        <div className="features-grid">
          <div className="feature-card">
            <div className="icon-circle blue">📅</div>
            <h3>Easy Booking</h3>
            <p>
              Book resources in just a few clicks. Simple and hassle-free
              process.
            </p>
          </div>

          <div className="feature-card">
            <div className="icon-circle green">🛡️</div>
            <h3>Conflict Management</h3>
            <p>
              Smart conflict detection ensures no double-booking and smooth
              scheduling.
            </p>
          </div>

          <div className="feature-card">
            <div className="icon-circle purple">📊</div>
            <h3>Real-time Availability</h3>
            <p>
              Check real-time availability of resources and plan your schedule
              better.
            </p>
          </div>

          <div className="feature-card">
            <div className="icon-circle orange">👥</div>
            <h3>Role-based Access</h3>
            <p>
              Different access for students, faculty and admins for better
              management.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
