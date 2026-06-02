import React, { useState } from "react";
import "./Register.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
  const navigate = useNavigate();

  // 1. State to hold form data (matching your User.java fields)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    phone: "",
    role: "Student",
    department: "",
    password: "",
    dob: ""
  });

  // 2. Handle input changes dynamically
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 3. Axios connection to Spring Boot
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Ensure the URL matches your Spring Boot server port
      const response = await axios.post("http://localhost:8080/api/register", formData);
      alert(response.data); 
      navigate("/login");
    } catch (error) {
      // Displays the specific error from your Service layer (e.g., "Email already in use")
      alert("Error: " + (error.response?.data || "Server connection failed"));
    }
  };

  return (
    <div className="register-container">
      {/* 🔷 Left Side Illustration */}
      <div className="register-left">
        <div className="overlay-content">
          <h1>Join Us Today!</h1>
          <p>Create your account and start managing resources efficiently with our system.</p>
          <div className="illustration-wrapper">
            <img src="/computer1.svg" alt="Illustration" />
          </div>
        </div>
      </div>

      {/* 🔷 Right Side Form */}
      <div className="register-right">
        <div className="form-box">
          <div className="form-header">
            <h2>Create an Account</h2>
            <p>Fill in the details below to register</p>
          </div>

          <form className="register-form" onSubmit={handleRegister}>
            <div className="input-row">
              <div className="input-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="fullName" 
                  placeholder="Enter your full name" 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="Enter your email" 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Username</label>
                <input 
                  type="text" 
                  name="username" 
                  placeholder="Choose a username" 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  name="phone" 
                  placeholder="Enter your phone number" 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleChange}>
                  <option value="Admin">Admin</option>
                  <option value="Faculty">Faculty</option>
                  <option value="HOD">HOD</option>
                </select>
              </div>
              <div className="input-group">
                <label>Department (Optional)</label>
                <input 
                  type="text" 
                  name="department" 
                  placeholder="Enter your department" 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Password</label>
                <input 
                  type="password" 
                  name="password" 
                  placeholder="Create a password" 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="input-group">
                <label>Confirm Password</label>
                <input 
                  type="password" 
                  placeholder="Confirm your password" 
                  required 
                />
              </div>
            </div>

            <div className="input-group full-width">
              <label>Date of Birth (Optional)</label>
              <input 
                type="date" 
                name="dob" 
                onChange={handleChange} 
              />
            </div>

            <div className="checkbox-field">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">I agree to the <span>Terms and Conditions</span> and <span>Privacy Policy</span></label>
            </div>

            <button type="submit" className="btn-register-submit">Register</button>
          </form>

          <p className="login-link">
            Already have an account? <span onClick={() => navigate("/login")}>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;