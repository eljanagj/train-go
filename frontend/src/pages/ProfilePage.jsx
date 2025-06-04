import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import "../styles/Profile.css";
import { PageLoader } from "../components/PageLoader";
import { FaCalendarAlt, FaTrain, FaMapMarkerAlt, FaClock, FaEuroSign, FaChair, FaDownload, FaEye, FaTimes, FaCreditCard, FaSync } from "react-icons/fa";
import { reservationService } from "../services/reservationService";
import { ticketService } from "../services/ticketService";

const ProfileComponent = ({ theme, toggleTheme }) => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  
  const [nickname, setNickname] = useState("");
  const [editing, setEditing] = useState(false);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(null);

  // Update nickname when user becomes available
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || user.name || "");
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  useEffect(() => {
    const handleFocus = () => {
      fetchReservations();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchReservations();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await reservationService.getUserReservations();
      setReservations(data);
    } catch (err) {
      setError("Failed to load reservations");
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => setEditing(true);
  const handleSave = () => setEditing(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'payment_pending': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  const handleViewDetails = (reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReservation(null);
  };

  const handleContinuePayment = (reservationId) => {
    navigate(`/payment/${reservationId}`);
  };

  const handleDownloadTicket = async (reservationId) => {
    try {
      setDownloadingPdf(reservationId);

      const reservation = reservations.find(r => r.id === reservationId);
      if (!reservation) {
        throw new Error('Reservation not found');
      }
      // Use the new ticket service to download the ticket
      const pdfBlob = await ticketService.downloadTicketByReservation(reservationId);

      const url = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `train-ticket-${reservationId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading ticket:', {
        error: error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      let errorMessage = 'Failed to download ticket. ';
      if (error.response?.status === 400) {
        errorMessage += 'Passenger information is missing.';
      } else if (error.response?.status === 403) {
        errorMessage += 'Payment must be completed before downloading ticket.';
      } else if (error.response?.status === 404) {
        errorMessage += 'Reservation not found.';
      } else if (error.response?.status === 500) {
        errorMessage += 'Server error occurred.';
      } else {
        errorMessage += 'Please try again or contact support.';
      }

      setError(errorMessage);

      setTimeout(() => setError(''), 5000);
    } finally {
      setDownloadingPdf(null);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page-light">
        <NavBar theme={theme} onToggleTheme={toggleTheme} />
        <div className="profile-container">
          <PageLoader />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="profile-page-light">
        <NavBar theme={theme} onToggleTheme={toggleTheme} />
        <div className="profile-container">
          <div className="alert alert-info">
            Loading user information...
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  
  return (
    <div className="profile-page-light">
      <NavBar theme={theme} onToggleTheme={toggleTheme} />
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-container">
            <img
              src={user.picture}
              alt={user.name}
              className="profile-avatar"
            />
          </div>
          <div className="profile-info">
            <h1 className="profile-name">
              {nickname} 
            </h1>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>

        {/* Reservations Section */}
        <section className="reservations-section mt-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="section-title mb-0">Your Reservations</h3>
            <button
              className="refresh-btn"
              onClick={fetchReservations}
              disabled={loading}
              title="Refresh reservations"
              style={{
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '14px',
                color: '#666'
              }}
            >
              <FaSync style={{ transform: loading ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s' }} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {error && (
            <div className="alert alert-danger mb-3" style={{
              background: '#f8d7da',
              color: '#721c24',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-center">
              <PageLoader />
            </div>
          ) : reservations.length === 0 ? (
            <div className="reservations-table-container">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FaTrain />
                </div>
                <h4 className="empty-state-title">No Reservations Yet</h4>
                <p className="empty-state-description">
                  You haven't made any train reservations yet. Start planning your journey today!
                </p>
                <a href="/search" className="empty-state-button">
                  <FaMapMarkerAlt /> Search Routes
                </a>
              </div>
            </div>
          ) : (
            <div className="reservations-table-container">
              <table className="reservations-table">
                <thead>
                  <tr>
                    <th>Reservation ID</th>
                    <th>Reserved On</th>
                    <th>Route</th>
                    <th>Train</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id} className="reservation-row">
                      <td className="reservation-id">
                        {reservation.id}
                      </td>
                      <td className="reservation-date">
                        {formatDateShort(reservation.reservationDate)}
                      </td>
                      <td className="route-info">
                        <span className="route-text">
                          {reservation.schedule.route.departureStation} → {reservation.schedule.route.arrivalStation}
                        </span>
                      </td>
                      <td className="train-name">
                        {reservation.schedule.train.trainName}
                      </td>
                      <td className="price">
                        €{parseFloat(reservation.price).toFixed(2)}
                      </td>
                      <td className="status">
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(reservation.status) }}
                        >
                          {reservation.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleViewDetails(reservation)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {reservation.status === 'payment_pending' ? (
                          <button
                            className="action-btn payment-btn"
                            onClick={() => handleContinuePayment(reservation.id)}
                            title="Continue Payment"
                          >
                            <FaCreditCard />
                          </button>
                        ) : reservation.status === 'confirmed' ? (
                          <button
                            className="action-btn download-btn"
                            onClick={() => handleDownloadTicket(reservation.id)}
                            disabled={downloadingPdf === reservation.id}
                            title="Download Ticket"
                          >
                            {downloadingPdf === reservation.id ? '...' : <FaDownload />}
                          </button>
                        ) : (
                          <span
                            style={{ fontSize: '12px', color: '#666' }}
                            title={`Status: ${reservation.status}, Payment: ${reservation.payment?.status || 'N/A'}`}
                          >
                            {console.log('Reservation debug:', {
                              id: reservation.id,
                              status: reservation.status,
                              paymentStatus: reservation.payment?.status,
                              payment: reservation.payment
                            })}
                            Debug
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      <Footer />

      {/* Reservation Details Modal */}
      {showModal && selectedReservation && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reservation Details</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-details-grid">
                <div className="detail-group">
                  <label>Reservation ID:</label>
                  <span className="detail-value">{selectedReservation.id}</span>
                </div>
                <div className="detail-group">
                  <label>Route:</label>
                  <span className="detail-value">
                    <FaMapMarkerAlt className="detail-icon" />
                    {selectedReservation.schedule.route.departureStation} → {selectedReservation.schedule.route.arrivalStation}
                  </span>
                </div>
                <div className="detail-group">
                  <label>Departure Time:</label>
                  <span className="detail-value">
                    <FaClock className="detail-icon" />
                    {formatDate(selectedReservation.schedule.departureTime)}
                  </span>
                </div>
                <div className="detail-group">
                  <label>Arrival Time:</label>
                  <span className="detail-value">
                    <FaClock className="detail-icon" />
                    {formatDate(selectedReservation.schedule.arrivalTime)}
                  </span>
                </div>
                <div className="detail-group">
                  <label>Train:</label>
                  <span className="detail-value">
                    <FaTrain className="detail-icon" />
                    {selectedReservation.schedule.train.trainName}
                  </span>
                </div>
                <div className="detail-group">
                  <label>Passenger Name:</label>
                  <span className="detail-value">
                    {selectedReservation.passengerName && selectedReservation.passengerSurname
                      ? `${selectedReservation.passengerName} ${selectedReservation.passengerSurname}`
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="detail-group">
                  <label>Seat Number:</label>
                  <span className="detail-value">
                    <FaChair className="detail-icon" />
                    {selectedReservation.seats.map(seat => seat.seatNumber).join(', ')}
                  </span>
                </div>
                <div className="detail-group">
                  <label>Price:</label>
                  <span className="detail-value">
                    <FaEuroSign className="detail-icon" />
                    €{parseFloat(selectedReservation.price).toFixed(2)}
                  </span>
                </div>
                <div className="detail-group">
                  <label>Payment Method:</label>
                  <span className="detail-value">
                    {selectedReservation.payment?.paymentMethod || 'N/A'}
                    {selectedReservation.payment?.paymentCardLast4 && ` (****${selectedReservation.payment.paymentCardLast4})`}
                  </span>
                </div>
                <div className="detail-group">
                  <label>Status:</label>
                  <span
                    className="detail-value status-badge"
                    style={{ backgroundColor: getStatusColor(selectedReservation.status) }}
                  >
                    {selectedReservation.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="detail-group">
                  <label>Reservation Date:</label>
                  <span className="detail-value">
                    <FaCalendarAlt className="detail-icon" />
                    {formatDate(selectedReservation.reservationDate)}
                  </span>
                </div>
              </div>
              <div className="modal-actions">
                {selectedReservation.status === 'payment_pending' ? (
                  <button
                    className="modal-payment-btn"
                    onClick={() => {
                      handleCloseModal();
                      handleContinuePayment(selectedReservation.id);
                    }}
                  >
                    <FaCreditCard className="btn-icon" />
                    Continue Payment
                  </button>
                ) : selectedReservation.status === 'confirmed' && selectedReservation.payment?.status === 'completed' ? (
                  <button
                    className="modal-download-btn"
                    onClick={() => handleDownloadTicket(selectedReservation.id)}
                    disabled={downloadingPdf === selectedReservation.id}
                  >
                    <FaDownload className="btn-icon" />
                    {downloadingPdf === selectedReservation.id ? 'Downloading...' : 'Download Ticket PDF'}
                  </button>
                ) : (
                  <div className="modal-info">
                    <p>Ticket download will be available after payment confirmation.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileComponent;
