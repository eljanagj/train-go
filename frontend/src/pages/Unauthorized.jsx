import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';

const Unauthorized = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();

  return (
    <div className="unauthorized-page">
      <NavBar theme={theme} onToggleTheme={toggleTheme} />
      <div className="container mt-5 text-center">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body p-5">
                <div className="mb-4">
                  <i className="fas fa-exclamation-triangle text-warning" style={{ fontSize: '4rem' }}></i>
                </div>
                <h1 className="card-title h2 mb-3">Access Denied</h1>
                <p className="card-text text-muted mb-4">
                  You don't have permission to access this page. 
                  Administrator privileges are required.
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/')}
                  >
                    Go Home
                  </button>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={() => navigate(-1)}
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Unauthorized; 