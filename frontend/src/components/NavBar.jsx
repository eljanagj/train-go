import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export function NavBar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark" style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)'
        }}>
            <div className="container-fluid">
                <a className="navbar-brand fw-bold" href="#" style={{
                    background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>Train Go</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <a className="nav-link" href="/">Home</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="/search">Booking</a>
                        </li>
                        <li className="nav-item">
                            <a className="btn" href="login" style={{
                                background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
                                color: '#fff'
                            }}>Login</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    )
}