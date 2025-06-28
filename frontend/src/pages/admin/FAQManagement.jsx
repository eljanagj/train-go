import React, { useState, useEffect } from "react";
import { withAuthenticationRequired } from "@auth0/auth0-react";
import { PageLoader } from "../../components/PageLoader";
import Sidebar from "../../components/Sidebar";
import { faqService } from "../../services/faqService";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import "../../styles/management.css";
import { FaQuestionCircle, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import SearchBar from "../../components/SearchBar";

const FAQManagement = ({ theme, toggleTheme }) => {
  const [faqs, setFaqs] = useState([]);
  const [newFaq, setNewFaq] = useState({
    question: "",
    answer: "",
    isActive: true,
  });
  const [editingFaq, setEditingFaq] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    faqId: null,
    question: "",
    isLoading: false,
  });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const data = await faqService.getAllFaqsForAdmin();
      setFaqs(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      setError("Failed to fetch FAQs. Please try again.");
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!newFaq.question.trim()) errors.question = "Question is required";
    if (!newFaq.answer.trim()) errors.answer = "Answer is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createFaq = async () => {
    if (!validateForm()) return;
    try {
      await faqService.createFaq(newFaq);
      fetchFaqs();
      setNewFaq({ question: "", answer: "", isActive: true });
      setFormErrors({});
      setError(null);
    } catch (error) {
      console.error("Error creating FAQ:", error);
      setError("Failed to create FAQ. Please try again.");
    }
  };

  const updateFaq = async (faqId) => {
    if (!faqId) return;
    try {
      const { id, createdAt, updatedAt, ...updateData } = editingFaq;
      await faqService.updateFaq(faqId, updateData);
      setEditingFaq(null);
      fetchFaqs();
    } catch (error) {
      console.error("Error updating FAQ:", error);
      alert("Failed to update FAQ. Please try again.");
    }
  };

  const handleDeleteClick = (faq) => {
    setDeleteModal({
      isOpen: true,
      faqId: faq.id,
      question: faq.question,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await faqService.deleteFaq(deleteModal.faqId);
      fetchFaqs();
      setDeleteModal({
        isOpen: false,
        faqId: null,
        question: "",
        isLoading: false,
      });
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      faqId: null,
      question: "",
      isLoading: false,
    });
  };

  const startEditing = (faq) => {
    setEditingFaq({ ...faq });
  };

  const cancelEditing = () => {
    setEditingFaq(null);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <Sidebar theme={theme} onToggleTheme={toggleTheme} />
      <div className="management-page">
        <h1>FAQ Management</h1>
        <SearchBar onSearch={handleSearch} placeholder="Search FAQs..." />
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        {/* Add FAQ Form */}
        <div className="management-form">
          <div className="management-form-header">
            <h2>
              <FaQuestionCircle /> Add New FAQ
            </h2>
          </div>
          <div className="management-form-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Question *</label>
                <input
                  type="text"
                  placeholder="Enter question"
                  value={newFaq.question}
                  onChange={(e) =>
                    setNewFaq({ ...newFaq, question: e.target.value })
                  }
                  className={formErrors.question ? "error" : ""}
                />
                {formErrors.question && (
                  <span className="error-message">{formErrors.question}</span>
                )}
              </div>
              <div className="form-group full-width">
                <label className="form-label">Answer *</label>
                <textarea
                  placeholder="Enter answer"
                  value={newFaq.answer}
                  onChange={(e) =>
                    setNewFaq({ ...newFaq, answer: e.target.value })
                  }
                  className={formErrors.answer ? "error" : ""}
                  rows="4"
                />
                {formErrors.answer && (
                  <span className="error-message">{formErrors.answer}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={newFaq.isActive}
                  onChange={(e) =>
                    setNewFaq({
                      ...newFaq,
                      isActive: e.target.value === "true",
                    })
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div className="form-actions">
                <button className="add-button" onClick={createFaq}>
                  <FaPlus /> Add FAQ
                </button>
                {Object.keys(formErrors).length > 0 && (
                  <div className="form-error-summary">
                    Please fill in all required fields
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* FAQs Table */}
        <div className="management-table-container">
          <h2>
            <FaQuestionCircle /> Existing FAQs
          </h2>
          <table className="management-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Answer</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaqs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="no-data">
                    No FAQs found
                  </td>
                </tr>
              ) : (
                filteredFaqs.map((faq) => (
                  <tr key={faq.id}>
                    {editingFaq?.id === faq.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editingFaq.question}
                            onChange={(e) =>
                              setEditingFaq({
                                ...editingFaq,
                                question: e.target.value,
                              })
                            }
                            className="edit-input"
                          />
                        </td>
                        <td>
                          <textarea
                            value={editingFaq.answer}
                            onChange={(e) =>
                              setEditingFaq({
                                ...editingFaq,
                                answer: e.target.value,
                              })
                            }
                            className="edit-input"
                            rows="3"
                          />
                        </td>
                        <td style={{ verticalAlign: "middle" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <select
                              value={editingFaq.isActive}
                              onChange={(e) =>
                                setEditingFaq({
                                  ...editingFaq,
                                  isActive: e.target.value === "true",
                                })
                              }
                              className="edit-input"
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          </div>
                        </td>
                        <td style={{ verticalAlign: "middle" }}>
                          <div
                            className="action-buttons"
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <button
                              className="save-button"
                              onClick={() => updateFaq(faq.id)}
                            >
                              <FaEdit /> Save
                            </button>
                            <button
                              className="cancel-button"
                              onClick={cancelEditing}
                            >
                              <FaTrash /> Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{faq.question}</td>
                        <td
                          style={{
                            wordWrap: "break-word",
                            whiteSpace: "normal",
                          }}
                        >
                          {faq.answer}
                        </td>
                        <td style={{ verticalAlign: "middle" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <span
                              className="status-badge"
                              style={{
                                backgroundColor: faq.isActive
                                  ? "#28a745"
                                  : "#dc3545",
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                              }}
                            >
                              {faq.isActive ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>
                        </td>
                        <td style={{ verticalAlign: "middle" }}>
                          <div
                            className="action-buttons"
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <button
                              className="edit-button"
                              onClick={() => startEditing(faq)}
                            >
                              <FaEdit /> Edit
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDeleteClick(faq)}
                            >
                              <FaTrash /> Delete
                            </button>
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
      </div>
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete FAQ"
        message="Are you sure you want to delete this FAQ?"
        itemName={deleteModal.question}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
};

export default withAuthenticationRequired(FAQManagement, {
  onRedirecting: () => <PageLoader />,
});
