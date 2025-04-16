import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Reservation.css";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import { FaTrain, FaClock, FaMapMarkerAlt, FaEuroSign, FaChair } from "react-icons/fa";

const mockSelectedRoute = {
  from: "Berlin",
  to: "Munich",
  time: "08:30",
  price: 45,
  duration: "4h 10m",
  platform: "5A",
  trainNumber: "ICE 789"
};

export default function ReservationPage() {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    seat: "",
    discountCode: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReserve = () => {
    alert(`Reservation made for ${formData.name} ${formData.surname}`);
  };

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
              <p><FaMapMarkerAlt className="me-2" />From: <strong>{mockSelectedRoute.from}</strong></p>
              <p><FaMapMarkerAlt className="me-2" />To: <strong>{mockSelectedRoute.to}</strong></p>
              <p><FaClock className="me-2" />Departure Time: <strong>{mockSelectedRoute.time}</strong></p>
              <p><FaTrain className="me-2" />Train Number: <strong>{mockSelectedRoute.trainNumber}</strong></p>
              <p><FaChair className="me-2" />Platform: <strong>{mockSelectedRoute.platform}</strong></p>
              <p>Duration: <strong>{mockSelectedRoute.duration}</strong></p>
              <p><FaEuroSign className="me-2" />Price: <strong>€{mockSelectedRoute.price}</strong></p>
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
                <label className="form-label">Discount Code <small className="text-muted">(Optional)</small></label>
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
