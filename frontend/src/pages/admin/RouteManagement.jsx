import React, { useState, useEffect } from "react";
import { withAuthenticationRequired } from "@auth0/auth0-react";
import { PageLoader } from "../../components/PageLoader";
import Sidebar from "../../components/Sidebar";
import { routeService } from "../../services/routeService";
import { trainService } from "../../services/trainService";
import { stationService } from "../../services/stationService";
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
  const [stations, setStations] = useState([]);
  const [newRoute, setNewRoute] = useState({
    departureStationId: "",
    arrivalStationId: "",
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
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const data = await stationService.getAllStations();
      setStations(data);
    } catch (error) {
      console.error("Error fetching stations:", error);
    }
  };

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

    if (!newRoute.departureStationId) {
      errors.departureStationId = "Departure station is required";
    }

    if (!newRoute.arrivalStationId) {
      errors.arrivalStationId = "Arrival station is required";
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
        departureStationId: parseInt(newRoute.departureStationId),
        arrivalStationId: parseInt(newRoute.arrivalStationId),
        price: parseFloat(newRoute.price),
        trainID: parseInt(newRoute.trainID),
      };
      await routeService.createRoute(routeData);
      fetchRoutes();
      setNewRoute({
        departureStationId: "",
        arrivalStationId: "",
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
        departureStation,
        arrivalStation,
        ...updateData
      } = editingRoute;

      const selectedTrain = trains.find(
        (train) => train.trainID === parseInt(updateData.trainID)
      );
      if (!selectedTrain) {
        throw new Error("Please select a train");
      }

      const finalUpdateData = {
        departureStationId: updateData.departureStationId,
        arrivalStationId: updateData.arrivalStationId,
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
    const departureStation =
      stations.find((s) => s.stationID === route.departureStation?.stationID)
        ?.name || "Unknown";
    const arrivalStation =
      stations.find((s) => s.stationID === route.arrivalStation?.stationID)
        ?.name || "Unknown";
    const routeName = `${departureStation} - ${arrivalStation}`;
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
      departureStationId: route.departureStation?.stationID || "",
      arrivalStationId: route.arrivalStation?.stationID || "",
      trainID: route.trainID || "",
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

  const getStationName = (station) => {
    if (!station) return "Unknown";
    return station.name || "Unknown";
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const filteredRoutes = routes.filter(
    (route) =>
      getStationName(route.departureStation)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      getStationName(route.arrivalStation)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
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
                <select
                  value={newRoute.departureStationId}
                  onChange={(e) =>
                    setNewRoute({
                      ...newRoute,
                      departureStationId: e.target.value,
                    })
                  }
                  className={formErrors.departureStationId ? "error" : ""}
                >
                  <option value="">Select departure station</option>
                  {stations.map((station) => (
                    <option key={station.stationID} value={station.stationID}>
                      {station.name}
                    </option>
                  ))}
                </select>
                {formErrors.departureStationId && (
                  <span className="error-message">
                    {formErrors.departureStationId}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Arrival Station *</label>
                <select
                  value={newRoute.arrivalStationId}
                  onChange={(e) =>
                    setNewRoute({
                      ...newRoute,
                      arrivalStationId: e.target.value,
                    })
                  }
                  className={formErrors.arrivalStationId ? "error" : ""}
                >
                  <option value="">Select arrival station</option>
                  {stations.map((station) => (
                    <option key={station.stationID} value={station.stationID}>
                      {station.name}
                    </option>
                  ))}
                </select>
                {formErrors.arrivalStationId && (
                  <span className="error-message">
                    {formErrors.arrivalStationId}
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
                    !newRoute.departureStationId ||
                    !newRoute.arrivalStationId ||
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
                          <select
                            value={editingRoute.departureStationId}
                            onChange={(e) =>
                              setEditingRoute({
                                ...editingRoute,
                                departureStationId: e.target.value,
                              })
                            }
                          >
                            {stations.map((station) => (
                              <option
                                key={station.stationID}
                                value={station.stationID}
                              >
                                {station.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={editingRoute.arrivalStationId}
                            onChange={(e) =>
                              setEditingRoute({
                                ...editingRoute,
                                arrivalStationId: e.target.value,
                              })
                            }
                          >
                            {stations.map((station) => (
                              <option
                                key={station.stationID}
                                value={station.stationID}
                              >
                                {station.name}
                              </option>
                            ))}
                          </select>
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
                            {trains.map((train) => (
                              <option key={train.trainID} value={train.trainID}>
                                {train.trainName}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {getTrainInfo(editingRoute.trainID).totalCapacity}
                        </td>
                        <td>
                          <div className="action-buttons">
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
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{getStationName(route.departureStation)}</td>
                        <td>{getStationName(route.arrivalStation)}</td>
                        <td>€{route.price}</td>
                        <td>{getTrainInfo(route.trainID).trainName}</td>
                        <td>{getTrainInfo(route.trainID).totalCapacity}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="edit-button"
                              onClick={() => startEditing(route)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDeleteClick(route)}
                            >
                              <FaTrash />
                            </button>
                          </div>
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
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title="Delete Route"
        message={`Are you sure you want to delete the route "${deleteModal.routeName}"?`}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
};

export default withAuthenticationRequired(RouteManagement, {
  onRedirecting: () => <PageLoader />,
});
