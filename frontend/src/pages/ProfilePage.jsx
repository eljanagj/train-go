import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import "../styles/Profile.css";
import { PageLoader } from "../components/PageLoader";
import { FaCalendarAlt, FaTrain, FaMapMarkerAlt, FaClock, FaEuroSign, FaChair, FaDownload, FaEye, FaTimes, FaCreditCard, FaSync, FaStar, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { FaCalendarAlt, FaTrain, FaMapMarkerAlt, FaClock, FaEuroSign, FaChair, FaDownload, FaEye, FaTimes, FaCreditCard, FaSync, FaStar, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { reservationService } from "../services/reservationService";
import { ticketService } from "../services/ticketService";
import { reviewService } from "../services/reviewService";
import ReviewForm from "../components/ReviewForm";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import StarRating from "../components/StarRating";
import { reviewService } from "../services/reviewService";
import ReviewForm from "../components/ReviewForm";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import StarRating from "../components/StarRating";

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


  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [deleteReviewId, setDeleteReviewId] = useState(null);


  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [deleteReviewId, setDeleteReviewId] = useState(null);

  // Update nickname when user becomes available
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || user.name || "");
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchReservations();
      fetchReviews();
      fetchReviews();
    }
  }, [user]);

  useEffect(() => {
    const handleFocus = () => {
      fetchReservations();
      fetchReviews();
      fetchReviews();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchReservations();
        fetchReviews();
        fetchReviews();
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

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError("");
      const data = await reviewService.getMyReviews();
      setReviews(data);
    } catch (err) {
      setReviewsError("Failed to load reviews");
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReviewSubmitted = (newReview) => {
    if (editingReview) {
      setReviews(reviews.map(r => r.id === newReview.id ? newReview : r));
      setEditingReview(null);
    } else {
      setReviews([newReview, ...reviews]);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async () => {
    try {
      await reviewService.deleteReview(deleteReviewId);
      setReviews(reviews.filter(r => r.id !== deleteReviewId));
      setDeleteReviewId(null);
    } catch (err) {
      setReviewsError('Failed to delete review');
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError("");
      const data = await reviewService.getMyReviews();
      setReviews(data);
    } catch (err) {
      setReviewsError("Failed to load reviews");
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleReviewSubmitted = (newReview) => {
    if (editingReview) {
      setReviews(reviews.map(r => r.id === newReview.id ? newReview : r));
      setEditingReview(null);
    } else {
      setReviews([newReview, ...reviews]);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async () => {
    try {
      await reviewService.deleteReview(deleteReviewId);
      setReviews(reviews.filter(r => r.id !== deleteReviewId));
      setDeleteReviewId(null);
    } catch (err) {
      setReviewsError('Failed to delete review');
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

        {/* Reviews Section */}
        <section className="reviews-section mt-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="section-title mb-0">Your Reviews</h3>
            <button
              className="refresh-btn"
              onClick={() => setShowReviewForm(true)}
              title="Write a new review"
              style={{
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '14px',
                color: '#666'
              }}
            >
              <FaPlus /> Write Review
            </button>
          </div>
          {reviewsError && (
            <div className="alert alert-danger mb-3" style={{
              background: '#f8d7da',
              color: '#721c24',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #f5c6cb'
            }}>
              {reviewsError}
            </div>
          )}
          {reviewsLoading ? (
            <div className="text-center">
              <PageLoader />
            </div>
          ) : reviews.length === 0 ? (
            <div className="reservations-table-container">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FaStar />
                </div>
                <h4 className="empty-state-title">No Reviews Yet</h4>
                <p className="empty-state-description">
                  Share your experience with our train service to help other travelers!
                </p>
                <button 
                  className="empty-state-button"
                  onClick={() => setShowReviewForm(true)}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '16px',
                    textDecoration: 'none'
                  }}
                >
                  <FaPlus /> Write Your First Review
                </button>
              </div>
            </div>
          ) : (
            <div className="reservations-table-container">
              <table className="reservations-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Rating</th>
                    <th>Title</th>
                    <th>Comment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(review => (
                    <tr key={review.id} className="reservation-row">
                      <td className="reservation-date">
                        {formatDateShort(review.createdAt)}
                      </td>
                      <td className="rating-cell">
                        <StarRating rating={review.rating} readonly size="sm" />
                      </td>
                      <td className="review-title">
                        {review.title || 'No title'}
                      </td>
                      <td className="review-comment">
                        <div style={{ 
                          maxWidth: '300px', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }}>
                          {review.comment}
                        </div>
                      </td>
                      <td className="status">
                        <span
                          className="status-badge"
                          style={{ 
                            backgroundColor: review.isApproved ? '#28a745' : '#ffc107',
                            color: review.isApproved ? 'white' : '#212529'
                          }}
                        >
                          {review.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="actions">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleEditReview(review)}
                          title="Edit review"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => setDeleteReviewId(review.id)}
                          title="Delete review"
                          style={{
                            backgroundColor: '#dc3545',
                            borderColor: '#dc3545'
                          }}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <ReviewForm
          show={showReviewForm}
          onHide={() => {
            setShowReviewForm(false);
            setEditingReview(null);
          }}
          onReviewSubmitted={handleReviewSubmitted}
          existingReview={editingReview}
        />

        <DeleteConfirmationModal
          isOpen={!!deleteReviewId}
          onClose={() => setDeleteReviewId(null)}
          onConfirm={handleDeleteReview}
          title="Delete Review"
          message="Are you sure you want to delete this review? This action cannot be undone."
        />
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
