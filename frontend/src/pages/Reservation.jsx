import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Reservation.css";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import { FaTrain, FaClock, FaMapMarkerAlt, FaEuroSign, FaChair } from "react-icons/fa";

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReserve = () => {
    alert(`Reservation made for ${formData.name} ${formData.surname}`);
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

      <header className="reservation-header">
        <h1>Route Details & Reservation</h1>
        <p className="lead text-light">Confirm your journey and book your seat</p>
      </header>

      <main className="reservation-container container">
        <div className="row g-5">
          {/* Left: Route Info */}
          <div className="col-md-6">
            <div className="info-card">
              <h4 className="mb-4">Your Route</h4>
              <p><FaMapMarkerAlt className="me-2" />From: <strong>{route.departureStation}</strong></p>
              <p><FaMapMarkerAlt className="me-2" />To: <strong>{route.arrivalStation}</strong></p>
              <p><FaEuroSign className="me-2" />Price: <strong>€{route.price}</strong></p>
              <p>Capacity: <strong>{route.capacity}</strong></p>
              {/* Add more fields if your backend provides them */}
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
                disabled={!formData.name || !formData.surname}
              >
                Reserve Now
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
