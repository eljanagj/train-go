import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { withAuthenticationRequired } from '@auth0/auth0-react';
import { PageLoader } from '../../components/PageLoader';
import Sidebar from '../../components/Sidebar';
import { trainService } from '../../services/trainService';
import { seatService } from '../../services/seatService';
import '../../styles/seats.css';
import { 
  FaChair, 
  FaMoneyBillWave, 
  FaTimes, 
  FaInfoCircle, 
  FaPlus, 
  FaWindowMaximize, 
  FaDoorOpen, 
  FaUserFriends,
  FaUndo,
  FaRedo,
  FaCopy,
  FaEye,
  FaDownload
} from 'react-icons/fa';

const SEAT_TYPES = {
  WINDOW: 'window',
  AISLE: 'aisle',
  MIDDLE: 'middle'
};

const COACH_CLASSES = {
  PREMIUM: 'premium',
  BUSINESS: 'business',
  ECONOMY: 'economy'
};

const SEAT_STATUS = {
  AVAILABLE: 'available',
  BLOCKED: 'blocked'
};

const SeatManagement = () => {
  const { trainId } = useParams();
  const navigate = useNavigate();
  const [train, setTrain] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddCoach, setShowAddCoach] = useState(false);
  const [showPriceConfig, setShowPriceConfig] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [priceConfig, setPriceConfig] = useState({
    premium: { window: '', aisle: '', middle: '' },
    business: { window: '', aisle: '', middle: '' },
    economy: { window: '', aisle: '', middle: '' }
  });
  const [newCoach, setNewCoach] = useState({
    class: COACH_CLASSES.ECONOMY,
    rows: 10,
    seatsPerRow: 6,
    startRow: 1
  });

  const [showAddSingleSeat, setShowAddSingleSeat] = useState(false);
  const [newSeat, setNewSeat] = useState({
    class: COACH_CLASSES.ECONOMY,
    seatNumber: '',
  });
  const [newSeatError, setNewSeatError] = useState(null);

  const [addCoachError, setAddCoachError] = useState(null);

  useEffect(() => {
    fetchTrainAndSeats();
  }, [trainId]);

  const fetchTrainAndSeats = async () => {
    try {
      setLoading(true);
      const trainData = await trainService.getTrain(trainId);
      setTrain(trainData);

      const seatsData = await seatService.getAllSeatsForTrain(trainId);
      console.log('Fetched seats data:', seatsData);
      setSeats(seatsData);

      // Populate priceConfig with current prices based on fetched seats
      const currentPriceConfig = {};
      Object.values(COACH_CLASSES).forEach(classType => {
        currentPriceConfig[classType] = {};
        Object.values(SEAT_TYPES).forEach(seatType => {
          // Find the price of the first seat of this class and type to pre-fill the config
          const seat = seatsData.find(s => s.class === classType && s.type === seatType);
          currentPriceConfig[classType][seatType] = seat ? seat.price.toString() : ''; // Convert price to string for input value
        });
      });
      setPriceConfig(currentPriceConfig);

    } catch (err) {
      setError('Failed to load train and seat data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeatsPerRowForClass = (classType) => {
    switch (classType) {
      case COACH_CLASSES.PREMIUM:
      case COACH_CLASSES.BUSINESS:
        return 4;
      case COACH_CLASSES.ECONOMY:
        return 6;
      default:
        return 6;
    }
  };

  const handleAddCoach = async () => {
    try {
      setAddCoachError(null);

      const { class: coachClass, rows: numRows, startRow } = newCoach;

      // Get existing row numbers for the selected class
      const existingRows = new Set(seats
        .filter(seat => seat.class === coachClass)
        .map(seat => seat.row)
      );

      // Check for conflicts with existing rows
      for (let i = 0; i < numRows; i++) {
        const currentRow = startRow + i;
        if (existingRows.has(currentRow)) {
          setAddCoachError(`Row ${currentRow} in ${coachClass.toUpperCase()} class already exists. Please choose a different starting row or fewer rows.`);
          return;
        }
      }

      const seatConfigs = [];
      const seatsPerRow = getSeatsPerRowForClass(newCoach.class);
      const totalSeats = newCoach.rows * seatsPerRow;
      
      for (let i = 0; i < newCoach.rows; i++) {
        const row = newCoach.startRow + i;
        for (let pos = 0; pos < seatsPerRow; pos++) {
          const position = String.fromCharCode(65 + pos); // A, B, C, etc.
          const seatNumber = `${row}${position}`;
          
          let type;
          const positionIndex = pos; // pos is the 0-based index (0 for A, 1 for B, etc.)
          const coachClass = newCoach.class;

          if (coachClass === COACH_CLASSES.ECONOMY) { // Economy class (3+3)
            if (position === 'A' || position === 'F') {
              type = SEAT_TYPES.WINDOW;
            } else if (position === 'C' || position === 'D') {
              type = SEAT_TYPES.AISLE;
            } else if (position === 'B' || position === 'E') {
              type = SEAT_TYPES.MIDDLE;
            }
          } else { // Business/Premium class (2+2)
            if (position === 'A' || position === 'D') {
              type = SEAT_TYPES.WINDOW;
            } else if (position === 'B' || position === 'C'){
              type = SEAT_TYPES.AISLE;
            } // No middle seats in 2+2 layout
          }

          seatConfigs.push({
            seatNumber,
            type,
            class: newCoach.class,
            price: 0,
            location: row <= newCoach.rows / 3 ? 'Front' : row <= (newCoach.rows * 2) / 3 ? 'Middle' : 'Back',
            row,
            position
          });
        }
      }

      await seatService.createSeatsForTrain(trainId, seatConfigs);
      await fetchTrainAndSeats();
      setShowAddCoach(false);
      setNewCoach({
        class: COACH_CLASSES.ECONOMY,
        rows: 10,
        seatsPerRow: 6,
        startRow: 1
      });
    } catch (err) {
      setAddCoachError('Failed to add coach');
      console.error(err);
    }
  };

  const handleSeatClick = (coachId, seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleBulkSeatUpdate = async (updates) => {
    try {
      let seatsToUpdate = [];

      if (updates.status === SEAT_STATUS.BLOCKED) {
        // Filter to only block seats that are currently available
        seatsToUpdate = seats.filter(seat =>
          selectedSeats.includes(seat.id) && seat.status === SEAT_STATUS.AVAILABLE
        );
      } else if (updates.status === SEAT_STATUS.AVAILABLE) {
        // Filter to only unblock seats that are not available
        seatsToUpdate = seats.filter(seat =>
          selectedSeats.includes(seat.id) && seat.status !== SEAT_STATUS.AVAILABLE
        );
      }

      const promises = seatsToUpdate.map(seat =>
        updates.status === SEAT_STATUS.BLOCKED
          ? seatService.reserveSeat(seat.id)
          : seatService.releaseSeat(seat.id)
      );

      if (promises.length === 0) {
        setError('No seats were updated as they were already in the desired state.');
        setSelectedSeats([]); // Clear selection if no seats were eligible for update
        return; // Exit if no updates are needed
      }

      await Promise.all(promises);
      await fetchTrainAndSeats();
      setSelectedSeats([]);
      setError(null);
    } catch (err) {
      setError('Failed to update seats');
      console.error(err);
    }
  };

  const handleDeleteSelectedSeats = async () => {
    if (selectedSeats.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedSeats.length} selected seats?`)) {
      return;
    }
    try {
      const promises = selectedSeats.map(seatId =>
        seatService.deleteSeat(seatId)
      );
      await Promise.all(promises);
      await fetchTrainAndSeats();
      setSelectedSeats([]);
      setError(null);
    } catch (err) {
      setError('Failed to delete seats');
      console.error(err);
    }
  };

  const handlePriceConfigUpdate = async () => {
    try {
      const updates = [];
      seats.forEach(seat => {
        const priceString = priceConfig?.[seat.class]?.[seat.type];
        const price = parseFloat(priceString);

        if (priceString !== undefined && priceString !== null && !isNaN(price)) {
          updates.push(
            seatService.updateSeatPrice(seat.id, price)
          );
        }
      });

      await Promise.all(updates);
      await fetchTrainAndSeats();
      setShowPriceConfig(false);
      setError(null);
    } catch (err) {
      setError('Failed to update prices');
      console.error(err);
    }
  };

  const handleAddSingleSeat = async () => {
    setNewSeatError(null); // Clear previous errors
    const { class: seatClass, seatNumber } = newSeat;

    // Validate seat number format (e.g., 1A, 5B)
    const seatNumberRegex = /^\d+[A-Z]$/;
    if (!seatNumberRegex.test(seatNumber)) {
      setNewSeatError('Invalid seat number format. Please use the format like 1A or 5B.');
      return;
    }

    // Extract row and position from seat number
    const rowMatch = seatNumber.match(/^(\d+)/);
    const positionMatch = seatNumber.match(/([A-Z])$/);

    if (!rowMatch || !positionMatch) {
       setNewSeatError('Invalid seat number format. Could not extract row or position.');
       return;
    }

    const row = parseInt(rowMatch[1], 10);
    const position = positionMatch[1];

    // Check for duplicate seat number within the current train's seats
    const isDuplicate = seats.some(seat => seat.seatNumber === seatNumber && seat.class === seatClass);
    if (isDuplicate) {
      setNewSeatError(`Seat number ${seatNumber} in ${seatClass.toUpperCase()} class already exists.`);
      return;
    }

    try {
      // Determine seat type based on position (assuming standard A, B, C, D, E, F)
      let type = SEAT_TYPES.MIDDLE; // Default to middle
      const positionIndex = position.charCodeAt(0) - 65;
      const seatsPerRow = getSeatsPerRowForClass(seatClass);

      if (seatsPerRow === 6) { // Economy class
        if (position === 'A' || position === 'F') {
          type = SEAT_TYPES.WINDOW;
        } else if (position === 'C' || position === 'D') {
          type = SEAT_TYPES.AISLE;
        } else if (position === 'B' || position === 'E') {
          type = SEAT_TYPES.MIDDLE;
        }
      } else { // Business/Premium class (2+2)
        if (position === 'A' || position === 'D') {
          type = SEAT_TYPES.WINDOW;
        } else {
          type = SEAT_TYPES.AISLE;
        }
      }

      const seatConfig = {
        seatNumber,
        type,
        class: seatClass,
        price: 0, // Default price for a single added seat
        location: row <= (train?.totalRows || 0) / 3 ? 'Front' : row <= ((train?.totalRows || 0) * 2) / 3 ? 'Middle' : 'Back', // Basic location logic
        row,
        position,
      };

      await seatService.createSeatsForTrain(trainId, [seatConfig]); // API expects an array
      await fetchTrainAndSeats(); // Refresh seat data
      setShowAddSingleSeat(false); // Close modal
      setNewSeat({
        class: COACH_CLASSES.ECONOMY,
        seatNumber: '',
      }); // Reset form
    } catch (err) {
      setNewSeatError('Failed to add single seat');
      console.error(err);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  const seatsByClass = seats.reduce((acc, seat) => {
    if (!acc[seat.class]) {
      acc[seat.class] = [];
    }
    acc[seat.class].push(seat);
    return acc;
  }, {
    economy: [],
    business: [],
    premium: []
  });

  Object.keys(seatsByClass).forEach(className => {
    seatsByClass[className].sort((a, b) => {
      const rowCompare = Number(a.row) - Number(b.row);
      return rowCompare !== 0 ? rowCompare : a.position.localeCompare(b.position);
    });
  });

  const classOrder = ['economy', 'business', 'premium'];

  return (
    <>
    <div className="management-page seat-management">
      <Sidebar />
      <div className="management-content">
        <div className="management-header">
          <h1>
            <FaChair className="me-2" />
            Seat Management - {train?.trainName}
          </h1>
          <div className="coach-counts">
            <p>Total Coaches: <strong>{new Set(seats.map(seat => seat.coachId)).size}</strong></p>
            <p>Total Seats: <strong>{seats.length}</strong></p>
          </div>
        </div>

        <div className="header-actions">
          <button
              className="btn btn-primary"
              onClick={() => {
                console.log('Opening modal...');
                setShowAddCoach(true);
              }}
            >
              <FaPlus className="me-2" />
              Add Coach
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddSingleSeat(true)}
            >
              <FaPlus className="me-2" />
              Add Single Seat
            </button>
            <button
              className="btn btn-info"
              onClick={() => setShowPriceConfig(true)}
          >
            <FaMoneyBillWave className="me-2" />
              Configure Prices
            </button>
          <button
            className="btn btn-danger"
            onClick={handleDeleteSelectedSeats}
            disabled={selectedSeats.length === 0}
          >
            <FaTimes className="me-2" />
            Delete Selected
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

          <div className="coaches-container">
            {classOrder.map(classType => {
              // Group seats by row for the current class
              const seatsInClassByRow = seatsByClass[classType]?.reduce((acc, seat) => {
                if (!acc[seat.row]) {
                  acc[seat.row] = [];
                }
                acc[seat.row].push(seat);
                return acc;
              }, {}) || {};

              // Sort rows numerically
              const sortedRowNumbers = Object.keys(seatsInClassByRow).sort((a, b) => Number(a) - Number(b));

              return (
                <div key={classType} className="coach-section" data-class={classType}>
                  <div className="coach-header">
                    <h3>{classType.toUpperCase()} Class</h3>
                    <div className="coach-actions">
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          const seatIdsInClass = seatsByClass[classType].map(seat => seat.id);
                          const availableSeatIdsInClass = seatsByClass[classType].filter(seat => seat.status === SEAT_STATUS.AVAILABLE).map(seat => seat.id);
                          const newSelected = Array.from(new Set([...selectedSeats, ...availableSeatIdsInClass]));
                          setSelectedSeats(newSelected);
                        }}
                      >
                        <FaChair className="me-2" /> Select Available
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          const seatIdsInClass = seatsByClass[classType].map(seat => seat.id);
                          const newSelected = selectedSeats.filter(id => !seatIdsInClass.includes(id));
                          setSelectedSeats(newSelected);
                        }}
                      >
                        <FaTimes className="me-2" /> Deselect All
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleBulkSeatUpdate({ status: SEAT_STATUS.AVAILABLE })}
                        disabled={selectedSeats.length === 0}
                      >
                        <FaUndo className="me-2" />
                        Unblock Selected
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleBulkSeatUpdate({ status: SEAT_STATUS.BLOCKED })}
                        disabled={selectedSeats.length === 0}
                      >
                        <FaRedo className="me-2" />
                        Block Selected
                      </button>
                    </div>
                  </div>
                  <div className="coach-layout"> {/* This will contain rows and aisle */}
                     {/* Aisle label here */}
                    <div className="aisle-label">Aisle</div>
                    
                    {sortedRowNumbers.length > 0 ? (
                      <div className="seat-rows"> {/* Container for all rows */}
                        {sortedRowNumbers.map(rowNum => {
                          const seatsInRow = seatsInClassByRow[rowNum].sort((a, b) => a.position.localeCompare(b.position));
                          
                          // Determine seats per side based on class (assuming 3+3 for economy, 2+2 for others)
                          const seatsPerSide = classType === 'economy' ? 3 : 2;

                          return (
                            <div key={rowNum} className="seat-row"> {/* Container for a single row */}
                              <div className="row-number">{rowNum}</div> {/* Row number */}
                              <div className="row-seats"> {/* Container for seats in the row */}
                                {/* Left side seats */}
                                <div className="seat-group left">
                                  {seatsInRow.slice(0, seatsPerSide).map(seat => (
                                    <span
                                      key={seat.id}
                                      className={`seat-name ${selectedSeats.includes(seat.id) ? 'selected' : ''} ${seat.status !== SEAT_STATUS.AVAILABLE ? 'blocked' : 'available'}`}
                                      onClick={() => handleSeatClick(null, seat.id)}
                                      data-row={seat.row}
                                      title={`Row ${seat.row}, ${seat.type} seat`}
                                    >
                                      {seat.seatNumber}
                                    </span>
                                  ))}
                                </div>

                                {/* Aisle */}
                                <div className="row-aisle"></div>

                                {/* Right side seats */}
                                <div className="seat-group right">
                                  {seatsInRow.slice(seatsPerSide).map(seat => (
                                    <span
                                      key={seat.id}
                                      className={`seat-name ${selectedSeats.includes(seat.id) ? 'selected' : ''} ${seat.status !== SEAT_STATUS.AVAILABLE ? 'blocked' : 'available'}`}
                                      onClick={() => handleSeatClick(null, seat.id)}
                                      data-row={seat.row}
                                      title={`Row ${seat.row}, ${seat.type} seat`}
                                    >
                                      {seat.seatNumber}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="no-seats-message">No seats available</div>
                    )}
                  </div>
                </div>
              );
            })}
            {new Set(seats.map(seat => seat.coachId)).size === 0 && !loading && !error && (
              <div className="no-coaches-message">No coaches or seats available for this train. Add a coach above!</div>
            )}
          </div>
        </div>
        </div>

      {showAddCoach && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '500px',
              position: 'relative',
              zIndex: 10000
            }}
          >
              <button
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1
              }}
              onClick={() => {
                console.log('Closing modal...');
                setShowAddCoach(false);
                setAddCoachError(null);
              }}
              >
                <FaTimes />
              </button>
            <h3>Add New Coach</h3>
            {addCoachError && (
              <div className="alert alert-danger" role="alert">
                {addCoachError}
              </div>
            )}
            <div className="form-group">
              <label>Class</label>
              <select
                value={newCoach.class}
                onChange={(e) => {
                  const classType = e.target.value;
                  setNewCoach(prev => ({
                    ...prev,
                    class: classType,
                    seatsPerRow: getSeatsPerRowForClass(classType)
                  }));
                }}
              >
                {Object.entries(COACH_CLASSES).map(([key, value]) => (
                  <option key={value} value={value}>{key}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Number of Rows</label>
              <input
                type="number"
                value={newCoach.rows}
                onChange={(e) => setNewCoach(prev => ({ ...prev, rows: parseInt(e.target.value) }))}
                min="1"
                max="20"
              />
            </div>
            <div className="form-group">
              <label>Starting Row Number</label>
              <input
                type="number"
                value={newCoach.startRow}
                onChange={(e) => setNewCoach(prev => ({ ...prev, startRow: parseInt(e.target.value) }))}
                min="1"
                max="100"
              />
            </div>
            <div className="form-group">
              <label>Seats per Row</label>
              <input
                type="number"
                value={newCoach.seatsPerRow}
                disabled
                className="disabled-input"
              />
            </div>
              <button
                className="btn btn-primary"
              onClick={() => {
                console.log('Adding coach...');
                handleAddCoach();
              }}
            >
              Add Coach
              </button>
            </div>
          </div>
        )}

      {showAddSingleSeat && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '400px',
              position: 'relative',
              zIndex: 10000
            }}
          >
            <button
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1
              }}
              onClick={() => {
                setShowAddSingleSeat(false);
                setNewSeatError(null);
                setNewSeat({
                  class: COACH_CLASSES.ECONOMY,
                  seatNumber: '',
                });
              }}
            >
              <FaTimes />
            </button>
            <h3>Add Single Seat</h3>
            {newSeatError && (
              <div className="alert alert-danger" role="alert">
                {newSeatError}
              </div>
            )}
            <div className="form-group">
              <label>Class</label>
              <select
                value={newSeat.class}
                onChange={(e) => setNewSeat(prev => ({ ...prev, class: e.target.value }))}
              >
                {Object.entries(COACH_CLASSES).map(([key, value]) => (
                  <option key={value} value={value}>{key}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Seat Number (e.g., 1A, 5B)</label>
              <input
                type="text"
                value={newSeat.seatNumber}
                onChange={(e) => setNewSeat(prev => ({ ...prev, seatNumber: e.target.value.toUpperCase() }))}
                placeholder="e.g., 1A"
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleAddSingleSeat}
            >
              Add Seat
            </button>
          </div>
        </div>
      )}

      {showPriceConfig && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '750px',
              position: 'relative',
              zIndex: 10000
            }}
          >
            <button
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '0.25rem',
                lineHeight: 1
              }}
              onClick={() => setShowPriceConfig(false)}
            >
              <FaTimes />
            </button>
            <h3>Price Configuration</h3>
            <div className="price-table">
              <table>
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Window</th>
                    <th>Aisle</th>
                    {Object.values(COACH_CLASSES).some(classType => getSeatsPerRowForClass(classType) > 4) && (
                      <th>Middle</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(COACH_CLASSES).map(([key, value]) => (
                    <tr key={value}>
                      <td>{key}</td>
                      <td>
                        <input
                          type="number"
                          value={priceConfig[value]?.window || ''}
                          onChange={(e) => setPriceConfig(prev => ({
                            ...prev,
                            [value]: { ...prev[value], window: e.target.value }
                          }))}
                          placeholder="Price"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={priceConfig[value]?.aisle || ''}
                          onChange={(e) => setPriceConfig(prev => ({
                            ...prev,
                            [value]: { ...prev[value], aisle: e.target.value }
                          }))}
                          placeholder="Price"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      {getSeatsPerRowForClass(value) > 4 && (
                        <td>
                          <input
                            type="number"
                            value={priceConfig[value]?.middle || ''}
                            onChange={(e) => setPriceConfig(prev => ({
                              ...prev,
                              [value]: { ...prev[value], middle: e.target.value }
                            }))}
                            placeholder="Price"
                            min="0"
                            step="0.01"
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              className="btn btn-primary"
              onClick={handlePriceConfigUpdate}
            >
              Update Prices
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default withAuthenticationRequired(SeatManagement, {
  onRedirecting: () => <PageLoader />,
}); 