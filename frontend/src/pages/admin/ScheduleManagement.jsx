import React, { useState, useEffect } from 'react';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { PageLoader } from '../../components/PageLoader';
import Sidebar from '../../components/Sidebar';
import { scheduleService } from '../../services/scheduleService';
import { trainService } from '../../services/trainService';
import { routeService } from '../../services/routeService';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import { FaClock, FaPlus, FaEdit, FaTrash, FaTrain, FaRoute } from 'react-icons/fa';
import '../../styles/management.css';

// Simple Time Input Component
const TimeInput = ({ value, onChange, className, placeholder }) => {
  return (
    <div className="time-input-container">
      <FaClock className="time-input-icon" />
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`time-input ${className || ''}`}
        placeholder={placeholder}
      />
    </div>
  );
};

const ScheduleManagement = ({ theme, toggleTheme }) => {
  const [schedules, setSchedules] = useState([]);
  const [trains, setTrains] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    trainID: '',
    routeID: '',
    departureTime: '',
    arrivalTime: ''
  });
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    scheduleId: null,
    scheduleName: '',
    isLoading: false
  });

  useEffect(() => {
    fetchSchedules();
    fetchTrains();
    fetchRoutes();
  }, []);

  const fetchSchedules = async () => {
    try {
      const data = await scheduleService.getAllSchedules();
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchTrains = async () => {
    try {
      const data = await trainService.getAllTrains();
      setTrains(data);
    } catch (error) {
      console.error('Error fetching trains:', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const data = await routeService.getAllRoutes();
      setRoutes(data);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!newSchedule.trainID) {
      errors.trainID = 'Train selection is required';
    }

    if (!newSchedule.routeID) {
      errors.routeID = 'Route selection is required';
    }

    if (!newSchedule.departureTime) {
      errors.departureTime = 'Departure time is required';
    }

    if (!newSchedule.arrivalTime) {
      errors.arrivalTime = 'Arrival time is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createSchedule = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Create a date object for today
      const today = new Date();
      const [depHours, depMinutes] = newSchedule.departureTime.split(':');
      const [arrHours, arrMinutes] = newSchedule.arrivalTime.split(':');

      // Set the time components
      const departureDate = new Date(today);
      departureDate.setHours(parseInt(depHours), parseInt(depMinutes), 0);

      const arrivalDate = new Date(today);
      arrivalDate.setHours(parseInt(arrHours), parseInt(arrMinutes), 0);

      // If arrival time is before departure time, add one day to arrival
      if (arrivalDate < departureDate) {
        arrivalDate.setDate(arrivalDate.getDate() + 1);
      }

      await scheduleService.createSchedule({
        trainID: parseInt(newSchedule.trainID),
        routeID: parseInt(newSchedule.routeID),
        departureTime: departureDate.toISOString(),
        arrivalTime: arrivalDate.toISOString()
      });
      fetchSchedules();
      setNewSchedule({
        trainID: '',
        routeID: '',
        departureTime: '',
        arrivalTime: ''
      });
      setFormErrors({});
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create schedule');
    }
  };

  const updateSchedule = async (id) => {
    try {
      const today = new Date();
      const [depHours, depMinutes] = editingSchedule.departureTime.split(':');
      const [arrHours, arrMinutes] = editingSchedule.arrivalTime.split(':');

      const departureDate = new Date(today);
      departureDate.setHours(parseInt(depHours), parseInt(depMinutes), 0);

      const arrivalDate = new Date(today);
      arrivalDate.setHours(parseInt(arrHours), parseInt(arrMinutes), 0);

      if (arrivalDate < departureDate) {
        arrivalDate.setDate(arrivalDate.getDate() + 1);
      }

      await scheduleService.updateSchedule(id, {
        trainID: parseInt(editingSchedule.trainID),
        routeID: parseInt(editingSchedule.routeID),
        departureTime: departureDate.toISOString(),
        arrivalTime: arrivalDate.toISOString()
      });
      setEditingSchedule(null);
      fetchSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const handleDeleteClick = (schedule) => {
    const trainName = getTrainDisplay(schedule.train.trainID);
    const routeName = getRouteDisplay(schedule.route.id);
    setDeleteModal({
      isOpen: true,
      scheduleId: schedule.id,
      scheduleName: `${trainName} - ${routeName}`,
      isLoading: false
    });
  };

  const handleDeleteConfirm = async () => {
    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    try {
      await scheduleService.deleteSchedule(deleteModal.scheduleId);
      fetchSchedules();
      setDeleteModal({
        isOpen: false,
        scheduleId: null,
        scheduleName: '',
        isLoading: false
      });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      scheduleId: null,
      scheduleName: '',
      isLoading: false
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTrainDisplay = (trainID) => {
    const train = trains.find(t => t.trainID === trainID);
    return train ? `${train.model} (${train.manufacturer})` : 'Unknown Train';
  };

  const getRouteDisplay = (routeID) => {
    const route = routes.find(r => r.id === routeID);
    return route ? `${route.departureStation} - ${route.arrivalStation}` : 'Unknown Route';
  };

  const startEditing = (schedule) => {
    setEditingSchedule({
      ...schedule,
      trainID: schedule.train.trainID,
      routeID: schedule.route.id,
      departureTime: formatTime(schedule.departureTime),
      arrivalTime: formatTime(schedule.arrivalTime)
    });
  };

  const cancelEditing = () => {
    setEditingSchedule(null);
  };

  return (
    <div className="page-container">
      <Sidebar theme={theme} onToggleTheme={toggleTheme} />
      <div className="management-page">
        <h1>Schedule Management</h1>

        <div className="management-form">
          <div className="management-form-header">
            <h2><FaClock /> Add New Schedule</h2>
          </div>
          <div className="management-form-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Train *</label>
                <select
                  value={newSchedule.trainID}
                  onChange={(e) => setNewSchedule({ ...newSchedule, trainID: e.target.value })}
                  className={formErrors.trainID ? 'error' : ''}
                >
                  <option value="">Select a train</option>
                  {trains.map((train) => (
                    <option key={train.trainID} value={train.trainID}>
                      {train.trainName} ({train.model})
                    </option>
                  ))}
                </select>
                {formErrors.trainID && <span className="error-message">{formErrors.trainID}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Route *</label>
                <select
                  value={newSchedule.routeID}
                  onChange={(e) => setNewSchedule({ ...newSchedule, routeID: e.target.value })}
                  className={formErrors.routeID ? 'error' : ''}
                >
                  <option value="">Select a route</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.departureStation} - {route.arrivalStation}
                    </option>
                  ))}
                </select>
                {formErrors.routeID && <span className="error-message">{formErrors.routeID}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Departure Time *</label>
                <TimeInput
                  value={newSchedule.departureTime}
                  onChange={(time) => setNewSchedule({ ...newSchedule, departureTime: time })}
                  className={formErrors.departureTime ? 'error' : ''}
                  placeholder="HH:MM"
                />
                {formErrors.departureTime && <span className="error-message">{formErrors.departureTime}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Arrival Time *</label>
                <TimeInput
                  value={newSchedule.arrivalTime}
                  onChange={(time) => setNewSchedule({ ...newSchedule, arrivalTime: time })}
                  className={formErrors.arrivalTime ? 'error' : ''}
                  placeholder="HH:MM"
                />
                {formErrors.arrivalTime && <span className="error-message">{formErrors.arrivalTime}</span>}
              </div>

              <div className="form-actions">
                <button
                  className="add-button"
                  onClick={createSchedule}
                  disabled={!newSchedule.trainID || !newSchedule.routeID || !newSchedule.departureTime || !newSchedule.arrivalTime}
                >
                  <FaPlus /> Add Schedule
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
          <h2><FaTrain /> Existing Schedules</h2>
          {schedules.length === 0 ? (
            <p>No schedules found. Create your first schedule above.</p>
          ) : (
            <table className="management-table">
              <thead>
                <tr>
                  <th>Train</th>
                  <th>Route</th>
                  <th>Departure Time</th>
                  <th>Arrival Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    {editingSchedule && editingSchedule.id === schedule.id ? (
                      <>
                        <td>
                          <select
                            value={editingSchedule.trainID}
                            onChange={(e) => setEditingSchedule({ ...editingSchedule, trainID: e.target.value })}
                          >
                            <option value="">Select a train</option>
                            {trains.map((train) => (
                              <option key={train.trainID} value={train.trainID}>
                                {train.trainName} ({train.model})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={editingSchedule.routeID}
                            onChange={(e) => setEditingSchedule({ ...editingSchedule, routeID: e.target.value })}
                          >
                            <option value="">Select a route</option>
                            {routes.map((route) => (
                              <option key={route.id} value={route.id}>
                                {route.departureStation} - {route.arrivalStation}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <TimeInput
                            value={editingSchedule.departureTime}
                            onChange={(time) => setEditingSchedule({ ...editingSchedule, departureTime: time })}
                            placeholder="HH:MM"
                          />
                        </td>
                        <td>
                          <TimeInput
                            value={editingSchedule.arrivalTime}
                            onChange={(time) => setEditingSchedule({ ...editingSchedule, arrivalTime: time })}
                            placeholder="HH:MM"
                          />
                        </td>
                        <td className="action-buttons">
                          <button className="save-button" onClick={() => updateSchedule(schedule.id)}>
                            <FaEdit /> Save
                          </button>
                          <button className="cancel-button" onClick={cancelEditing}>
                            <FaTrash /> Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{getTrainDisplay(schedule.train.trainID)}</td>
                        <td>
                          <FaRoute /> {getRouteDisplay(schedule.route.id)}
                        </td>
                        <td>
                          <FaClock /> {formatTime(schedule.departureTime)}
                        </td>
                        <td>
                          <FaClock /> {formatTime(schedule.arrivalTime)}
                        </td>
                        <td className="action-buttons">
                          <button className="edit-button" onClick={() => startEditing(schedule)}>
                            <FaEdit /> Edit
                          </button>
                          <button className="delete-button" onClick={() => handleDeleteClick(schedule)}>
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
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule?"
        itemName={deleteModal.scheduleName}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
};

export default withAuthenticationRequired(ScheduleManagement, {
  onRedirecting: () => <PageLoader />,
});