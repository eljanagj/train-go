import React, { useState } from "react";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import "../styles/Profile.css";
import { PageLoader } from "../components/PageLoader";
import { FaUserAstronaut, FaCalendarAlt, FaMedal, FaPalette } from "react-icons/fa";

const MOCK_TRIPS = 17;
const MOCK_MEMBER_SINCE = "2022-03-15";

const ProfileComponent = ({ theme, toggleTheme }) => {
  const { user, logout } = useAuth0();
  const [nickname, setNickname] = useState(user.nickname || user.name || "");
  const [editing, setEditing] = useState(false);

  const handleEdit = () => setEditing(true);
  const handleSave = () => setEditing(false);

  return (
    <div className={`profile-page advanced-profile next-level-profile`}>
      <NavBar theme={theme} onToggleTheme={toggleTheme} />
      <header className="profile-hero">
        <div className="profile-hero-bg" />
        <div className="profile-avatar-hero-wrapper">
          <div className="avatar-pedestal">
            <div className="avatar-glow-ring" />
            <img
              src={user.picture}
              alt={user.name}
              className="profile-avatar-hero advanced-avatar"
            />
            <div className="avatar-particles">
              {[...Array(12)].map((_, i) => (
                <span key={i} className={`particle particle-${i}`} />
              ))}
            </div>
          </div>
        </div>
      </header>
      <main className="profile-main container">
        <div className="info-card profile-details-card advanced-card next-level-card">
          <div className="profile-header-row">
            {editing ? (
              <input
                className="profile-nickname-input"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                onBlur={handleSave}
                autoFocus
              />
            ) : (
              <h2 className="profile-name next-level-name" onClick={handleEdit} title="Click to edit nickname">
                <FaUserAstronaut className="name-icon" />
                <span className="name-gradient-text">{nickname}</span> <span className="edit-pencil" title="Edit">✏️</span>
              </h2>
            )}
            <button className="logout-btn" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
              Log out
            </button>
          </div>
          <p className="profile-email">{user.email}</p>
          <div className="profile-stats-row next-level-stats">
            <div className="profile-stat-chip">
              <span className="stat-icon"><FaMedal /></span>
              <span className="stat-label">Trips</span>
              <span className="stat-value">{MOCK_TRIPS}</span>
            </div>
            <div className="profile-stat-chip">
              <span className="stat-icon"><FaCalendarAlt /></span>
              <span className="stat-label">Member</span>
              <span className="stat-value">{new Date(MOCK_MEMBER_SINCE).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="profile-extra-info">
            {user.sub && <div><b>User ID:</b> <span className="profile-userid">{user.sub}</span></div>}
            {user.updated_at && <div><b>Last Updated:</b> {new Date(user.updated_at).toLocaleString()}</div>}
          </div>
        </div>
        {/* --- Future Features as Orbs --- */}
        <section className="profile-future-section">
          <h3 className="future-section-title">Upcoming Profile Features</h3>
          <div className="profile-future-features next-level-future">
            <div className="future-orb-group">
              <div className="future-orb">
                <span className="orb-icon"><FaUserAstronaut /></span>
              </div>
              <div className="future-orb-label">Profile Picture<br /><span className="coming-soon">Coming Soon</span></div>
            </div>
            <div className="future-orb-group">
              <div className="future-orb">
                <span className="orb-icon"><FaPalette /></span>
              </div>
              <div className="future-orb-label">Backgrounds<br /><span className="coming-soon">Coming Soon</span></div>
            </div>
            <div className="future-orb-group">
              <div className="future-orb">
                <span className="orb-icon"><FaMedal /></span>
              </div>
              <div className="future-orb-label">Badges<br /><span className="coming-soon">Coming Soon</span></div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default withAuthenticationRequired(ProfileComponent, {
  onRedirecting: () => <PageLoader />, 
});
