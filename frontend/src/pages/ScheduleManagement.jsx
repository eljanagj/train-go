import React, { useState, useEffect } from 'react';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { PageLoader } from '../components/PageLoader';
import Sidebar from '../components/Sidebar';
import { scheduleService } from '../services/scheduleService';
import { trainService } from '../services/trainService';
import { routeService } from '../services/routeService';
import '../styles/management.css';

const ScheduleManagement = () => {
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

  const createSchedule = async () => {
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
    } catch (error) {
      console.error('Error creating schedule:', error);
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

  const deleteSchedule = async (id) => {
    try {
      await scheduleService.deleteSchedule(id);
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
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
      <Sidebar />
      <div className="management-page">
        <h1>Schedule Management</h1>
        
        <div className="management-form">
          <h2>Add New Schedule</h2>
          <div className="form-grid">
            <select
              value={newSchedule.trainID}
              onChange={(e) => setNewSchedule({ ...newSchedule, trainID: e.target.value })}
            >
              <option value="">Select Train</option>
              {trains.map((train) => (
                <option key={train.trainID} value={train.trainID}>
                  {train.model} ({train.manufacturer})
                </option>
              ))}
            </select>

            <select
              value={newSchedule.routeID}
              onChange={(e) => setNewSchedule({ ...newSchedule, routeID: e.target.value })}
            >
              <option value="">Select Route</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.departureStation} - {route.arrivalStation}
                </option>
              ))}
            </select>

            <input
              type="time"
              placeholder="Departure Time"
              value={newSchedule.departureTime}
              onChange={(e) => setNewSchedule({ ...newSchedule, departureTime: e.target.value })}
            />

            <input
              type="time"
              placeholder="Arrival Time"
              value={newSchedule.arrivalTime}
              onChange={(e) => setNewSchedule({ ...newSchedule, arrivalTime: e.target.value })}
            />

            <button className="add-button" onClick={createSchedule}>Add Schedule</button>
          </div>
        </div>

        <div className="management-table-container">
          <h2>Existing Schedules</h2>
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
                          {trains.map((train) => (
                            <option key={train.trainID} value={train.trainID}>
                              {train.model} ({train.manufacturer})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={editingSchedule.routeID}
                          onChange={(e) => setEditingSchedule({ ...editingSchedule, routeID: e.target.value })}
                        >
                          {routes.map((route) => (
                            <option key={route.id} value={route.id}>
                              {route.departureStation} - {route.arrivalStation}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="time"
                          value={editingSchedule.departureTime}
                          onChange={(e) => setEditingSchedule({ ...editingSchedule, departureTime: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          value={editingSchedule.arrivalTime}
                          onChange={(e) => setEditingSchedule({ ...editingSchedule, arrivalTime: e.target.value })}
                        />
                      </td>
                      <td className="action-buttons">
                        <button className="save-button" onClick={() => updateSchedule(schedule.id)}>Save</button>
                        <button className="cancel-button" onClick={cancelEditing}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{getTrainDisplay(schedule.train.trainID)}</td>
                      <td>{getRouteDisplay(schedule.route.id)}</td>
                      <td>{formatTime(schedule.departureTime)}</td>
                      <td>{formatTime(schedule.arrivalTime)}</td>
                      <td className="action-buttons">
                        <button className="edit-button" onClick={() => startEditing(schedule)}>Edit</button>
                        <button className="delete-button" onClick={() => deleteSchedule(schedule.id)}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default withAuthenticationRequired(ScheduleManagement, {
  onRedirecting: () => <PageLoader />,
}); 