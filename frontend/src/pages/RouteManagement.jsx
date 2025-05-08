import React, { useState, useEffect } from 'react';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { PageLoader } from '../components/PageLoader';
import Sidebar from '../components/Sidebar';
import { routeService } from '../services/routeService';
import '../styles/management.css';

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [newRoute, setNewRoute] = useState({
    departureStation: '',
    arrivalStation: '',
    price: ''
  });
  const [editingRoute, setEditingRoute] = useState(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const data = await routeService.getAllRoutes();
      setRoutes(data);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const createRoute = async () => {
    try {
      const routeData = {
        departureStation: newRoute.departureStation,
        arrivalStation: newRoute.arrivalStation,
        price: parseFloat(newRoute.price)
      };
      await routeService.createRoute(routeData);
      fetchRoutes();
      setNewRoute({
        departureStation: '',
        arrivalStation: '',
        price: ''
      });
    } catch (error) {
      console.error('Error creating route:', error);
    }
  };

  const updateRoute = async (id) => {
    if (!id) {
      console.error('No route ID provided for update');
      return;
    }
    try {
      const { id: routeId, createdAt, updatedAt, schedules, ...updateData } = editingRoute;
      const finalUpdateData = {
        departureStation: updateData.departureStation,
        arrivalStation: updateData.arrivalStation,
        price: parseFloat(updateData.price)
      };
      await routeService.updateRoute(id, finalUpdateData);
      setEditingRoute(null);
      fetchRoutes();
    } catch (error) {
      console.error('Error updating route:', error);
    }
  };

  const deleteRoute = async (id) => {
    if (!id) {
      console.error('No route ID provided for deletion');
      return;
    }
    try {
      await routeService.deleteRoute(id);
      fetchRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  const startEditing = (route) => {
    setEditingRoute({ ...route });
  };

  const cancelEditing = () => {
    setEditingRoute(null);
  };

  return (
    <div className="page-container">
      <Sidebar />
      <div className="management-page">
        <h1>Route Management</h1>
        
        <div className="management-form">
          <h2>Add New Route</h2>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Departure Station"
              value={newRoute.departureStation}
              onChange={(e) => setNewRoute({ ...newRoute, departureStation: e.target.value })}
            />
            <input
              type="text"
              placeholder="Arrival Station"
              value={newRoute.arrivalStation}
              onChange={(e) => setNewRoute({ ...newRoute, arrivalStation: e.target.value })}
            />
            <input
              type="number"
              placeholder="Price"
              value={newRoute.price}
              onChange={(e) => setNewRoute({ ...newRoute, price: e.target.value })}
              step="0.01"
            />
            <button className="add-button" onClick={createRoute}>Add Route</button>
          </div>
        </div>

        <div className="management-table-container">
          <h2>Existing Routes</h2>
          <table className="management-table">
            <thead>
              <tr>
                <th>Departure</th>
                <th>Arrival</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id}>
                  {editingRoute && editingRoute.id === route.id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          value={editingRoute.departureStation}
                          onChange={(e) => setEditingRoute({ ...editingRoute, departureStation: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingRoute.arrivalStation}
                          onChange={(e) => setEditingRoute({ ...editingRoute, arrivalStation: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editingRoute.price}
                          onChange={(e) => setEditingRoute({ ...editingRoute, price: e.target.value })}
                          step="0.01"
                        />
                      </td>
                      <td className="action-buttons">
                        <button className="save-button" onClick={() => updateRoute(route.id)}>Save</button>
                        <button className="cancel-button" onClick={cancelEditing}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{route.departureStation}</td>
                      <td>{route.arrivalStation}</td>
                      <td>${route.price}</td>
                      <td className="action-buttons">
                        <button className="edit-button" onClick={() => startEditing(route)}>Edit</button>
                        <button className="delete-button" onClick={() => deleteRoute(route.id)}>Delete</button>
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

export default withAuthenticationRequired(RouteManagement, {
  onRedirecting: () => <PageLoader />,
}); 