import React, { useState, useEffect } from "react";
import { withAuthenticationRequired } from "@auth0/auth0-react";
import { PageLoader } from "../../components/PageLoader";
import Sidebar from "../../components/Sidebar";
import { reservationService } from "../../services/reservationService";
import {
  FaCalendar,
  FaUser,
  FaTrain,
  FaRoute,
  FaEuroSign,
  FaEye,
} from "react-icons/fa";
import "../../styles/management.css";
import SearchBar from "../../components/SearchBar";

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getAllReservationsForAdmin();
      setReservations(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch reservations");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "#198754";
      case "payment_pending":
        return "#fd7e14";
      case "pending":
        return "#6c757d";
      case "cancelled":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewDetails = (reservation) => {
    setSelectedReservation(reservation);
    setShowDetailsModal(true);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const filteredReservations = reservations.filter(
    (reservation) =>
      reservation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.passengerName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      reservation.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="management-page">
      <Sidebar />
      <div className="management-content">
        <div className="management-header">
          <h1>
            <FaCalendar className="me-2" />
            Reservation Management
          </h1>
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search reservations..."
          />
          <p className="text-muted">View and manage all reservations</p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="management-table-container">
          <table className="management-table">
            <thead>
              <tr>
                <th>Reservation ID</th>
                <th>Date</th>
                <th>Passenger</th>
                <th>Route</th>
                <th>Train</th>
                <th>Seat/s</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    <div className="empty-state">
                      <FaCalendar size={48} className="text-muted mb-3" />
                      <p className="text-muted">No reservations found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td>
                      <span className="text-monospace">
                        {reservation.id.substring(0, 8)}...
                      </span>
                    </td>
                    <td>{formatDate(reservation.travelDate)}</td>
                    <td>
                      <div>
                        <strong>
                          {reservation.passengerName}{" "}
                          {reservation.passengerSurname}
                        </strong>
                        <br />
                        <small className="text-muted">
                          {reservation.user?.email}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="route-info">
                        <FaRoute className="me-1" />
                        {reservation.schedule?.route?.departureStation} →{" "}
                        {reservation.schedule?.route?.arrivalStation}
                      </div>
                    </td>
                    <td>
                      <div className="train-info">
                        <FaTrain className="me-1" />
                        {reservation.schedule?.train?.trainName}
                      </div>
                    </td>
                    <td>
                      {/* Display all seat numbers */}
                      {reservation.seats && reservation.seats.length > 0
                        ? reservation.seats.map((seat, index) => (
                            <span
                              key={seat.id || index}
                              className="seat-number"
                            >
                              {seat.seatNumber}
                              {index < reservation.seats.length - 1 ? ", " : ""}
                            </span>
                          ))
                        : "N/A"}
                    </td>
                    <td>
                      <span className="price">
                        <FaEuroSign className="me-1" />
                        {Number(reservation.price).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(reservation.status),
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "0.875rem",
                        }}
                      >
                        {reservation.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleViewDetails(reservation)}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedReservation && (
          <div
            className="modal-overlay"
            onClick={() => setShowDetailsModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5>Reservation Details</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Passenger Information</h6>
                    <p>
                      <strong>Name:</strong> {selectedReservation.passengerName}{" "}
                      {selectedReservation.passengerSurname}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedReservation.user?.email}
                    </p>
                    <p>
                      <strong>User ID:</strong> {selectedReservation.user?.id}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6>Reservation Details</h6>
                    <p>
                      <strong>ID:</strong> {selectedReservation.id}
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {formatDate(selectedReservation.travelDate)}
                    </p>
                    <p>
                      <strong>Status:</strong>
                      <span
                        className="ms-2"
                        style={{
                          backgroundColor: getStatusColor(
                            selectedReservation.status
                          ),
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          fontSize: "0.8rem",
                        }}
                      >
                        {selectedReservation.status
                          .replace("_", " ")
                          .toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-md-6">
                    <h6>Journey Information</h6>
                    <p>
                      <strong>Route:</strong>{" "}
                      {selectedReservation.schedule?.route?.departureStation} →{" "}
                      {selectedReservation.schedule?.route?.arrivalStation}
                    </p>
                    <p>
                      <strong>Train:</strong>{" "}
                      {selectedReservation.schedule?.train?.trainName}
                    </p>
                    {/* Display all seat numbers */}
                    <p>
                      <strong>Seat/s:</strong>{" "}
                      {selectedReservation.seats &&
                      selectedReservation.seats.length > 0
                        ? selectedReservation.seats
                            .map((seat) => seat.seatNumber)
                            .join(", ")
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Price:</strong> €
                      {Number(selectedReservation.price).toFixed(2)}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6>Payment Information</h6>
                    {selectedReservation.payment ? (
                      <>
                        <p>
                          <strong>Payment Status:</strong>{" "}
                          {selectedReservation.payment.status}
                        </p>
                        <p>
                          <strong>Amount:</strong> €
                          {Number(selectedReservation.payment.amount).toFixed(
                            2
                          )}
                        </p>
                        {selectedReservation.payment.paymentDate && (
                          <p>
                            <strong>Payment Date:</strong>{" "}
                            {formatDate(
                              selectedReservation.payment.paymentDate
                            )}
                          </p>
                        )}
                        {selectedReservation.payment.paymentCardLast4 && (
                          <p>
                            <strong>Card:</strong> **** **** ****{" "}
                            {selectedReservation.payment.paymentCardLast4}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted">
                        No payment information available
                      </p>
                    )}
                  </div>
                </div>
                {selectedReservation.ticket && (
                  <div className="row mt-3">
                    <div className="col-12">
                      <h6>Ticket Information</h6>
                      <p>
                        <strong>Ticket Number:</strong>{" "}
                        {selectedReservation.ticket.ticketNumber}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        {selectedReservation.ticket.status}
                      </p>
                      {selectedReservation.ticket.generatedAt && (
                        <p>
                          <strong>Generated:</strong>{" "}
                          {formatDate(selectedReservation.ticket.generatedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default withAuthenticationRequired(ReservationManagement, {
  onRedirecting: () => <PageLoader />,
});
