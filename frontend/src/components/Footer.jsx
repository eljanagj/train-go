import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export function Footer() {
    return(
        <footer style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            color: '#fff'
        }} className="text-center py-4">
            <p className="mb-0" style={{
                background: 'linear-gradient(to right, #ff416c, #ff4b2b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>© 2025 Train Go. Smooth Journeys Ahead.</p>
        </footer>
    )   
}