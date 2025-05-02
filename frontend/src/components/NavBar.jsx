import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthButtons } from "./AuthButtons";
import { Link } from "react-router-dom";


export function NavBar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark" style={{
            position: 'relative',
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)'
        }}>
            <div className="container-fluid">
                <Link className="navbar-brand fw-bold" to="/" style={{
                    background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>Train Go</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <Link className="nav-link" to="/">Home</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/search">Booking</Link>
                        </li>
                        <li className="nav-item">
                            <AuthButtons />
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    )
}