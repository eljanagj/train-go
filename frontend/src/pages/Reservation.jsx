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
      const data = await seatService.getAllSeatsForTrain(schedule.train.trainID);
      setAllSeats(data);
      
      const classes = [...new Set(data.map(seat => seat.class))];
      setUniqueClasses(classes);
      if (classes.length > 0) {
        setSelectedClass(classes[0]);
      }

    } catch (err) {
      setError("Failed to load seats");
      console.error(err);
    }
  };

  const handleSeatClick = (seat) => {
    // Only allow selection of available seats
    if (seat.status !== 'available') {
      return;
    }

    const isSelected = selectedSeats.some(selectedSeat => selectedSeat.id === seat.id);

    if (isSelected) {
      // Deselect seat
      setSelectedSeats(selectedSeats.filter(selectedSeat => selectedSeat.id !== seat.id));
    } else {
      // Select seat
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReserve = async () => {
    if (selectedSeats.length === 0) {
      setError("Please select at least one seat first");
      return;
    }

    try {
      setIsReserving(true);
      
      // Use the complete seat numbers
      const seatNumbers = selectedSeats.map(seat => seat.seatNumber);

      console.log('Selected seats:', selectedSeats);
      console.log('Seat numbers:', seatNumbers);

      const reservationData = {
        scheduleId: schedule.id,
        seatNumbers: seatNumbers,
        passengerName: formData.name,
        passengerSurname: formData.surname,
        reservationDate: schedule.travelDate ? new Date(schedule.travelDate) : new Date(),
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
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Show more specific error messages
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Failed to create reservation. Please try again.");
      }
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
                {selectedSeats.length > 0 && (
                  <>
                    <p><FaChair className="me-2" />Selected Seats: <strong>
                      {selectedSeats.map(seat => `${seat.seatNumber} (€${parseFloat(seat.price).toFixed(2)})`).join(', ')}
                    </strong></p>
                    <div className="total-price mt-3 pt-3 border-top">
                      <h5><FaEuroSign className="me-2" />Total Price: <strong>€{(parseFloat(schedule.route.price) + selectedSeats.reduce((sum, seat) => sum + (seat.price !== undefined && seat.price !== null && !isNaN(seat.price) ? parseFloat(seat.price) : 0), 0)).toFixed(2)}</strong></h5>
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

      {/* Seat Selection Modal */}
      {showSeatPopup && (
        <div className="seat-selection-overlay">
          <div className="seat-selection-popup">
            <button
              className="close-button"
              onClick={() => setShowSeatPopup(false)}
            >
              <FaTimes />
            </button>
            <h3>Select Seat(s) for {selectedClass.toUpperCase()} Class</h3>
            <div className="seat-selection-layout mt-3"> {/* Use the layout class inside modal */}
              {/* Filter seats by selected class and render the layout */}
              {allSeats && allSeats.length > 0 && allSeats.filter(seat => seat.class === selectedClass).length > 0 ? (
                (
                  Object.values(allSeats.filter(seat => seat.class === selectedClass).reduce((acc, seat) => {
                    if (!acc[seat.row]) {
                      acc[seat.row] = [];
                    }
                    acc[seat.row].push(seat);
                    return acc;
                  }, {})).sort((a, b) => Number(Object.values(a)[0].row) - Number(Object.values(b)[0].row)).map(rowSeats => {
                    const rowNum = Object.values(rowSeats)[0].row;

                    // Determine seats per side based on class (assuming 3+3 for economy, 2+2 for others)
                    const seatsPerSide = selectedClass === 'economy' ? 3 : 2;

                    // Sort seats based on their position and type
                    const sortedRowSeats = Object.values(rowSeats).sort((a, b) => {
                      // For economy class, ensure D is aisle and F is window
                      if (selectedClass === 'economy') {
                        const positionOrder = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5 };
                        return positionOrder[a.position] - positionOrder[b.position];
                      }
                      // For other classes, maintain original sorting
                      return a.position.localeCompare(b.position);
                    });

                    return (
                      <div key={rowNum} className="seat-row"> {/* Container for a single row */}
                        <div className="row-number">{rowNum}</div> {/* Row number */}
                        <div className="row-seats"> {/* Container for seats in the row */}
                          {/* Left side seats */}
                          <div className="seat-group left">
                            {sortedRowSeats.slice(0, seatsPerSide).map(seat => (
                              <span
                                key={seat.id}
                                className={`seat-name ${selectedSeats.some(s => s.id === seat.id) ? 'selected' : ''} ${seat.status === 'available' ? 'available' : 'blocked'}`}
                                onClick={() => handleSeatClick(seat)}
                                title={`${seat.seatNumber} (${seat.type}) - €${seat.price}`}
                              >
                                {seat.seatNumber}
                              </span>
                            ))}
                          </div>

                          {/* Aisle */}
                          <div className="row-aisle"></div>

                          {/* Right side seats */}
                          <div className="seat-group right">
                            {sortedRowSeats.slice(seatsPerSide).map(seat => (
                              <span
                                key={seat.id}
                                className={`seat-name ${selectedSeats.some(s => s.id === seat.id) ? 'selected' : ''} ${seat.status === 'available' ? 'available' : 'blocked'}`}
                                onClick={() => handleSeatClick(seat)}
                                title={`${seat.seatNumber} (${seat.type}) - €${seat.price}`}
                              >
                                {seat.seatNumber}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                <div className="no-seats-message">No seats available for this class.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}