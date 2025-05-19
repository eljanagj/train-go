import React, { useState, useEffect } from 'react';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { PageLoader } from '../components/PageLoader';
import Sidebar from '../components/Sidebar';
import { trainService } from '../services/trainService';
import '../styles/management.css';
import { FaTrain, FaEdit, FaTrash, FaPlus, FaChair } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const TRAIN_STATUS = {
  ACTIVE: 'ACTIVE',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED: 'ARRIVED',
  DELAYED: 'DELAYED',
  MAINTENANCE: 'MAINTENANCE',
  DECOMMISSIONED: 'DECOMMISSIONED',
};

const TrainManagement = ({ theme, toggleTheme }) => {
  const [trains, setTrains] = useState([]);
  const [newTrain, setNewTrain] = useState({
    trainName: '',
    model: '',
    manufacturer: '',
    productionYear: '',
    status: TRAIN_STATUS.ACTIVE
  });
  const [editingTrain, setEditingTrain] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrains();
  }, []);

  const fetchTrains = async () => {
    try {
      const data = await trainService.getAllTrains();
      setTrains(data);
    } catch (error) {
      console.error('Error fetching trains:', error);
    }
  };

  const createTrain = async () => {
    try {
      await trainService.createTrain(newTrain);
      fetchTrains();
      setNewTrain({ 
        trainName: '',
        model: '',
        manufacturer: '',
        productionYear: '',
        status: TRAIN_STATUS.ACTIVE
      });
    } catch (error) {
      console.error('Error creating train:', error);
    }
  };

  const updateTrain = async (trainID) => {
    if (!trainID) {
      console.error('No train ID provided for update');
      return;
    }
    try {
      const { trainID: id, createdAt, updatedAt, schedules, status, totalCapacity, availableSeats, ...updateData } = editingTrain;
      
      // Ensure all number fields are actually numbers
      const finalUpdateData = {
        ...updateData,
        productionYear: typeof updateData.productionYear === 'string' ? parseInt(updateData.productionYear, 10) : updateData.productionYear,
      };

      await trainService.updateTrain(trainID, finalUpdateData);

      // Then, if status has changed, update it separately
      const originalTrain = trains.find(t => t.trainID === trainID);
      if (originalTrain && originalTrain.status !== editingTrain.status) {
        await trainService.updateTrainStatus(trainID, editingTrain.status);
      }

      setEditingTrain(null);
      fetchTrains();
    } catch (error) {
      console.error('Error updating train:', error);
    }
  };

  const deleteTrain = async (trainID) => {
    if (!trainID) {
      console.error('No train ID provided for deletion');
      return;
    }
    try {
      await trainService.deleteTrain(trainID);
      fetchTrains();
    } catch (error) {
      console.error('Error deleting train:', error);
    }
  };

  const startEditing = (train) => {
    setEditingTrain({ ...train });
  };

  const cancelEditing = () => {
    setEditingTrain(null);
  };

  const handleManageSeats = (trainId) => {
    navigate(`/trains/${trainId}/seats`);
  };

  return (
    <div className="page-container">
      <Sidebar theme={theme} onToggleTheme={toggleTheme} />
      <div className="management-page">
        <h1>Train Management</h1>
        
        {/* Add Train Form */}
        <div className="management-form">
          <h2>Add New Train</h2>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Train Name"
              value={newTrain.trainName}
              onChange={(e) => setNewTrain({ ...newTrain, trainName: e.target.value })}
            />
            <input
              type="text"
              placeholder="Train Model"
              value={newTrain.model}
              onChange={(e) => setNewTrain({ ...newTrain, model: e.target.value })}
            />
            <input
              type="text"
              placeholder="Manufacturer"
              value={newTrain.manufacturer}
              onChange={(e) => setNewTrain({ ...newTrain, manufacturer: e.target.value })}
            />
            <input
              type="number"
              placeholder="Production Year"
              value={newTrain.productionYear}
              onChange={(e) => setNewTrain({ ...newTrain, productionYear: e.target.value ? parseInt(e.target.value, 10) : '' })}
            />
            <select
              value={newTrain.status}
              onChange={(e) => setNewTrain({ ...newTrain, status: e.target.value })}
            >
              {Object.entries(TRAIN_STATUS).map(([key, value]) => (
                <option key={key} value={value}>
                  {key.replace('_', ' ')}
                </option>
              ))}
            </select>
            <button className="add-button" onClick={createTrain}>Add Train</button>
          </div>
        </div>

        {/* Trains Table */}
        <div className="management-table-container">
          <h2>Existing Trains</h2>
          <table className="management-table">
            <thead>
              <tr>
                <th>Train Name</th>
                <th>Model</th>
                <th>Manufacturer</th>
                <th>Production Year</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trains.map((train) => (
                <tr key={train.trainID}>
                  {editingTrain && editingTrain.trainID === train.trainID ? (
                    <>
                      <td>
                        <input
                          type="text"
                          value={editingTrain.trainName}
                          onChange={(e) => setEditingTrain({ ...editingTrain, trainName: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingTrain.model}
                          onChange={(e) => setEditingTrain({ ...editingTrain, model: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={editingTrain.manufacturer}
                          onChange={(e) => setEditingTrain({ ...editingTrain, manufacturer: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={editingTrain.productionYear}
                          onChange={(e) => setEditingTrain({ ...editingTrain, productionYear: parseInt(e.target.value, 10) })}
                        />
                      </td>
                      <td>
                        <select
                          value={editingTrain.status}
                          onChange={(e) => setEditingTrain({ ...editingTrain, status: e.target.value })}
                        >
                          {Object.entries(TRAIN_STATUS).map(([key, value]) => (
                            <option key={key} value={value}>
                              {key.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="action-buttons">
                        <button className="save-button" onClick={() => updateTrain(train.trainID)}>Save</button>
                        <button className="cancel-button" onClick={cancelEditing}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{train.trainName}</td>
                      <td>{train.model}</td>
                      <td>{train.manufacturer}</td>
                      <td>{train.productionYear}</td>
                      <td>{train.status}</td>
                      <td className="action-buttons">
                        <button className="edit-button" onClick={() => startEditing(train)}>Edit</button>
                        <button className="delete-button" onClick={() => deleteTrain(train.trainID)}>Delete</button>
                        <button 
                          className="seat-button"
                          onClick={() => handleManageSeats(train.trainID)}
                        >
                          <FaChair className="me-1" />
                          Seats
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
    </div>
  );
};

export default withAuthenticationRequired(TrainManagement, {
  onRedirecting: () => <PageLoader />,
}); 