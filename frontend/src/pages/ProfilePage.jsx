import React from "react";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import "../styles/Profile.css";
import { PageLoader } from "../components/PageLoader";

const ProfileComponent = () => {
  const { user } = useAuth0();

  return (
    <div className="profile-page">
      <NavBar />
      <header className="profile-hero">
        <div className="profile-hero-overlay" />
        <img
          src={user.picture}
          alt={user.name}
          className="profile-avatar-hero"
        />
      </header>

      <main className="profile-main container">
        <div className="info-card profile-details-card">
          <h2 className="profile-name">{user.name}</h2>
          <p className="profile-email">{user.email}</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default withAuthenticationRequired(ProfileComponent, {
  onRedirecting: () => <PageLoader />,
});
