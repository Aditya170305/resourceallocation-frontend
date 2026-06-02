import React, { useState } from "react";
import "./Login.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // 1. State for Login Data
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
    role: "" // This helps us verify they selected the right role
  });

  // 2. Handle Input Changes
  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  // 3. Handle Login Submission
  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post("http://localhost:8080/api/login", {
      username: loginData.username,
      password: loginData.password
    });

    const user = response.data;

    // ── Verify role matches what user selected ──────────────
    if (loginData.role && user.role !== loginData.role) {
      alert(`Login Failed: You selected role "${loginData.role}" but your account role is "${user.role}".`);
      return;
    }

    // ── Save with correct key ───────────────────────────────
    localStorage.setItem("loggedInUser", JSON.stringify(user));

    console.log("Logged in user saved:", user); // ← verify in DevTools console

    // ── Navigate by role ────────────────────────────────────
    if (user.role === "Faculty") {
      navigate("/faculty-dashboard");
    } else if (user.role === "HOD") {
      navigate("/hod-dashboard");
    } else if (user.role === "Admin") {
      navigate("/admin-dashboard");
    } else {
      alert("Role not recognized. Contact Administrator.");
    }

  } catch (error) {
    alert("Login Failed: " + (error.response?.data || "Invalid credentials"));
  }
};

  return (
    <div className="login-container">
      {/* 🔷 Left Side Illustration */}
      <div className="login-left">
        <div className="overlay-content">
          <h1>Welcome Back!</h1>
          <p>Login to access and manage resources efficiently.</p>
          <div className="illustration-wrapper">
             <img src="/computer2.svg" alt="Login Illustration" />
          </div>
        </div>
      </div>

      {/* 🔷 Right Side Form */}
      <div className="login-right">
        <div className="form-box">
          <div className="form-header">
            <h2>Login</h2>
            <p>Enter your credentials to continue</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label>Username </label>
              <input 
                type="text" 
                name="username"
                placeholder="Enter your username" 
                onChange={handleChange}
                required 
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input 
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter your password" 
                  onChange={handleChange}
                  required 
                />
                <span 
                  className="toggle-password" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🔒" : "👁️"}
                </span>
              </div>
            </div>

            <div className="input-group">
              <label>Role</label>
              <select name="role" onChange={handleChange} required>
                <option value="">Select your role</option>
                <option value="Admin">Admin</option>
                <option value="Faculty">Faculty</option>
                <option value="HOD">HOD</option>
              </select>
            </div>

            <div className="form-options">
              <div className="checkbox-field">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <span className="forgot-password">Forgot Password?</span>
            </div>

            <button type="submit" className="btn-login-submit">Login</button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <button className="btn-create-account" onClick={() => navigate("/register")}>
             Create New Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;