import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Reservation.css";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import { FaTrain, FaClock, FaMapMarkerAlt, FaEuroSign, FaChair } from "react-icons/fa";
import TrainAnimation from "../components/TrainAnimation";
import SeatSelectionPopup from "../components/SeatSelectionPopup";
import { seatService } from "../services/seatService";
import { reservationService } from "../services/reservationService";

export default function ReservationPage() {
  const { user, getAccessTokenSilently } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();
  const schedule = location.state?.schedule;

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    discountCode: ""
  });

  useEffect(() => {
    if (user) {
      let firstName = user.given_name;
      let lastName = user.family_name;

      if (!firstName && user.name) {
        if (user.name.includes('@')) {
          firstName = user.name.split('@')[0];
          lastName = "";
        } else {
          const nameParts = user.name.split(' ');
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        }
      }

      setFormData(prev => ({
        ...prev,
        name: firstName || "",
        surname: lastName || ""
      }));
    }
  }, [user]);

  const [allSeats, setAllSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showSeatPopup, setShowSeatPopup] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    if (schedule) {
      fetchAvailableSeats();
    }
  }, [schedule]);

  const fetchAvailableSeats = async () => {
    try {
      const data = await seatService.getAllSeatsForTrain(schedule.train.trainID);
      setAllSeats(data);
    } catch (err) {
      setError("Failed to load seats");
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSeatSelect = (seat) => {
    setSelectedSeat(seat);
    setShowSeatPopup(false);
  };

  const handleReserve = async () => {
    if (!selectedSeat) {
      setError("Please select a seat first");
      return;
    }

    try {
      setIsReserving(true);
      const reservationData = {
        scheduleId: schedule.id,
        seatNumber: selectedSeat.seatNumber,
        passengerName: formData.name,
        passengerSurname: formData.surname,
        reservationDate: schedule.travelDate ? new Date(schedule.travelDate) : new Date(),
        discountCode: formData.discountCode || undefined,
      };

      const reservation = await reservationService.createReservation(reservationData);
      setTimeout(() => {
        setSuccess(true);
        navigate(`/payment/${reservation.id}`);
      }, 2000);
    } catch (error) {
      console.error('Reservation error:', error);
      setError(error.response?.data?.message || "Failed to create reservation");
    } finally {
      setIsReserving(false);
    }
  };

  if (!schedule) {
    return (
      <div className="reservation-page">
        <NavBar />
        <div className="container mt-5">
          <div className="alert alert-warning text-center">
            No schedule selected. Please <button className="btn btn-link p-0" onClick={() => navigate("/search")}>search for a route</button> first.
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="reservation-page">
      <NavBar />
      <header className="reservation-header" style={{ filter: loading }}>
        <div className="header-content">
          <h1>Complete Your Booking</h1>
          <p className="lead">Review journey details and passenger information</p>
        </div>
      </header>
      <main className="reservation-container container" style={{ filter: loading  }}>
        <div className="row g-5">
          {/* Left: Schedule Info */}
          <div className="col-md-6">
            <div className="info-card">
              <h4>Journey Details</h4>
              <div className="info-card-content">
                <p><FaMapMarkerAlt className="me-2" />From: <strong>{schedule.route.departureStation}</strong></p>
                <p><FaMapMarkerAlt className="me-2" />To: <strong>{schedule.route.arrivalStation}</strong></p>
                <p><FaClock className="me-2" />Departure: <strong>{new Date(schedule.departureTime).toLocaleString()}</strong></p>
                <p><FaClock className="me-2" />Arrival: <strong>{new Date(schedule.arrivalTime).toLocaleString()}</strong></p>
                <p><FaTrain className="me-2" />Train: <strong>{schedule.train.trainName} (#{schedule.train.trainNumber})</strong></p>

                {/* Display total and available seats for the train */}
                <p><FaChair className="me-2" />Total Seats: <strong>{schedule.train.totalCapacity}</strong></p>
                <p><FaChair className="me-2" />Available Seats: <strong style={{ color: '#10b981' }}>{schedule.train.availableSeats}</strong></p>

                <p><FaEuroSign className="me-2" />Base Route Price: <strong>€{parseFloat(schedule.route.price).toFixed(2)}</strong></p>
                {selectedSeat && selectedSeat.price !== undefined && selectedSeat.price !== null && !isNaN(selectedSeat.price) && (
                  <p><FaEuroSign className="me-2" />Seat Price: <strong>€{parseFloat(selectedSeat.price).toFixed(2)}</strong></p>
                )}
                {selectedSeat && (
                  <div className="total-price mt-3 pt-3 border-top">
                    <h5><FaEuroSign className="me-2" />Total Price: <strong>€{(parseFloat(schedule.route.price) + (selectedSeat.price !== undefined && selectedSeat.price !== null && !isNaN(selectedSeat.price) ? parseFloat(selectedSeat.price) : 0)).toFixed(2)}</strong></h5>
                  </div>
                )}
                {selectedSeat && (
                    <p><strong>Selected Seat:</strong> {selectedSeat.seatNumber}</p>
                )}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="info-card">
              <h4>Passenger Information</h4>
              <div className="info-card-content">
                {error && <div className="alert alert-danger">{error}</div>}
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
                  <label className="form-label">Select Seat</label>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="text"
                      className="form-control"
                      value={selectedSeat ? `Seat ${selectedSeat.seatNumber}` : ''}
                      placeholder="Click to select a seat"
                      readOnly
                      onClick={() => setShowSeatPopup(true)}
                    />
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setShowSeatPopup(true)}
                    >
                      <FaChair />
                    </button>
                  </div>
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
                  disabled={!formData.name || !formData.surname || !selectedSeat || loading ||isReserving}
                >
                  {loading ? "Processing..." : "Reserve Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <SeatSelectionPopup
        isOpen={showSeatPopup}
        onClose={() => setShowSeatPopup(false)}
        availableSeats={allSeats}
        selectedSeat={selectedSeat ? selectedSeat.seatNumber : null}
        onSeatSelect={handleSeatSelect}
      />
    </div>
  );
}
