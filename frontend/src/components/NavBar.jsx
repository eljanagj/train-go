import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthButtons } from "./AuthButtons";
import { Link } from "react-router-dom";


export function NavBar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-light" style={{
            position: 'relative',
            zIndex: 1000,
            background: 'white',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        }}>
            <div className="container-fluid" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <Link className="navbar-brand fw-bold" to="/" style={{
                    color: '#1e293b',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <span style={{ color: '#3b82f6' }}>Train</span>Go
                </Link>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    style={{ border: '1px solid #d1d5db' }}
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        <li className="nav-item">
                            <Link
                                className="nav-link"
                                to="/"
                                style={{
                                    color: '#64748b',
                                    fontWeight: '500',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.color = '#3b82f6';
                                    e.target.style.backgroundColor = '#f1f5f9';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.color = '#64748b';
                                    e.target.style.backgroundColor = 'transparent';
                                }}
                            >
                                Home
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                className="nav-link"
                                to="/search"
                                style={{
                                    color: '#64748b',
                                    fontWeight: '500',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.color = '#3b82f6';
                                    e.target.style.backgroundColor = '#f1f5f9';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.color = '#64748b';
                                    e.target.style.backgroundColor = 'transparent';
                                }}
                            >
                                Booking
                            </Link>
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