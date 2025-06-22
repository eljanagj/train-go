import React, { useState, useEffect } from 'react';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { PageLoader } from '../../components/PageLoader';
import Sidebar from '../../components/Sidebar';
import { termsConditionService } from '../../services/termsConditionService';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import '../../styles/management.css';
import { FaFileAlt, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

const TermsConditionManagement = ({ theme, toggleTheme }) => {
  const [terms, setTerms] = useState([]);
  const [newTerm, setNewTerm] = useState({ title: '', content: '' });
  const [editingTerm, setEditingTerm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, termId: null, title: '', isLoading: false });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      const data = await termsConditionService.getAllTerms();
      setTerms(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching Terms:', err);
      setError('Failed to fetch Terms & Conditions. Please try again.');
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!newTerm.title.trim()) errors.title = 'Title is required';
    if (!newTerm.content.trim()) errors.content = 'Content is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createTerm = async () => {
    if (!validateForm()) return;
    try {
      await termsConditionService.createTerm(newTerm);
      fetchTerms();
      setNewTerm({ title: '', content: '' });
      setFormErrors({});
    } catch (err) {
      console.error('Error creating Term:', err);
      setError('Failed to create Term. Please try again.');
    }
  };

  const updateTerm = async (id) => {
    try {
      const { id: _, createdAt, ...updateData } = editingTerm;
      await termsConditionService.updateTerm(id, updateData);
      setEditingTerm(null);
      fetchTerms();
    } catch (err) {
      console.error('Error updating Term:', err);
      setError('Failed to update Term. Please try again.');
    }
  };

  const handleDeleteClick = (term) => {
    setDeleteModal({ isOpen: true, termId: term.id, title: term.title, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    try {
      await termsConditionService.deleteTerm(deleteModal.termId);
      fetchTerms();
      setDeleteModal({ isOpen: false, termId: null, title: '', isLoading: false });
    } catch (err) {
      console.error('Error deleting Term:', err);
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, termId: null, title: '', isLoading: false });
  };

  const startEditing = (term) => setEditingTerm({ ...term });
  const cancelEditing = () => setEditingTerm(null);

  return (
    <div className="page-container">
      <Sidebar theme={theme} onToggleTheme={toggleTheme} />
      <div className="management-page">
        <h1>Terms & Conditions Management</h1>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}

        {/* Add Form */}
        <div className="management-form">
          <div className="management-form-header" >
            <h2><FaFileAlt /> Add New Terms</h2>
          </div>
          <div className="management-form-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Title *</label>
                <input type="text" value={newTerm.title} onChange={(e) => setNewTerm({ ...newTerm, title: e.target.value })} className={formErrors.title ? 'error' : ''} placeholder="Enter title" />
                {formErrors.title && <span className="error-message">{formErrors.title}</span>}
              </div>
              <div className="form-group full-width">
                <label className="form-label">Content *</label>
                <textarea
                  rows="6"
                  value={newTerm.content}
                  onChange={(e) => setNewTerm({ ...newTerm, content: e.target.value })}
                  className={`textarea ${formErrors.content ? 'error' : ''}`}
                  placeholder="Enter content"
                />
                {formErrors.content && <span className="error-message">{formErrors.content}</span>}
              </div>
              <div className="form-actions">
                <button className="add-button" onClick={createTerm}><FaPlus /> Add</button>
                {Object.keys(formErrors).length > 0 && <div className="form-error-summary">Please fill in all required fields</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="management-table-container">
          <h2><FaFileAlt /> Existing Terms</h2>
          <table className="management-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Content</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {terms.length === 0 ? (
                <tr><td colSpan="3" className="no-data">No terms found</td></tr>
              ) : (
                terms.map(term => (
                  <tr key={term.id}>
                    {editingTerm?.id === term.id ? (
                      <>
                        <td>
                          <input type="text" value={editingTerm.title} onChange={(e) => setEditingTerm({ ...editingTerm, title: e.target.value })} className="edit-input" />
                        </td>
                        <td>
                          <textarea
                            rows="4"
                            value={editingTerm.content}
                            onChange={(e) => setEditingTerm({ ...editingTerm, content: e.target.value })}
                            className="edit-input textarea"
                          />
                        </td>
                        <td style={{ verticalAlign: 'middle' }}>
                          <div className="action-buttons" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <button className="save-button" onClick={() => updateTerm(term.id)}><FaEdit /> Save</button>
                            <button className="cancel-button" onClick={cancelEditing}><FaTrash /> Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{term.title}</td>
                        <td style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>{term.content}</td>
                        <td style={{ verticalAlign: 'middle' }}>
                          <div className="action-buttons" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <button className="edit-button" onClick={() => startEditing(term)}><FaEdit /> Edit</button>
                            <button className="delete-button" onClick={() => handleDeleteClick(term)}><FaTrash /> Delete</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Delete modal */}
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          itemName={deleteModal.title}
          isLoading={deleteModal.isLoading}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </div>
    </div>
  );
};

export default withAuthenticationRequired(TermsConditionManagement, {
  onRedirecting: () => <PageLoader />,
}); 