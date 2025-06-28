import React, { useState, useEffect } from "react";
import { withAuthenticationRequired } from "@auth0/auth0-react";
import { PageLoader } from "../../components/PageLoader";
import Sidebar from "../../components/Sidebar";
import { routeService } from "../../services/routeService";
import { trainService } from "../../services/trainService";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import {
  FaRoute,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTrain,
  FaEuroSign,
} from "react-icons/fa";
import "../../styles/management.css";
import SearchBar from "../../components/SearchBar";

const RouteManagement = ({ theme, toggleTheme }) => {
  const [routes, setRoutes] = useState([]);
  const [trains, setTrains] = useState([]);
  const [newRoute, setNewRoute] = useState({
    departureStation: "",
    arrivalStation: "",
    price: "",
    trainID: "",
  });
  const [editingRoute, setEditingRoute] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    routeId: null,
    routeName: "",
    isLoading: false,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchRoutes();
    fetchTrains();
  }, []);

  const fetchTrains = async () => {
    try {
      const data = await trainService.getAllTrains();
      setTrains(data);
    } catch (error) {
      console.error("Error fetching trains:", error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const data = await routeService.getAllRoutes();
      setRoutes(data);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!newRoute.departureStation.trim()) {
      errors.departureStation = "Departure station is required";
    }

    if (!newRoute.arrivalStation.trim()) {
      errors.arrivalStation = "Arrival station is required";
    }

    if (!newRoute.price || parseFloat(newRoute.price) <= 0) {
      errors.price = "Valid price is required";
    }

    if (!newRoute.trainID) {
      errors.trainID = "Train selection is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createRoute = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const routeData = {
        departureStation: newRoute.departureStation,
        arrivalStation: newRoute.arrivalStation,
        price: parseFloat(newRoute.price),
        trainID: parseInt(newRoute.trainID),
      };
      await routeService.createRoute(routeData);
      fetchRoutes();
      setNewRoute({
        departureStation: "",
        arrivalStation: "",
        price: "",
        trainID: "",
      });
      setFormErrors({});
    } catch (error) {
      console.error("Error creating route:", error);
      alert("Failed to create route");
    }
  };

  const updateRoute = async (id) => {
    if (!id) {
      console.error("No route ID provided for update");
      return;
    }
    try {
      const {
        id: routeId,
        createdAt,
        updatedAt,
        schedules,
        ...updateData
      } = editingRoute;
      const selectedTrain = trains.find(
        (train) => train.trainID === parseInt(updateData.trainID)
      );
      if (!selectedTrain) {
        throw new Error("Please select a train");
      }

      const finalUpdateData = {
        departureStation: updateData.departureStation,
        arrivalStation: updateData.arrivalStation,
        price: parseFloat(updateData.price),
        trainID: parseInt(updateData.trainID),
      };
      await routeService.updateRoute(id, finalUpdateData);
      setEditingRoute(null);
      fetchRoutes();
    } catch (error) {
      console.error("Error updating route:", error);
    }
  };

  const handleDeleteClick = (route) => {
    const routeName = `${route.departureStation} - ${route.arrivalStation}`;
    setDeleteModal({
      isOpen: true,
      routeId: route.id,
      routeName: routeName,
      isLoading: false,
    });
  };

  const handleDeleteConfirm = async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await routeService.deleteRoute(deleteModal.routeId);
      fetchRoutes();
      setDeleteModal({
        isOpen: false,
        routeId: null,
        routeName: "",
        isLoading: false,
      });
    } catch (error) {
      console.error("Error deleting route:", error);
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      routeId: null,
      routeName: "",
      isLoading: false,
    });
  };

  const startEditing = (route) => {
    setEditingRoute({
      ...route,
      trainID: route.trainID || "", // Set to empty string if null/undefined
    });
  };

  const cancelEditing = () => {
    setEditingRoute(null);
  };

  const getTrainInfo = (trainID) => {
    if (!trainID) {
      return { trainName: "Not Assigned", totalCapacity: "N/A" };
    }
    const train = trains.find((t) => t.trainID === parseInt(trainID));
    if (!train) {
      console.log("Train not found for ID:", trainID);
    }
    return train || { trainName: "Unknown", totalCapacity: "N/A" };
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const filteredRoutes = routes.filter(
    (route) =>
      route.departureStation
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      route.arrivalStation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getTrainInfo(route.trainID)
        ?.trainName?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <Sidebar theme={theme} onToggleTheme={toggleTheme} />
      <div className="management-page">
        <h1>Route Management</h1>
        <SearchBar onSearch={handleSearch} placeholder="Search routes..." />

        <div className="management-form">
          <div className="management-form-header">
            <h2>
              <FaRoute /> Add New Route
            </h2>
          </div>
          <div className="management-form-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Departure Station *</label>
                <input
                  type="text"
                  placeholder="Enter departure station"
                  value={newRoute.departureStation}
                  onChange={(e) =>
                    setNewRoute({
                      ...newRoute,
                      departureStation: e.target.value,
                    })
                  }
                  className={formErrors.departureStation ? "error" : ""}
                />
                {formErrors.departureStation && (
                  <span className="error-message">
                    {formErrors.departureStation}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Arrival Station *</label>
                <input
                  type="text"
                  placeholder="Enter arrival station"
                  value={newRoute.arrivalStation}
                  onChange={(e) =>
                    setNewRoute({ ...newRoute, arrivalStation: e.target.value })
                  }
                  className={formErrors.arrivalStation ? "error" : ""}
                />
                {formErrors.arrivalStation && (
                  <span className="error-message">
                    {formErrors.arrivalStation}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Price (€) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newRoute.price}
                  onChange={(e) =>
                    setNewRoute({ ...newRoute, price: e.target.value })
                  }
                  step="0.01"
                  min="0"
                  className={formErrors.price ? "error" : ""}
                />
                {formErrors.price && (
                  <span className="error-message">{formErrors.price}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Train *</label>
                <select
                  value={newRoute.trainID}
                  onChange={(e) =>
                    setNewRoute({ ...newRoute, trainID: e.target.value })
                  }
                  className={formErrors.trainID ? "error" : ""}
                >
                  <option value="">Select a train</option>
                  {trains.map((train) => (
                    <option key={train.trainID} value={train.trainID}>
                      {train.trainName}
                    </option>
                  ))}
                </select>
                {formErrors.trainID && (
                  <span className="error-message">{formErrors.trainID}</span>
                )}
              </div>
              <div className="form-actions">
                <button
                  className="add-button"
                  onClick={createRoute}
                  disabled={
                    !newRoute.departureStation.trim() ||
                    !newRoute.arrivalStation.trim() ||
                    !newRoute.price ||
                    !newRoute.trainID
                  }
                >
                  <FaPlus /> Add Route
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

        <div className="management-table-container">
          <h2>
            <FaTrain /> Existing Routes
          </h2>
          {trains.length === 0 ? (
            <p>Loading trains...</p>
          ) : (
            <table className="management-table">
              <thead>
                <tr>
                  <th>Departure</th>
                  <th>Arrival</th>
                  <th>Price</th>
                  <th>Train</th>
                  <th>Capacity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes.map((route) => (
                  <tr key={route.id}>
                    {editingRoute && editingRoute.id === route.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editingRoute.departureStation}
                            onChange={(e) =>
                              setEditingRoute({
                                ...editingRoute,
                                departureStation: e.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editingRoute.arrivalStation}
                            onChange={(e) =>
                              setEditingRoute({
                                ...editingRoute,
                                arrivalStation: e.target.value,
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editingRoute.price}
                            onChange={(e) =>
                              setEditingRoute({
                                ...editingRoute,
                                price: e.target.value,
                              })
                            }
                            step="0.01"
                          />
                        </td>
                        <td>
                          <select
                            value={editingRoute.trainID}
                            onChange={(e) =>
                              setEditingRoute({
                                ...editingRoute,
                                trainID: e.target.value,
                              })
                            }
                          >
                            <option value="">Select a train</option>
                            {trains.map((train) => (
                              <option key={train.trainID} value={train.trainID}>
                                {train.trainName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {trains.find(
                            (t) => t.trainID === parseInt(editingRoute.trainID)
                          )?.totalCapacity || "N/A"}
                        </td>
                        <td className="action-buttons">
                          <button
                            className="save-button"
                            onClick={() => updateRoute(route.id)}
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
                        <td>{route.departureStation}</td>
                        <td>{route.arrivalStation}</td>
                        <td>
                          <FaEuroSign /> {parseFloat(route.price).toFixed(2)}
                        </td>
                        <td>{getTrainInfo(route.trainID).trainName}</td>
                        <td>{getTrainInfo(route.trainID).totalCapacity}</td>
                        <td className="action-buttons">
                          <button
                            className="edit-button"
                            onClick={() => startEditing(route)}
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => handleDeleteClick(route)}
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
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Route"
        message="Are you sure you want to delete this route?"
        itemName={deleteModal.routeName}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
};

export default withAuthenticationRequired(RouteManagement, {
  onRedirecting: () => <PageLoader />,
});
