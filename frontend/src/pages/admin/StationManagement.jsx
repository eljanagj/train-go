import React, { useState, useEffect } from "react";
import { withAuthenticationRequired } from "@auth0/auth0-react";
import { PageLoader } from "../../components/PageLoader";
import Sidebar from "../../components/Sidebar";
import { stationService } from "../../services/stationService";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import "../../styles/management.css";
import { FaMapMarkerAlt, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import SearchBar from "../../components/SearchBar";

const StationManagement = ({ theme, toggleTheme }) => {
  const [stations, setStations] = useState([]);
  const [stationStatuses, setStationStatuses] = useState([]);
  const [newStation, setNewStation] = useState({
    name: "",
    location: "",
    facilities: "",
    contactInfo: "",
    operatingHours: "",
    status: "",
  });
  const [editingStation, setEditingStation] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    stationId: null,
    stationName: "",
    isLoading: false,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStations();
    fetchStationStatuses();
  }, []);

  const fetchStations = async () => {
    try {
      const data = await stationService.getAllStations();
      setStations(data);
    } catch (error) {
      console.error("Error fetching stations:", error);
    }
  };

  const fetchStationStatuses = async () => {
    try {
      const statuses = ["ACTIVE", "INACTIVE"];
      setStationStatuses(statuses);
    } catch (error) {
      console.error("Error fetching station statuses:", error);
      setStationStatuses(["ACTIVE", "INACTIVE"]);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!newStation.name.trim()) {
      errors.name = "Station name is required";
    }

    if (!newStation.status) {
      errors.status = "Status is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createStation = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await stationService.createStation(newStation);
      fetchStations();
      setNewStation({
        name: "",
        location: "",
        facilities: "",
        contactInfo: "",
        operatingHours: "",
        status: "",
      });
      setFormErrors({});
    } catch (error) {
      console.error("Error creating station:", error);
    }
  };

  const updateStation = async (stationID) => {
    if (!stationID) {
      console.error("No station ID provided for update");
      return;
    }
    try {
      const {
        stationID: id,
        createdAt,
        updatedAt,
        departureRoutes,
        arrivalRoutes,
        ...updateData
      } = editingStation;

      // Get the original station to compare status
      const originalStation = stations.find((s) => s.stationID === stationID);

      // Update basic station data (excluding status)
      const { status, ...basicUpdateData } = updateData;
      await stationService.updateStation(stationID, basicUpdateData);

      // Handle status update separately if it changed
      if (originalStation && originalStation.status !== editingStation.status) {
        console.log(
          `Updating status from ${originalStation.status} to ${editingStation.status}`
        );
        await stationService.updateStationStatus(
          stationID,
          editingStation.status
        );
      }

      setEditingStation(null);
      fetchStations();
    } catch (error) {
      console.error("Error updating station:", error);
      alert("Failed to update station. Please try again.");
    }
  };

  const handleDeleteClick = (station) => {
    setDeleteModal({
      isOpen: true,
      stationId: station.stationID,
      stationName: station.name,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await stationService.deleteStation(deleteModal.stationId);
      fetchStations();
      setDeleteModal({
        isOpen: false,
        stationId: null,
        stationName: "",
        isLoading: false,
      });
    } catch (error) {
      console.error("Error deleting station:", error);
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      stationId: null,
      stationName: "",
      isLoading: false,
    });
  };

  const startEditing = (station) => {
    setEditingStation({ ...station });
  };

  const cancelEditing = () => {
    setEditingStation(null);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const filteredStations = stations.filter(
    (station) =>
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (station.location &&
        station.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="page-container">
      <Sidebar theme={theme} onToggleTheme={toggleTheme} />
      <div className="management-page">
        <h1>Station Management</h1>
        <SearchBar onSearch={handleSearch} placeholder="Search stations..." />

        {/* Add Station Form */}
        <div className="management-form">
          <div className="management-form-header">
            <h2>
              <FaMapMarkerAlt /> Add New Station
            </h2>
          </div>
          <div className="management-form-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Station Name *</label>
                <input
                  type="text"
                  placeholder="Enter station name"
                  value={newStation.name}
                  onChange={(e) =>
                    setNewStation({ ...newStation, name: e.target.value })
                  }
                  className={formErrors.name ? "error" : ""}
                />
                {formErrors.name && (
                  <span className="error-message">{formErrors.name}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  placeholder="Enter station location"
                  value={newStation.location}
                  onChange={(e) =>
                    setNewStation({ ...newStation, location: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Facilities</label>
                <textarea
                  placeholder="Enter available facilities"
                  value={newStation.facilities}
                  onChange={(e) =>
                    setNewStation({ ...newStation, facilities: e.target.value })
                  }
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Info</label>
                <input
                  type="text"
                  placeholder="Enter contact information"
                  value={newStation.contactInfo}
                  onChange={(e) =>
                    setNewStation({
                      ...newStation,
                      contactInfo: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Operating Hours</label>
                <input
                  type="text"
                  placeholder="e.g., 6:00 AM - 10:00 PM"
                  value={newStation.operatingHours}
                  onChange={(e) =>
                    setNewStation({
                      ...newStation,
                      operatingHours: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status *</label>
                <select
                  value={newStation.status}
                  onChange={(e) =>
                    setNewStation({ ...newStation, status: e.target.value })
                  }
                  className={formErrors.status ? "error" : ""}
                >
                  <option value="">Select status</option>
                  {stationStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
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
                  onClick={createStation}
                  disabled={!newStation.name.trim() || !newStation.status}
                >
                  <FaPlus /> Add Station
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

        {/* Stations Table */}
        <div className="management-table-container">
          <h2>
            <FaMapMarkerAlt /> Existing Stations
          </h2>
          <table className="management-table">
            <thead>
              <tr>
                <th>Station Name</th>
                <th>Location</th>
                <th>Facilities</th>
                <th>Contact Info</th>
                <th>Operating Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStations.map((station) => (
                <tr key={station.stationID}>
                  {editingStation &&
                  editingStation.stationID === station.stationID ? (
                    <>
                      <td>
                        <input
                          type="text"
                          value={editingStation.name}
                          onChange={(e) =>
                            setEditingStation({
                              ...editingStation,
                              name: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingStation.location || ""}
                          onChange={(e) =>
                            setEditingStation({
                              ...editingStation,
                              location: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <textarea
                          value={editingStation.facilities || ""}
                          onChange={(e) =>
                            setEditingStation({
                              ...editingStation,
                              facilities: e.target.value,
                            })
                          }
                          rows="2"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingStation.contactInfo || ""}
                          onChange={(e) =>
                            setEditingStation({
                              ...editingStation,
                              contactInfo: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingStation.operatingHours || ""}
                          onChange={(e) =>
                            setEditingStation({
                              ...editingStation,
                              operatingHours: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={editingStation.status}
                          onChange={(e) =>
                            setEditingStation({
                              ...editingStation,
                              status: e.target.value,
                            })
                          }
                        >
                          {stationStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="action-buttons">
                        <button
                          className="save-button"
                          onClick={() => updateStation(station.stationID)}
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
                      <td>{station.name}</td>
                      <td>{station.location || "-"}</td>
                      <td>{station.facilities || "-"}</td>
                      <td>{station.contactInfo || "-"}</td>
                      <td>{station.operatingHours || "-"}</td>
                      <td>{station.status}</td>
                      <td className="action-buttons">
                        <button
                          className="edit-button"
                          onClick={() => startEditing(station)}
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteClick(station)}
                        >
                          <FaTrash /> Delete
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
        title="Delete Station"
        message="Are you sure you want to delete this station?"
        itemName={deleteModal.stationName}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
};

export default withAuthenticationRequired(StationManagement, {
  onRedirecting: () => <PageLoader />,
});
