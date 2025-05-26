import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { PageLoader } from '../../components/PageLoader';
import Sidebar from '../../components/Sidebar';
import { trainService } from '../../services/trainService';
import { seatService } from '../../services/seatService';
import '../../styles/seats.css';
import { FaChair, FaPlus, FaTrash, FaTrain, FaTimes, FaSave, FaMoneyBillWave, FaEdit } from 'react-icons/fa';

const SEAT_TYPES = {
  WINDOW: 'window',
  AISLE: 'aisle',
  PREMIUM: 'premium',
  ECONOMY: 'economy',
  BUSINESS: 'business'
};

const SEAT_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  OCCUPIED: 'occupied'
};

const LOCATIONS = ['Front', 'Middle', 'Back'];

const SEAT_LIMITS = {
  Front: {
    business: 4,
    premium: 4,
    economy: 12
  },
  Middle: {
    business: 4,
    premium: 4,
    economy: 12
  },
  Back: {
    business: 4,
    premium: 4,
    economy: 12
  }
};

// Generate predefined seats for each section
const generatePredefinedSeats = () => {
  const seats = [];
  const rows = 10; // Number of rows per section

  LOCATIONS.forEach(location => {
    for (let row = 1; row <= rows; row++) {
      // Business Class (2-2 configuration)
      if (row <= 2) {
        seats.push({
          seatNumber: `B${row}W`,
          type: SEAT_TYPES.BUSINESS,
          location: location,
          status: SEAT_STATUS.AVAILABLE,
          price: null,
          row: row,
          position: 'left'
        });
        seats.push({
          seatNumber: `B${row}A`,
          type: SEAT_TYPES.BUSINESS,
          location: location,
          status: SEAT_STATUS.AVAILABLE,
          price: null,
          row: row,
          position: 'right'
        });
      }
      // Premium Class (2-2 configuration)
      else if (row <= 4) {
        seats.push({
          seatNumber: `P${row}W`,
          type: SEAT_TYPES.PREMIUM,
          location: location,
          status: SEAT_STATUS.AVAILABLE,
          price: null,
          row: row,
          position: 'left'
        });
        seats.push({
          seatNumber: `P${row}A`,
          type: SEAT_TYPES.PREMIUM,
          location: location,
          status: SEAT_STATUS.AVAILABLE,
          price: null,
          row: row,
          position: 'right'
        });
      }
      // Economy Class (3-3 configuration)
      else {
        // Left side (3 seats)
        seats.push({
          seatNumber: `E${row}WL`,
          type: SEAT_TYPES.WINDOW,
          location: location,
          status: SEAT_STATUS.AVAILABLE,
          price: null,
          row: row,
          position: 'left'
        });
        seats.push({
          seatNumber: `E${row}ML`,
          type: SEAT_TYPES.AISLE,
          location: location,
          status: SEAT_STATUS.AVAILABLE,
          price: null,
          row: row,
          position: 'left'
        });
        seats.push({
          seatNumber: `E${row}AL`,
          type: SEAT_TYPES.AISLE,
          location: location,
          status: SEAT_STATUS.AVAILABLE,
          price: null,
          row: row,
          position: 'left'
        });
        // Right side (3 seats)
        seats.push({
          seatNumber: `E${row}WR`,
          type: SEAT_TYPES.WINDOW,
          location: location,
          status: SEAT_STATUS.AVAILABLE,
          price: null,
          row: row,
          position: 'right'
        });
        seats.push({
          seatNumber: `E${row}MR`,
          type: SEAT_TYPES.AISLE,
          location: location,
          status: SEAT_STATUS.AVAILABLE,
          price: null,
          row: row,
          position: 'right'
        });
        seats.push({
          seatNumber: `E${row}AR`,
          type: SEAT_TYPES.AISLE,
          location: location,
          status: SEAT_STATUS.AVAILABLE,
          price: null,
          row: row,
          position: 'right'
        });
      }
    }
  });

  return seats;
};

const SeatManagement = () => {
  const { trainId } = useParams();
  const navigate = useNavigate();
  const [train, setTrain] = useState(null);
  const [existingSeats, setExistingSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [showPricePopup, setShowPricePopup] = useState(false);
  const [price, setPrice] = useState('');
  const [showBulkPricePopup, setShowBulkPricePopup] = useState(false);
  const [bulkPrice, setBulkPrice] = useState('');
  const [selectedSeatType, setSelectedSeatType] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [availableSeats, setAvailableSeats] = useState({
    Front: { business: 4, premium: 4, economy: 12 },
    Middle: { business: 4, premium: 4, economy: 12 },
    Back: { business: 4, premium: 4, economy: 12 }
  });
  const [editingSeat, setEditingSeat] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  
  const predefinedSeats = generatePredefinedSeats();

  useEffect(() => {
    fetchTrainAndSeats();
  }, [trainId]);

  useEffect(() => {
    if (existingSeats.length > 0) {
      // Calculate remaining seats for each section and type (for adding seats)
      const remaining = { ...SEAT_LIMITS };
      existingSeats.forEach(seat => {
        if (remaining[seat.location] && remaining[seat.location][seat.type]) {
          remaining[seat.location][seat.type]--;
        }
      });
      setAvailableSeats(remaining);
    }
  }, [existingSeats]);

  const fetchTrainAndSeats = async () => {
    try {
      setLoading(true);
      const [trainData, seatsData] = await Promise.all([
        trainService.getTrain(trainId),
        seatService.getAllSeatsForTrain(trainId)
      ]);
      setTrain(trainData);
      setExistingSeats(seatsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch train and seats data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    const existingSeat = existingSeats.find(s => 
      s.seatNumber === seat.seatNumber && 
      s.location === seat.location
    );

    if (existingSeat) {
      setSelectedSeat(existingSeat);
    } else {
      setSelectedSeat(seat);
    }
    setPrice('');
    setShowPricePopup(true);
  };

  const handleAddSeat = async () => {
    if (!price) return;

    try {
      const seatData = {
        ...selectedSeat,
        price: parseFloat(price)
      };
      await seatService.createSeatsForTrain(trainId, [seatData]);
      setShowPricePopup(false);
      await fetchTrainAndSeats();
    } catch (err) {
      setError('Failed to add seat');
      console.error('Error adding seat:', err);
    }
  };

  const handleDeleteSeat = async (seatId) => {
    if (!seatId) {
      setError('Invalid seat ID');
      return;
    }

    if (window.confirm('Are you sure you want to delete this seat?')) {
      try {
        setLoading(true);
        await seatService.deleteSeat(seatId);
        await fetchTrainAndSeats(); // Refresh the seats list
        setError(null);
      } catch (err) {
        setError('Failed to delete seat: ' + (err.message || 'Unknown error'));
        console.error('Error deleting seat:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkPriceSubmit = async () => {
    if (!bulkPrice || !quantity || !selectedSeatType || !selectedLocation) return;

    const quantityNum = parseInt(quantity);
    const available = availableSeats[selectedLocation][selectedSeatType];

    if (quantityNum > available) {
      setError(`Only ${available} ${selectedSeatType} seats available in ${selectedLocation} section`);
      return;
    }

    try {
      const seatsToAdd = predefinedSeats
        .filter(seat => {
          const existingSeat = existingSeats.find(s => 
            s.seatNumber === seat.seatNumber && 
            s.location === seat.location
          );
          
          return !existingSeat && 
                 seat.type === selectedSeatType && 
                 seat.location === selectedLocation;
        })
        .slice(0, quantityNum)
        .map(seat => ({
          ...seat,
          price: parseFloat(bulkPrice)
        }));

      if (seatsToAdd.length > 0) {
        await seatService.createSeatsForTrain(trainId, seatsToAdd);
        setShowBulkPricePopup(false);
        setBulkPrice('');
        setQuantity('');
        await fetchTrainAndSeats();
      }
    } catch (err) {
      setError('Failed to add seats');
      console.error('Error adding seats:', err);
    }
  };

  const handleEditClick = (seat) => {
    setEditingSeat(seat);
    setEditPrice(seat.price.toString());
  };

  const handlePriceUpdate = async () => {
    try {
      await seatService.updateSeatPrice(editingSeat.id, parseFloat(editPrice));
      setEditingSeat(null);
      setEditPrice('');
      fetchTrainAndSeats(); // Refresh the seat list
    } catch (error) {
      console.error('Error updating seat price:', error);
      alert('Failed to update seat price');
    }
  };

  const renderTrainLayout = () => {
    const seatsByLocation = predefinedSeats.reduce((acc, seat) => {
      if (!acc[seat.location]) {
        acc[seat.location] = {};
      }
      if (!acc[seat.location][seat.row]) {
        acc[seat.location][seat.row] = [];
      }
      acc[seat.location][seat.row].push(seat);
      return acc;
    }, {});

    return (
      <div className="train-layout">
        <div className="train-header">
          <FaTrain className="train-icon" />
          <h3>{train?.trainName} - Seat Layout</h3>
        </div>
        {LOCATIONS.map(location => (
          <div key={location} className="train-section">
            <h4>{location} Section</h4>
            <div className="train-rows">
              {Object.entries(seatsByLocation[location] || {}).map(([row, rowSeats]) => (
                <div key={row} className="train-row">
                  <div className="row-number">{row}</div>
                  <div className="row-seats">
                    <div className="seat-group left">
                      {rowSeats.filter(seat => seat.position === 'left').map(seat => {
                        const existingSeat = existingSeats.find(s => 
                          s.seatNumber === seat.seatNumber && 
                          s.location === seat.location
                        );
                        return (
                          <div
                            key={`${seat.location}-${seat.seatNumber}-${seat.position}`}
                            className={`seat ${seat.type} ${existingSeat ? existingSeat.status : ''}`}
                            onClick={() => handleSeatClick(seat)}
                            title={existingSeat ? 
                              `${seat.seatNumber} - ${seat.type} - $${existingSeat.price}` :
                              `Click to add ${seat.seatNumber} - ${seat.type}`
                            }
                          >
                            <FaChair />
                            <span>{seat.seatNumber}</span>
                            {existingSeat && (
                              <>
                                <span className="seat-price">${existingSeat.price}</span>
                                <div className="seat-actions">
                                  <button
                                    className="edit-button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(existingSeat);
                                    }}
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    className="delete-button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSeat(existingSeat.id);
                                    }}
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="aisle"></div>
                    <div className="seat-group right">
                      {rowSeats.filter(seat => seat.position === 'right').map(seat => {
                        const existingSeat = existingSeats.find(s => 
                          s.seatNumber === seat.seatNumber && 
                          s.location === seat.location
                        );
                        return (
                          <div
                            key={`${seat.location}-${seat.seatNumber}-${seat.position}`}
                            className={`seat ${seat.type} ${existingSeat ? existingSeat.status : ''}`}
                            onClick={() => handleSeatClick(seat)}
                            title={existingSeat ? 
                              `${seat.seatNumber} - ${seat.type} - $${existingSeat.price}` :
                              `Click to add ${seat.seatNumber} - ${seat.type}`
                            }
                          >
                            <FaChair />
                            <span>{seat.seatNumber}</span>
                            {existingSeat && (
                              <>
                                <span className="seat-price">${existingSeat.price}</span>
                                <div className="seat-actions">
                                  <button
                                    className="edit-button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(existingSeat);
                                    }}
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    className="delete-button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSeat(existingSeat.id);
                                    }}
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderBulkPricePopup = () => (
    <div className="price-popup-overlay">
      <div className="price-popup">
        <button 
          className="close-button"
          onClick={() => setShowBulkPricePopup(false)}
        >
          <FaTimes />
        </button>
        <h3>Add Bulk Seat Prices</h3>
        <div className="bulk-price-form">
          <div className="form-group">
            <label>Seat Type:</label>
            <select 
              value={selectedSeatType} 
              onChange={(e) => setSelectedSeatType(e.target.value)}
            >
              <option value="">Select Type</option>
              <option value={SEAT_TYPES.BUSINESS}>Business</option>
              <option value={SEAT_TYPES.PREMIUM}>Premium</option>
              <option value={SEAT_TYPES.WINDOW}>Window</option>
              <option value={SEAT_TYPES.AISLE}>Aisle</option>
            </select>
          </div>
          <div className="form-group">
            <label>Location:</label>
            <select 
              value={selectedLocation} 
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              <option value="">Select Location</option>
              {LOCATIONS.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          {selectedSeatType && selectedLocation && (
            <div className="available-seats-info">
              <p>Available seats: {availableSeats[selectedLocation][selectedSeatType]}</p>
            </div>
          )}
          <div className="form-group">
            <label>Quantity:</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              min="1"
              max={selectedSeatType && selectedLocation ? availableSeats[selectedLocation][selectedSeatType] : 1}
            />
          </div>
          <div className="form-group">
            <label>Price ($):</label>
            <input
              type="number"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              placeholder="Enter price"
              min="0"
              step="0.01"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={handleBulkPriceSubmit}
            disabled={!bulkPrice || !quantity || !selectedSeatType || !selectedLocation}
          >
            <FaSave className="me-2" />
            Add Seats
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="management-page seat-management">
      <Sidebar />
      <div className="management-content">
        <div className="management-header">
          <h1>
            <FaChair className="me-2" />
            Seat Management - {train?.trainName}
          </h1>
          {/* Display total and available seats from train object*/}
          <div className="seat-counts">
            <p>Total Seats: <strong>{train?.totalCapacity}</strong></p>
            <p>Available: <strong style={{ color: '#198754' }}>{train?.availableSeats}</strong></p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary me-2"
            onClick={() => setShowBulkPricePopup(true)}
          >
            <FaMoneyBillWave className="me-2" />
            Bulk Add Prices
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/admin/trains')}
          >
            Back to Trains
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="train-layout-container">
          {renderTrainLayout()}
        </div>

        {showPricePopup && selectedSeat && (
          <div className="price-popup-overlay">
            <div className="price-popup">
              <button 
                className="close-button"
                onClick={() => setShowPricePopup(false)}
              >
                <FaTimes />
              </button>
              <h3>Add Seat Price</h3>
              <div className="seat-info">
                <p>Seat: {selectedSeat.seatNumber}</p>
                <p>Type: {selectedSeat.type}</p>
                <p>Location: {selectedSeat.location}</p>
              </div>
              <div className="price-input">
                <label>Price ($):</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price"
                  min="0"
                  step="0.01"
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleAddSeat}
                disabled={!price}
              >
                Add Seat
              </button>
            </div>
          </div>
        )}

        {showBulkPricePopup && renderBulkPricePopup()}

        <div className="table-responsive mt-4">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Seat Number</th>
                <th>Type</th>
                <th>Price</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {existingSeats.map((seat) => (
                <tr key={seat.id}>
                  <td>{seat.seatNumber}</td>
                  <td>{seat.type}</td>
                  <td>${seat.price}</td>
                  <td>{seat.location}</td>
                  <td>
                    <span className={`badge bg-${seat.status === SEAT_STATUS.AVAILABLE ? 'success' : 'warning'}`}>
                      {seat.status}
                    </span>
                  </td>
                  <td>
                    <div className="seat-actions">
                      <button
                        className="edit-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(seat);
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSeat(seat.id);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingSeat && (
          <div className="price-popup-overlay">
            <div className="price-popup">
              <button className="close-button" onClick={() => setEditingSeat(null)}>
                <FaTimes />
              </button>
              <h3>Edit Seat Price</h3>
              <div className="seat-info">
                <p>Seat Number: {editingSeat.seatNumber}</p>
                <p>Type: {editingSeat.type}</p>
                <p>Location: {editingSeat.location}</p>
              </div>
              <div className="price-input">
                <label>New Price:</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <button className="submit-button" onClick={handlePriceUpdate}>
                Update Price
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default withAuthenticationRequired(SeatManagement, {
  onRedirecting: () => <PageLoader />,
}); 