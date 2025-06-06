import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import StarRating from './StarRating';
import { useAuth0 } from '@auth0/auth0-react';

const ReviewCard = ({ review, onEdit, onDelete, showUserInfo = true, showActions = true }) => {
  const { user, isAuthenticated } = useAuth0();
  const isOwnReview = isAuthenticated && user && review.userId === user.sub;
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center mb-2">
              <StarRating rating={review.rating} readonly size="sm" />
              {!review.isApproved && (
                <Badge bg="warning" className="ms-2">Pending Approval</Badge>
              )}
            </div>
            
            {review.title && (
              <h6 className="card-title mb-2">{review.title}</h6>
            )}
          </div>
          
          {showActions && isOwnReview && (
            <div className="d-flex gap-1">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => onEdit(review)}
                title="Edit review"
              >
                <FontAwesomeIcon icon={faEdit} />
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onDelete(review.id)}
                title="Delete review"
              >
                <FontAwesomeIcon icon={faTrash} />
              </Button>
            </div>
          )}
        </div>

        <Card.Text className="mb-3">
          {review.comment}
        </Card.Text>

        <div className="d-flex justify-content-between align-items-center text-muted small">
          {showUserInfo && (
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faUser} className="me-1" />
              <span>{review.user?.email || 'Anonymous'}</span>
            </div>
          )}
          <span>{formatDate(review.createdAt)}</span>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ReviewCard;
