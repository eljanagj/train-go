import React, { useState, useEffect } from "react";
import { withAuthenticationRequired } from "@auth0/auth0-react";
import { PageLoader } from "../../components/PageLoader";
import Sidebar from "../../components/Sidebar";
import { trainService } from "../../services/trainService";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import "../../styles/management.css";
import { FaTrain, FaEdit, FaTrash, FaPlus, FaChair } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import SearchBar from "../../components/SearchBar";

const TrainManagement = ({ theme, toggleTheme }) => {
  const [trains, setTrains] = useState([]);
  const [trainStatuses, setTrainStatuses] = useState([]);
  const [newTrain, setNewTrain] = useState({
    trainName: "",
    model: "",
    manufacturer: "",
    productionYear: "",
    status: "", // Empty initially to force selection
  });
  const [editingTrain, setEditingTrain] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    trainId: null,
    trainName: "",
    isLoading: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrains();
    fetchTrainStatuses();
  }, []);

  const fetchTrains = async () => {
    try {
      const data = await trainService.getAllTrains();
      setTrains(data);
    } catch (error) {
      console.error("Error fetching trains:", error);
    }
  };

  const fetchTrainStatuses = async () => {
    try {
      // For now, we'll use the enum values directly since we know them
      // In a real app, you might want to create an endpoint to fetch these
      const statuses = ["ACTIVE", "DECOMMISSIONED"];
      setTrainStatuses(statuses);
    } catch (error) {
      console.error("Error fetching train statuses:", error);
      // Fallback to default statuses
      setTrainStatuses(["ACTIVE", "DECOMMISSIONED"]);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!newTrain.trainName.trim()) {
      errors.trainName = "Train name is required";
    }

    if (!newTrain.model.trim()) {
      errors.model = "Model is required";
    }

    if (!newTrain.manufacturer.trim()) {
      errors.manufacturer = "Manufacturer is required";
    }

    if (!newTrain.productionYear || newTrain.productionYear === "") {
      errors.productionYear = "Production year is required";
    } else if (
      newTrain.productionYear < 1900 ||
      newTrain.productionYear > new Date().getFullYear()
    ) {
      errors.productionYear = `Production year must be between 1900 and ${new Date().getFullYear()}`;
    }

    if (!newTrain.status) {
      errors.status = "Status is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createTrain = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Create train with initial capacity values
      const trainData = {
        ...newTrain,
        totalCapacity: 0,
        availableSeats: 0,
      };

      await trainService.createTrain(trainData);
      fetchTrains();
      setNewTrain({
        trainName: "",
        model: "",
        manufacturer: "",
        productionYear: "",
        status: "",
      });
      setFormErrors({});
    } catch (error) {
      console.error("Error creating train:", error);
    }
  };

  const updateTrain = async (trainID) => {
    if (!trainID) {
      console.error("No train ID provided for update");
      return;
    }
    try {
      const {
        trainID: id,
        createdAt,
        updatedAt,
        schedules,
        totalCapacity,
        availableSeats,
        ...updateData
      } = editingTrain;

      // Ensure all number fields are actually numbers
      const finalUpdateData = {
        ...updateData,
        productionYear:
          typeof updateData.productionYear === "string"
            ? parseInt(updateData.productionYear, 10)
            : updateData.productionYear,
      };

      // Get the original train to compare status
      const originalTrain = trains.find((t) => t.trainID === trainID);

      // Update basic train data (excluding status)
      const { status, ...basicUpdateData } = finalUpdateData;
      await trainService.updateTrain(trainID, basicUpdateData);

      // Handle status update separately if it changed
      if (originalTrain && originalTrain.status !== editingTrain.status) {
        console.log(
          `Updating status from ${originalTrain.status} to ${editingTrain.status}`
        );
        await trainService.updateTrainStatus(trainID, editingTrain.status);
      }

      setEditingTrain(null);
      fetchTrains();
    } catch (error) {
      console.error("Error updating train:", error);
      alert("Failed to update train. Please try again.");
    }
  };

  const handleDeleteClick = (train) => {
    setDeleteModal({
      isOpen: true,
      trainId: train.trainID,
      trainName: train.trainName,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await trainService.deleteTrain(deleteModal.trainId);
      fetchTrains();
      setDeleteModal({
        isOpen: false,
        trainId: null,
        trainName: "",
        isLoading: false,
      });
    } catch (error) {
      console.error("Error deleting train:", error);
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      trainId: null,
      trainName: "",
      isLoading: false,
    });
  };

  const startEditing = (train) => {
    setEditingTrain({ ...train });
  };

  const cancelEditing = () => {
    setEditingTrain(null);
  };

  const handleManageSeats = (trainId) => {
    navigate(`/admin/trains/${trainId}/seats`);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const filteredTrains = trains.filter(
    (train) =>
      train.trainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      train.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      train.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <Sidebar theme={theme} onToggleTheme={toggleTheme} />
      <div className="management-page">
        <h1>Train Management</h1>
        <SearchBar onSearch={handleSearch} placeholder="Search trains..." />

        {/* Add Train Form */}
        <div className="management-form">
          <div className="management-form-header">
            <h2>
              <FaTrain /> Add New Train
            </h2>
          </div>
          <div className="management-form-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Train Name *</label>
                <input
                  type="text"
                  placeholder="Enter train name"
                  value={newTrain.trainName}
                  onChange={(e) =>
                    setNewTrain({ ...newTrain, trainName: e.target.value })
                  }
                  className={formErrors.trainName ? "error" : ""}
                />
                {formErrors.trainName && (
                  <span className="error-message">{formErrors.trainName}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Model *</label>
                <input
                  type="text"
                  placeholder="Enter train model"
                  value={newTrain.model}
                  onChange={(e) =>
                    setNewTrain({ ...newTrain, model: e.target.value })
                  }
                  className={formErrors.model ? "error" : ""}
                />
                {formErrors.model && (
                  <span className="error-message">{formErrors.model}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Manufacturer *</label>
                <input
                  type="text"
                  placeholder="Enter manufacturer"
                  value={newTrain.manufacturer}
                  onChange={(e) =>
                    setNewTrain({ ...newTrain, manufacturer: e.target.value })
                  }
                  className={formErrors.manufacturer ? "error" : ""}
                />
                {formErrors.manufacturer && (
                  <span className="error-message">
                    {formErrors.manufacturer}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Production Year *</label>
                <input
                  type="number"
                  placeholder="Enter production year"
                  value={newTrain.productionYear}
                  onChange={(e) =>
                    setNewTrain({
                      ...newTrain,
                      productionYear: e.target.value
                        ? parseInt(e.target.value, 10)
                        : "",
                    })
                  }
                  min="1900"
                  max={new Date().getFullYear()}
                  className={formErrors.productionYear ? "error" : ""}
                />
                {formErrors.productionYear && (
                  <span className="error-message">
                    {formErrors.productionYear}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Status *</label>
                <select
                  value={newTrain.status}
                  onChange={(e) =>
                    setNewTrain({ ...newTrain, status: e.target.value })
                  }
                  className={formErrors.status ? "error" : ""}
                >
                  <option value="">Select status</option>
                  {trainStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </select>
                {formErrors.status && (
                  <span className="error-message">{formErrors.status}</span>
                )}
              </div>
              <div className="form-actions">
                <button
                  className="add-button"
                  onClick={createTrain}
                  disabled={
                    !newTrain.trainName.trim() ||
                    !newTrain.model.trim() ||
                    !newTrain.manufacturer.trim() ||
                    !newTrain.productionYear ||
                    !newTrain.status
                  }
                >
                  <FaPlus /> Add Train
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

        {/* Trains Table */}
        <div className="management-table-container">
          <h2>
            <FaTrain /> Existing Trains
          </h2>
          <table className="management-table">
            <thead>
              <tr>
                <th>Train Name</th>
                <th>Model</th>
                <th>Manufacturer</th>
                <th>Production Year</th>
                <th>Total Capacity</th>
                <th>Available Seats</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrains.map((train) => (
                <tr key={train.trainID}>
                  {editingTrain && editingTrain.trainID === train.trainID ? (
                    <>
                      <td>
                        <input
                          type="text"
                          value={editingTrain.trainName}
                          onChange={(e) =>
                            setEditingTrain({
                              ...editingTrain,
                              trainName: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingTrain.model}
                          onChange={(e) =>
                            setEditingTrain({
                              ...editingTrain,
                              model: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingTrain.manufacturer}
                          onChange={(e) =>
                            setEditingTrain({
                              ...editingTrain,
                              manufacturer: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editingTrain.productionYear}
                          onChange={(e) =>
                            setEditingTrain({
                              ...editingTrain,
                              productionYear: parseInt(e.target.value, 10),
                            })
                          }
                        />
                      </td>
                      <td>{train.totalCapacity || 0}</td>
                      <td>{train.availableSeats || 0}</td>
                      <td>
                        <select
                          value={editingTrain.status}
                          onChange={(e) =>
                            setEditingTrain({
                              ...editingTrain,
                              status: e.target.value,
                            })
                          }
                        >
                          {trainStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="action-buttons">
                        <button
                          className="save-button"
                          onClick={() => updateTrain(train.trainID)}
                        >
                          <FaEdit /> Save
                        </button>
                        <button
                          className="cancel-button"
                          onClick={cancelEditing}
                        >
                          <FaTrash /> Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{train.trainName}</td>
                      <td>{train.model}</td>
                      <td>{train.manufacturer}</td>
                      <td>{train.productionYear}</td>
                      <td>{train.totalCapacity || 0}</td>
                      <td>{train.availableSeats || 0}</td>
                      <td>{train.status}</td>
                      <td className="action-buttons">
                        <button
                          className="edit-button"
                          onClick={() => startEditing(train)}
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteClick(train)}
                        >
                          <FaTrash /> Delete
                        </button>
                        <button
                          className="seats-button"
                          onClick={() => handleManageSeats(train.trainID)}
                        >
                          <FaChair /> Seats
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Train"
        message="Are you sure you want to delete this train?"
        itemName={deleteModal.trainName}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
};

export default withAuthenticationRequired(TrainManagement, {
  onRedirecting: () => <PageLoader />,
});
