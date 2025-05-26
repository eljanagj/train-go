import React, { useState, useEffect } from 'react';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { PageLoader } from '../../components/PageLoader';
import Sidebar from '../../components/Sidebar';
import { paymentService } from '../../services/paymentService';
import { FaCreditCard, FaUser, FaTrain, FaRoute, FaEuroSign, FaEye, FaCalendar } from 'react-icons/fa';
import '../../styles/management.css';

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getAllPaymentsForAdmin();
      console.log('Fetched payments data:', data.map(p => ({
        id: p.id,
        status: p.status,
        amount: p.amount,
        paymentDate: p.paymentDate,
        reservationId: p.reservationId
      })));
      setPayments(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch payments');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#198754';
      case 'pending': return '#fd7e14';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="management-page">
      <Sidebar />
      <div className="management-content">
        <div className="management-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>
              <FaCreditCard className="me-2" />
              Payment Management
            </h1>
            <p className="text-muted">View and manage all payments</p>
          </div>
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
                <th>Payment ID</th>
                <th>Date</th>
                <th>Passenger</th>
                <th>Route</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment Method</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="empty-state">
                      <FaCreditCard size={48} className="text-muted mb-3" />
                      <p className="text-muted">No payments found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <span className="text-monospace">
                        {payment.id.substring(0, 8)}...
                      </span>
                    </td>
                    <td>{formatDate(payment.paymentDate || payment.createdAt)}</td>
                    <td>
                      <div>
                        <strong>
                          {payment.reservation?.passengerName} {payment.reservation?.passengerSurname}
                        </strong>
                        <br />
                        <small className="text-muted">{payment.reservation?.user?.email}</small>
                      </div>
                    </td>
                    <td>
                      <div className="route-info">
                        <FaRoute className="me-1" />
                        {payment.reservation?.schedule?.route?.departureStation} → {payment.reservation?.schedule?.route?.arrivalStation}
                      </div>
                    </td>
                    <td>
                      <span className="price">
                        <FaEuroSign className="me-1" />
                        {Number(payment.amount).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(payment.status),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}
                      >
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {payment.paymentMethod ? (
                        <div>
                          {payment.paymentMethod.toUpperCase()}
                          {payment.paymentCardLast4 && (
                            <div>
                              <small className="text-muted">
                                **** {payment.paymentCardLast4}
                              </small>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleViewDetails(payment)}
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
        {showDetailsModal && selectedPayment && (
          <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5>Payment Details</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowDetailsModal(false)}
                >
                </button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Payment Information</h6>
                    <p><strong>Payment ID:</strong> {selectedPayment.id}</p>
                    <p><strong>Amount:</strong> €{Number(selectedPayment.amount).toFixed(2)}</p>
                    <p><strong>Currency:</strong> {selectedPayment.currency}</p>
                    <p><strong>Status:</strong>
                      <span
                        className="ms-2"
                        style={{
                          backgroundColor: getStatusColor(selectedPayment.status),
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '0.8rem'
                        }}
                      >
                        {selectedPayment.status.toUpperCase()}
                      </span>
                    </p>
                    <p><strong>Created:</strong> {formatDate(selectedPayment.createdAt)}</p>
                    {selectedPayment.paymentDate && (
                      <p><strong>Payment Date:</strong> {formatDate(selectedPayment.paymentDate)}</p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <h6>Payment Method</h6>
                    {selectedPayment.paymentMethod ? (
                      <>
                        <p><strong>Method:</strong> {selectedPayment.paymentMethod.toUpperCase()}</p>
                        {selectedPayment.paymentCardLast4 && (
                          <p><strong>Card:</strong> **** **** **** {selectedPayment.paymentCardLast4}</p>
                        )}
                        {selectedPayment.paymentCardBrand && (
                          <p><strong>Brand:</strong> {selectedPayment.paymentCardBrand.toUpperCase()}</p>
                        )}
                        {selectedPayment.transactionId && (
                          <p><strong>Transaction ID:</strong> {selectedPayment.transactionId}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted">No payment method information available</p>
                    )}
                    {selectedPayment.failureReason && (
                      <div className="mt-3">
                        <h6 className="text-danger">Failure Reason</h6>
                        <p className="text-danger">{selectedPayment.failureReason}</p>
                      </div>
                    )}
                  </div>
                </div>
                {selectedPayment.reservation && (
                  <div className="row mt-3">
                    <div className="col-md-6">
                      <h6>Passenger Information</h6>
                      <p><strong>Name:</strong> {selectedPayment.reservation.passengerName} {selectedPayment.reservation.passengerSurname}</p>
                      <p><strong>Email:</strong> {selectedPayment.reservation.user?.email}</p>
                      <p><strong>Reservation ID:</strong> {selectedPayment.reservation.id}</p>
                    </div>
                    <div className="col-md-6">
                      <h6>Journey Information</h6>
                      <p><strong>Route:</strong> {selectedPayment.reservation.schedule?.route?.departureStation} → {selectedPayment.reservation.schedule?.route?.arrivalStation}</p>
                      <p><strong>Train:</strong> {selectedPayment.reservation.schedule?.train?.trainName}</p>
                      <p><strong>Seat:</strong> {selectedPayment.reservation.seatNumber}</p>
                      <p><strong>Reservation Date:</strong> {formatDate(selectedPayment.reservation.reservationDate)}</p>
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

export default withAuthenticationRequired(PaymentManagement, {
  onRedirecting: () => <PageLoader />,
});
