import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import StarRating from './StarRating';
import { reviewService } from '../services/reviewService';

const ReviewForm = ({ show, onHide, onReviewSubmitted, existingReview = null }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please write a review comment');
      return;
    }

    setLoading(true);
    try {
      const reviewData = {
        rating,
        title: title.trim() || null,
        comment: comment.trim()
      };

      let result;
      if (existingReview) {
        result = await reviewService.updateReview(existingReview.id, reviewData);
      } else {
        result = await reviewService.createReview(reviewData);
      }

      onReviewSubmitted(result);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(existingReview?.rating || 0);
    setTitle(existingReview?.title || '');
    setComment(existingReview?.comment || '');
    setError('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {existingReview ? 'Edit Review' : 'Write a Review'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Rating *</Form.Label>
            <div>
              <StarRating 
                rating={rating} 
                onRatingChange={setRating}
                size="lg"
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Title (Optional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Summary of your experience"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Review *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Share your experience with our train service..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              required
            />
            <Form.Text className="text-muted">
              {comment.length}/1000 characters
            </Form.Text>
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading || rating === 0 || !comment.trim()}
            >
              {loading ? 'Submitting...' : (existingReview ? 'Update Review' : 'Submit Review')}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ReviewForm;
