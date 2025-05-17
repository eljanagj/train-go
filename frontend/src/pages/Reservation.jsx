import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Reservation.css";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import { FaTrain, FaClock, FaMapMarkerAlt, FaEuroSign, FaChair } from "react-icons/fa";
import TrainAnimation from "../components/TrainAnimation";

export default function ReservationPage() {
  const { user } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();
  const route = location.state?.route;

  const [formData, setFormData] = useState({
    name: user?.given_name || user?.name?.split(' ')[0] || "",
    surname: user?.family_name || user?.name?.split(' ')[1] || "",
    seat: "",
    discountCode: ""
  });

  const [loading, setLoading] = useState(false);
  const [showTrain, setShowTrain] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReserve = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowTrain(true);
      setTimeout(() => {
        setShowTrain(false);
        setSuccess(true);
      }, 1700); // matches train animation duration
    }, 1200); // loader duration
  };

  if (!route) {
    return (
      <div className="reservation-page">
        <NavBar />
        <div className="container mt-5">
          <div className="alert alert-warning text-center">
            No route selected. Please <button className="btn btn-link p-0" onClick={() => navigate("/search")}>search for a route</button> first.
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="reservation-page">
      <NavBar />
      {showTrain && <TrainAnimation />}
      <header className="reservation-header" style={{ filter: loading || showTrain ? 'blur(2px)' : 'none' }}>
        <h1>Route Details & Reservation</h1>
        <p className="lead text-light">Confirm your journey and book your seat</p>
      </header>
      <main className="reservation-container container" style={{ filter: loading || showTrain ? 'blur(2px)' : 'none' }}>
        {success ? (
          <div className="alert alert-success text-center mt-5">
            <h2>🎉 Reservation Successful! 🎉</h2>
            <p>All aboard, {formData.name || "traveler"}! Your seat is reserved.</p>
            <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>Back to Home</button>
          </div>
        ) : (
          <div className="row g-5">
            {/* Left: Route Info */}
            <div className="col-md-6">
              <div className="info-card">
                <h4 className="mb-4">Your Route</h4>
                <p><FaMapMarkerAlt className="me-2" />From: <strong>{route.departureStation}</strong></p>
                <p><FaMapMarkerAlt className="me-2" />To: <strong>{route.arrivalStation}</strong></p>
                <p><FaEuroSign className="me-2" />Price: <strong>€{route.price}</strong></p>
                <p>Capacity: <strong>{route.capacity}</strong></p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="info-card">
                <h4 className="mb-4">Passenger Info</h4>
                <div className="mb-3">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    placeholder="Doe"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Seat Preference <small className="text-muted">(Optional)</small></label>
                  <input
                    type="text"
                    className="form-control"
                    name="seat"
                    value={formData.seat}
                    onChange={handleChange}
                    placeholder="e.g., 12A"
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label">
                    Discount Code <small className="text-muted">(Optional)</small>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="discountCode"
                    value={formData.discountCode}
                    onChange={handleChange}
                    placeholder="e.g., SAVE10"
                  />
                </div>
                <button
                  className="btn btn-reserve text-white w-100"
                  onClick={handleReserve}
                  disabled={!formData.name || !formData.surname || loading || showTrain}
                >
                  Reserve Now
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
