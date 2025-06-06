import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Alert, Spinner, Pagination, Row, Col } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import { reviewService } from '../../services/reviewService';
import StarRating from '../../components/StarRating';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import '../../styles/management.css';

const ReviewManagement = ({ theme, toggleTheme }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteReviewId, setDeleteReviewId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadReviews();
  }, [currentPage]);

  const loadReviews = async () => {
    try {
      const data = await reviewService.getAllReviewsForAdmin(currentPage, 15);
      setReviews(data.reviews);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      await reviewService.approveReview(reviewId);
      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, isApproved: true } : r
      ));
      setSuccess('Review approved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to approve review');
    }
  };

  const handleReject = async (reviewId) => {
    try {
      await reviewService.rejectReview(reviewId);
      setReviews(reviews.map(r => 
        r.id === reviewId ? { ...r, isApproved: false } : r
      ));
      setSuccess('Review rejected successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to reject review');
    }
  };

  const handleDelete = async () => {
    try {
      await reviewService.deleteReview(deleteReviewId);
      setReviews(reviews.filter(r => r.id !== deleteReviewId));
      setDeleteReviewId(null);
      setSuccess('Review deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete review');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setLoading(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <Sidebar theme={theme} onToggleTheme={toggleTheme} />
        <div className="management-page">
          <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <Spinner animation="border" role="status" />
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Sidebar theme={theme} onToggleTheme={toggleTheme} />
      <div className="management-page">
        <Container fluid className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Review Management</h2>
            <div className="text-muted">
              Total Reviews: {reviews.length}
            </div>
          </div>
          
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

          {reviews.length === 0 ? (
            <Alert variant="info">No reviews found</Alert>
          ) : (
            <>
              <div className="table-responsive">
                <Table striped hover>
                  <thead className="table-dark">
                    <tr>
                      <th>User</th>
                      <th>Rating</th>
                      <th>Title</th>
                      <th>Comment</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map(review => (
                      <tr key={review.id}>
                        <td>
                          <div className="fw-bold">{review.user?.email || 'Anonymous'}</div>
                          <small className="text-muted">{review.user?.email}</small>
                        </td>
                        <td>
                          <StarRating rating={review.rating} readonly size="sm" showValue />
                        </td>
                        <td>
                          <div style={{ maxWidth: '150px' }}>
                            {review.title ? (
                              <strong>{review.title}</strong>
                            ) : (
                              <em className="text-muted">No title</em>
                            )}
                          </div>
                        </td>
                        <td>
                          <div 
                            style={{ 
                              maxWidth: '300px', 
                              maxHeight: '100px',
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              wordWrap: 'break-word'
                            }}
                            title={review.comment}
                          >
                            {review.comment}
                          </div>
                        </td>
                        <td>
                          <Badge bg={review.isApproved ? 'success' : 'warning'}>
                            {review.isApproved ? 'Approved' : 'Pending'}
                          </Badge>
                        </td>
                        <td>
                          <small>{formatDate(review.createdAt)}</small>
                        </td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            {!review.isApproved ? (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleApprove(review.id)}
                                title="Approve review"
                              >
                                Approve
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="warning"
                                onClick={() => handleReject(review.id)}
                                title="Reject review"
                              >
                                Reject
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setDeleteReviewId(review.id)}
                              title="Delete review"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.Prev 
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    />
                    {[...Array(totalPages)].map((_, index) => (
                      <Pagination.Item
                        key={index + 1}
                        active={index + 1 === currentPage}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next 
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}

          <DeleteConfirmationModal
            show={!!deleteReviewId}
            onHide={() => setDeleteReviewId(null)}
            onConfirm={handleDelete}
            title="Delete Review"
            message="Are you sure you want to delete this review? This action cannot be undone."
          />
        </Container>
      </div>
    </div>
  );
};

export default ReviewManagement;
