import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export function Footer() {
    return(
        <footer style={{
            background: 'white',
            borderTop: '1px solid #e2e8f0',
            color: '#64748b',
            marginTop: 'auto'
        }} className="text-center py-4">
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
                <p className="mb-2" style={{
                    color: '#1e293b',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                }}>
                    🚂 <span style={{ color: '#3b82f6' }}>Train</span>Go
                </p>
                <p className="mb-0" style={{
                    color: '#64748b',
                    fontSize: '0.875rem'
                }}>
                    © 2025 TrainGo. Professional railway booking system.
                </p>
            </div>
        </footer>
    )
}