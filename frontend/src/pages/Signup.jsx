import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";

export default function SignupPage() {
  return (
    <div className="search-page">
      <NavBar />

      <div className="flex-grow-1 d-flex justify-content-center align-items-center py-5">
        <div className="info-card p-5" style={{ minWidth: "300px", maxWidth: "400px", width: "100%" }}>
          <h2 className="text-center mb-4" style={{
            background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Create Your Account</h2>
          <form>
            <div className="mb-3">
              <label className="form-label text-white">Full Name</label>
              <input type="text" className="form-control" placeholder="Your full name" />
            </div>
            <div className="mb-3">
              <label className="form-label text-white">Email address</label>
              <input type="email" className="form-control" placeholder="Enter your email" />
            </div>
            <div className="mb-4">
              <label className="form-label text-white">Password</label>
              <input type="password" className="form-control" placeholder="Create a password" />
            </div>
            <div className="d-grid">
              <button type="submit" className="btn search-btn">Sign Up</button>
            </div>
          </form>
          <p className="mt-3 text-center text-white">
            Already have an account? <a href="/login" style={{
              background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Login</a>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
