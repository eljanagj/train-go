import React, { useEffect } from "react";
import "../styles/Home.css"; 
import { Footer } from "../components/Footer";
import { NavBar } from "../components/NavBar";

export default function Home() {
  useEffect(() => {
    document.body.classList.add('homepage-body');
    return () => {
      document.body.classList.remove('homepage-body');
    };
  }, []);

  return (
    <div className="homepage">
      <NavBar/>
      <header className="hero">
        <div className="hero-overlay" />
        <img
          src="train.jpg"
          alt="Train Banner"
          className="hero-img"
        />
        <div className="hero-text">
          <h1>Your Journey Starts Here</h1>
          <p>Fast, Safe, and Comfortable Train Travel.</p>
        </div>
      </header>

      <section className="features">
        <h2 className="section-title">Why Choose Train Go?</h2>
        <p className="section-subtitle">
          Experience the speed and comfort of modern train travel — reliable
          schedules, great service, and unbeatable convenience.
        </p>

        <div className="cards">
          <div className="card">
            <h3>Reliable Service</h3>
            <p>
              Always on time with real-time tracking and top-tier maintenance.
            </p>
          </div>
          <div className="card">
            <h3>Ultimate Comfort</h3>
            <p>
              Modern seating, spacious cabins, and high-speed connectivity
              onboard.
            </p>
          </div>
          <div className="card">
            <h3>Safety First</h3>
            <p>
              Our commitment to your safety is at the heart of every journey.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
