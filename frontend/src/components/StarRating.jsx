import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarEmpty } from '@fortawesome/free-regular-svg-icons';

const StarRating = ({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = "1x",
  showValue = false 
}) => {
  const handleStarClick = (starValue) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  return (
    <div className="star-rating d-flex align-items-center">
      <style>
        {`
          .star-clickable:hover {
            transform: scale(1.1);
            transition: transform 0.1s ease;
          }
        `}
      </style>
      {[1, 2, 3, 4, 5].map((star) => (
        <FontAwesomeIcon
          key={star}
          icon={star <= rating ? faStar : faStarEmpty}
          className={`text-warning ${!readonly ? 'star-clickable' : ''}`}
          size={size}
          style={{ 
            cursor: readonly ? 'default' : 'pointer',
            marginRight: '2px'
          }}
          onClick={() => handleStarClick(star)}
        />
      ))}
      {showValue && (
        <span className="ms-2 text-muted">({rating}/5)</span>
      )}
    </div>
  );
};

export default StarRating;
