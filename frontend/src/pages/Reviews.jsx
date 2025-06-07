import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner, Pagination, Button } from 'react-bootstrap';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';
import ReviewCard from '../components/ReviewCard';
import StarRating from '../components/StarRating';
import { reviewService } from '../services/reviewService';

const Reviews = ({ theme, toggleTheme }) => {
  const { isAuthenticated } = useAuth0();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [currentPage]);

  const loadReviews = async () => {
    try {
      const data = await reviewService.getAllReviews(currentPage, 10);
      setReviews(data.reviews);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError('Failed to load reviews');
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await reviewService.getReviewStats();
      setStats(statsData);
    } catch (err) {
      console.warn('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="search-page">
        <NavBar />
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px', paddingTop: '80px' }}>
          <Spinner animation="border" role="status" />
        </Container>
        <Footer />
      </div>
    );
  }

  return (
    <div className="search-page">
      <NavBar />
      <Container className="mt-4" style={{ paddingTop: '0px', minHeight: 'calc(100vh - 200px)' }}>
        <Row>
          <Col lg={8}>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>Customer Reviews</h2>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {reviews.length === 0 ? (
              <Alert variant="info">
                <h5>No reviews yet!</h5>
                <p>Be the first to share your experience with our train service.</p>
                {!isAuthenticated && (
                  <Button as={Link} to="/profile" variant="primary">
                    Login to Write a Review
                  </Button>
                )}
              </Alert>
            ) : (
              <>
                {reviews.map(review => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    showActions={false} // Public page - no edit/delete actions
                    showUserInfo={true}
                  />
                ))}

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
          </Col>

          <Col lg={4}>
            {stats && (
              <div className="sticky-top" style={{ top: '80px', zIndex: 1 }}>
                <div className="bg-light p-4 rounded mb-4">
                  <h5>Overall Rating</h5>
                  <div className="d-flex align-items-center mb-3">
                    <StarRating rating={Math.round(stats.averageRating)} readonly size="lg" />
                    <span className="ms-2 h4 mb-0">{stats.averageRating}/5</span>
                  </div>
                  <p className="text-muted mb-3">Based on {stats.totalReviews} reviews</p>
                  
                  <hr />
                  
                  <h6>Rating Distribution</h6>
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="d-flex align-items-center mb-2">
                      <span className="me-2">{star}</span>
                      <StarRating rating={1} readonly size="sm" />
                      <div className="flex-grow-1 mx-2" style={{ height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                        <div 
                          className="bg-warning rounded" 
                          style={{ 
                            height: '100%', 
                            width: `${stats.totalReviews > 0 ? (stats.ratingDistribution[star] / stats.totalReviews) * 100 : 0}%`,
                            minWidth: stats.ratingDistribution[star] > 0 ? '2px' : '0px'
                          }}
                        />
                      </div>
                      <span className="text-muted small">{stats.ratingDistribution[star]}</span>
                    </div>
                  ))}

                  {isAuthenticated && (
                    <div className="mt-3">
                      <Button as={Link} to="/profile" variant="primary" size="sm" className="w-100">
                        Write a Review
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  );
};

export default Reviews;
