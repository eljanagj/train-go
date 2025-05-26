import React from 'react';
import { FaTrash, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import '../styles/DeleteConfirmationModal.css';

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Delete", 
  message = "Are you sure you want to delete this item?", 
  itemName = "",
  isLoading = false 
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="delete-modal-overlay" onClick={handleOverlayClick}>
      <div className="delete-modal">
        <div className="delete-modal-header">
          <div className="delete-modal-icon">
            <FaExclamationTriangle />
          </div>
          <h3>{title}</h3>
          <button className="delete-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="delete-modal-body">
          <p>{message}</p>
          {itemName && (
            <div className="delete-item-name">
              <strong>"{itemName}"</strong>
            </div>
          )}
          <p className="delete-warning">
            This action cannot be undone.
          </p>
        </div>
        
        <div className="delete-modal-footer">
          <button 
            className="delete-cancel-btn" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            className="delete-confirm-btn" 
            onClick={onConfirm}
            disabled={isLoading}
          >
            <FaTrash />
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
