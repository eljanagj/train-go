import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/Reservation.css";
import "../styles/SeatSelectionPopup.css";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import { FaTrain, FaClock, FaMapMarkerAlt, FaEuroSign, FaChair, FaTimes } from "react-icons/fa";
import TrainAnimation from "../components/TrainAnimation";
import { seatService } from "../services/seatService";
import { reservationService } from "../services/reservationService";
import DiscountCodeInput from "../components/DiscountCodeInput";
import discountService from "../services/discountService";
import SeatSelectionPopup from "../components/SeatSelectionPopup";

export default function ReservationPage() {
  const { user, getAccessTokenSilently } = useAuth0();
  const location = useLocation();
  const navigate = useNavigate();
  const schedule = location.state?.schedule;

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
  });

  // Discount state
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountedPrice, setDiscountedPrice] = useState(null);

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
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isReserving, setIsReserving] = useState(false);

  const [selectedClass, setSelectedClass] = useState('');
  const [uniqueClasses, setUniqueClasses] = useState([]);

  const [showSeatPopup, setShowSeatPopup] = useState(false);

  useEffect(() => {
    if (schedule) {
      fetchAvailableSeats();
    }
  }, [schedule]);

  const fetchAvailableSeats = async () => {
    try {
      setLoading(true);
      // First get all seats configuration
      const data = await seatService.getSeatDetails(
        schedule.train.trainID,
        schedule.travelDate,
        schedule.departureTime
      );
      
      console.log('All seats data:', data);

      // Update seat status based on the data returned
      const updatedSeats = {};
      Object.entries(data).forEach(([seatNumber, seatData]) => {
        updatedSeats[seatNumber] = {
          ...seatData,
          seatNumber,
          status: seatData.status || 'available',
          isAvailable: seatData.status !== 'reserved'
        };
      });
      
      setAllSeats(updatedSeats);
      
      const classes = [...new Set(Object.values(updatedSeats).map(seat => seat.class))];
      setUniqueClasses(classes);
      if (classes.length > 0) {
        setSelectedClass(classes[0]);
      }
    } catch (err) {
      setError("Failed to load seats");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    // Only allow selection of available seats
    if (!seat.isAvailable) {
      return;
    }

    const isSelected = selectedSeats.some(selectedSeat => selectedSeat.seatNumber === seat.seatNumber);

    if (isSelected) {
      // Deselect seat
      setSelectedSeats(selectedSeats.filter(selectedSeat => selectedSeat.seatNumber !== seat.seatNumber));
    } else {
      // Select seat (always use the seat object from allSeats)
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReserve = async () => {
    if (!selectedSeats.length) {
      setError('Please select at least one seat');
      return;
    }

    try {
      setIsReserving(true);
      
      // Double check seat availability before making reservation
      const availableSeats = await seatService.getAvailableSeats(
        schedule.train.trainID,
        schedule.travelDate,
        schedule.departureTime
      );

      console.log('Final availability check - Available seats:', availableSeats);
      console.log('Selected seats:', selectedSeats.map(s => s.seatNumber));

      // Verify all selected seats are still available
      const unavailableSeats = selectedSeats.filter(seat => !availableSeats.includes(seat.seatNumber));
      if (unavailableSeats.length > 0) {
        setError(`Seats ${unavailableSeats.map(s => s.seatNumber).join(', ')} are no longer available. Please select different seats.`);
        setIsReserving(false);
        return;
      }

      // Prepare reservation data with only necessary fields
      const reservationData = {
        scheduleId: schedule.id,
        seatNumbers: selectedSeats.map(seat => seat.seatNumber),
        passengerName: formData.name,
        passengerSurname: formData.surname,
        travelDate: schedule.travelDate,
        discountCode: formData.discountCode || undefined,
      };

      console.log('Sending reservation data:', reservationData);

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

  // Calculate current total price
  const calculateTotalPrice = () => {
    const basePrice = parseFloat(schedule.route.price) + 
      selectedSeats.reduce((sum, seat) => sum + (parseFloat(seat.price) || 0), 0);
    return appliedDiscount ? appliedDiscount.discountedPrice : basePrice;
  };

  const handleDiscountApplied = (discountInfo) => {
    setAppliedDiscount(discountInfo);
    if (discountInfo) {
      setDiscountedPrice(discountInfo.discountedPrice);
    } else {
      setDiscountedPrice(null);
    }
  };

  // Combine travelDate with schedule times
  const travelDate = new Date(schedule.travelDate);
  const [depHours, depMinutes] = schedule.departureTime.split(':').map(Number);
  const [arrHours, arrMinutes] = schedule.arrivalTime.split(':').map(Number);

  const departureDateTime = new Date(travelDate);
  departureDateTime.setHours(depHours, depMinutes, 0);

  const arrivalDateTime = new Date(travelDate);
  arrivalDateTime.setHours(arrHours, arrMinutes, 0);

  // Update the seat rendering part
  const renderSeat = (seat) => {
    const isSelected = selectedSeats.some(s => s.seatNumber === seat.seatNumber);
    const isReserved = seat.status === 'reserved';
    const isAvailable = !isReserved && seat.isAvailable;

    return (
      <div
        key={seat.seatNumber}
        className={`seat ${isSelected ? 'selected' : ''} ${isReserved ? 'reserved' : ''} ${isAvailable ? 'available' : ''}`}
        onClick={() => {
          if (isAvailable) {
            handleSeatClick(seat);
          }
        }}
      >
        {seat.seatNumber}
      </div>
    );
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
                <p><FaClock className="me-2" />Travel Date: <strong>{new Date(schedule.travelDate).toLocaleDateString()}</strong></p>
                <p><FaClock className="me-2" />Departure Time: <strong>{departureDateTime.toLocaleTimeString()}</strong></p>
                <p><FaClock className="me-2" />Arrival Time: <strong>{arrivalDateTime.toLocaleTimeString()}</strong></p>
                <p><FaTrain className="me-2" />Train: <strong>{schedule.train.trainName} (#{schedule.train.trainNumber})</strong></p>

                {/* Display total and available seats for the train */}
                <p><FaChair className="me-2" />Total Seats: <strong>{schedule.train.totalCapacity}</strong></p>
                <p><FaChair className="me-2" />Available Seats: <strong style={{ color: '#10b981' }}>{schedule.train.availableSeats}</strong></p>

                <p><FaEuroSign className="me-2" />Base Route Price: <strong>€{parseFloat(schedule.route.price).toFixed(2)}</strong></p>
                {selectedSeats.length > 0 && (
                  <>
                    <p><FaChair className="me-2" />Selected Seats: <strong>
                      {selectedSeats.map(seat => `${seat.seatNumber} (€${parseFloat(seat.price).toFixed(2)})`).join(', ')}
                    </strong></p>
                    <div className="total-price mt-3 pt-3 border-top">
                      {appliedDiscount ? (
                        <>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Original Price:</span>
                            <span className="text-decoration-line-through">
                              €{(parseFloat(schedule.route.price) + selectedSeats.reduce((sum, seat) => sum + (parseFloat(seat.price) || 0), 0)).toFixed(2)}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Discount ({appliedDiscount.discountPercentage}%):</span>
                            <span className="text-success">-€{appliedDiscount.discountAmount.toFixed(2)}</span>
                          </div>
                          <h5 className="d-flex justify-content-between">
                            <span><FaEuroSign className="me-2" />Final Price:</span>
                            <strong className="text-success">€{appliedDiscount.discountedPrice.toFixed(2)}</strong>
                          </h5>
                        </>
                      ) : (
                        <h5><FaEuroSign className="me-2" />Total Price: <strong>€{(parseFloat(schedule.route.price) + selectedSeats.reduce((sum, seat) => sum + (parseFloat(seat.price) || 0), 0)).toFixed(2)}</strong></h5>
                      )}
                    </div>
                  </>
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
                  <label className="form-label">Select Class</label>
                  <select
                    className="form-select"
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedSeats([]); // Clear selected seats when class changes
                    }}
                    disabled={uniqueClasses.length <= 1} // Disable if only one class
                  >
                    {uniqueClasses.map(classType => (
                      <option key={classType} value={classType}>{classType.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                {/* Price Information */}
                <div className="price-info mb-3 p-3 bg-light rounded">
                  <h6 className="mb-2">Price Information</h6>
                  <div className="small text-muted mb-2">
                    <p className="mb-1">• Base fare: €{parseFloat(schedule.route.price).toFixed(2)}</p>
                    <p className="mb-1">• Additional fees may apply based on:</p>
                    <ul className="mb-0 ps-3">
                      <li>Seat type (Window, Aisle, etc.)</li>
                      <li>Class selection</li>
                      <li>Peak travel times</li>
                    </ul>
                    <p className="mt-2 mb-0 fw-bold">Final price will be shown after seat selection</p>
                  </div>
                </div>

                <div className="mb-3">
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={() => {
                      console.log('Button clicked, current showSeatPopup:', showSeatPopup);
                      setShowSeatPopup(true);
                      console.log('After setShowSeatPopup(true), showSeatPopup:', showSeatPopup);
                    }}
                    disabled={allSeats.length === 0 || !selectedClass}
                  >
                    <FaChair className="me-2"/> Select Seat(s) for {selectedClass.toUpperCase()}
                  </button>
                </div>

                {/* Discount Code Section */}
                {selectedSeats.length > 0 && (
                  <div className="mb-4">
                    <DiscountCodeInput 
                      originalPrice={parseFloat(schedule.route.price) + selectedSeats.reduce((sum, seat) => sum + (parseFloat(seat.price) || 0), 0)}
                      onDiscountApplied={handleDiscountApplied}
                      userId={user?.sub}
                      disabled={loading || isReserving}
                    />
                  </div>
                )}

                <button
                  className="btn btn-reserve text-white w-100"
                  onClick={handleReserve}
                  disabled={!formData.name || !formData.surname || selectedSeats.length === 0 || loading || isReserving}
                >
                  {loading ? "Processing..." : "Reserve Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Seat Selection Popup */}
      {showSeatPopup && (
        <SeatSelectionPopup
          isOpen={showSeatPopup}
          onClose={() => setShowSeatPopup(false)}
          trainId={schedule.train.trainID}
          date={schedule.travelDate}
          time={schedule.departureTime}
          selectedSeats={selectedSeats.map(seat => seat.seatNumber)}
          onSeatSelect={(seat) => {
            // Always use the seat object from allSeats
            const seatObj = allSeats[seat.seatNumber] ? { seatNumber: seat.seatNumber, ...allSeats[seat.seatNumber] } : seat;
            const isSelected = selectedSeats.some(s => s.seatNumber === seat.seatNumber);
            if (isSelected) {
              setSelectedSeats(selectedSeats.filter(s => s.seatNumber !== seat.seatNumber));
            } else {
              setSelectedSeats([...selectedSeats, seatObj]);
            }
          }}
          userId={user?.sub}
          selectedClass={selectedClass}
        />
      )}
    </div>
  );
}