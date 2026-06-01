import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { withAuthenticationRequired } from "@auth0/auth0-react";
import { PageLoader } from "../../components/PageLoader";
import Sidebar from "../../components/Sidebar";
import { trainService } from "../../services/trainService";
import { seatService } from "../../services/seatService";
import { scheduleService } from "../../services/scheduleService";
import "../../styles/seats.css";
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
  FaDownload,
  FaCalendarAlt,
  FaClock,
  FaCheckDouble,
} from "react-icons/fa";
import SearchBar from "../../components/SearchBar";

const SEAT_TYPES = {
  WINDOW: "window",
  AISLE: "aisle",
  MIDDLE: "middle",
};

const COACH_CLASSES = {
  PREMIUM: "premium",
  BUSINESS: "business",
  ECONOMY: "economy",
};

const SEAT_STATUS = {
  AVAILABLE: "available",
  BLOCKED: "blocked",
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
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [priceConfig, setPriceConfig] = useState({
    premium: { window: "", aisle: "", middle: "" },
    business: { window: "", aisle: "", middle: "" },
    economy: { window: "", aisle: "", middle: "" },
  });
  const [newCoach, setNewCoach] = useState({
    class: COACH_CLASSES.ECONOMY,
    rows: 10,
    seatsPerRow: 6,
    startRow: 1,
  });

  const [showAddSingleSeat, setShowAddSingleSeat] = useState(false);
  const [newSeat, setNewSeat] = useState({
    class: COACH_CLASSES.ECONOMY,
    seatNumber: "",
  });
  const [newSeatError, setNewSeatError] = useState(null);

  const [addCoachError, setAddCoachError] = useState(null);
  const [isSavingSeats, setIsSavingSeats] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTrainAndSeats({ showPageLoader: true });
    fetchSchedules();
  }, [trainId]);

  const fetchSchedules = async () => {
    try {
      const data = await scheduleService.getSchedulesByTrain(trainId);
      setSchedules(data);
      if (data.length > 0) {
        setSelectedSchedule(data[0]);
      }
    } catch (err) {
      console.error("Error fetching schedules:", err);
    }
  };

  const fetchTrainAndSeats = async ({ showPageLoader = false } = {}) => {
    try {
      if (showPageLoader) setLoading(true);
      const trainData = await trainService.getTrain(trainId);
      setTrain(trainData);

      const seatsData = selectedSchedule
        ? await seatService.getSeatDetails(
            trainId,
            selectedDate,
            selectedSchedule.departureTime
          )
        : await seatService.getSeatDetails(trainId);

      setSeats(
        Object.entries(seatsData || {}).map(([seatNumber, config]) => ({
          seatNumber,
          ...config,
        }))
      );

      // Populate priceConfig with current prices based on fetched seats
      const currentPriceConfig = {};
      Object.values(COACH_CLASSES).forEach((classType) => {
        currentPriceConfig[classType] = {};
        Object.values(SEAT_TYPES).forEach((seatType) => {
          // Find the price of the first seat of this class and type to pre-fill the config
          const seat = seats.find(
            (s) => s.class === classType && s.type === seatType
          );
          currentPriceConfig[classType][seatType] = seat
            ? seat.price.toString()
            : ""; // Convert price to string for input value
        });
      });
      setPriceConfig(currentPriceConfig);
    } catch (err) {
      setError("Failed to load train and seat data");
      console.error(err);
    } finally {
      if (showPageLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSchedule) {
      fetchTrainAndSeats();
    }
  }, [selectedDate, selectedSchedule?.id]);

  const renderModal = (open, onClose, children, maxWidth = 500) => {
    if (!open) return null;
    return createPortal(
      <div
        className="seat-modal-overlay"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="seat-modal-content"
          style={{ maxWidth }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>,
      document.body
    );
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

  const resolveSeatType = (coachClass, seatLetter) => {
    if (coachClass === COACH_CLASSES.ECONOMY) {
      if (seatLetter === "A" || seatLetter === "F") return SEAT_TYPES.WINDOW;
      if (seatLetter === "C" || seatLetter === "D") return SEAT_TYPES.AISLE;
      if (seatLetter === "B" || seatLetter === "E") return SEAT_TYPES.MIDDLE;
    } else {
      if (seatLetter === "A" || seatLetter === "D") return SEAT_TYPES.WINDOW;
      if (seatLetter === "B" || seatLetter === "C") return SEAT_TYPES.AISLE;
    }
    return SEAT_TYPES.MIDDLE;
  };

  const handleAddCoach = async () => {
    setAddCoachError(null);

    const coachClass = newCoach.class;
    const numRows = Number(newCoach.rows);
    const startRow = Number(newCoach.startRow);

    if (!Number.isFinite(numRows) || numRows < 1) {
      setAddCoachError("Enter a valid number of rows (at least 1).");
      return;
    }
    if (!Number.isFinite(startRow) || startRow < 1) {
      setAddCoachError("Enter a valid starting row (at least 1).");
      return;
    }

    const seatsPerRow = getSeatsPerRowForClass(coachClass);
    const coachPrefix = coachClass.charAt(0).toUpperCase();
    const existingSeatNumbers = new Set(seats.map((s) => s.seatNumber));
    const seatConfigs = [];

    for (let i = 0; i < numRows; i++) {
      const row = startRow + i;
      for (let pos = 0; pos < seatsPerRow; pos++) {
        const seatLetter = String.fromCharCode(65 + pos);
        const seatNumber = `${coachPrefix}${row}${seatLetter}`;

        if (existingSeatNumbers.has(seatNumber)) {
          continue;
        }

        seatConfigs.push({
          seatNumber,
          type: resolveSeatType(coachClass, seatLetter),
          class: coachClass,
          price: 0,
          location:
            row <= startRow + numRows / 3 - 1
              ? "Front"
              : row <= startRow + (numRows * 2) / 3 - 1
              ? "Middle"
              : "Back",
          row,
          position: seatLetter,
        });
      }
    }

    if (seatConfigs.length === 0) {
      setAddCoachError(
        "All seats in this range already exist. Change the starting row or class."
      );
      return;
    }

    try {
      setIsSavingSeats(true);
      await seatService.createSeatsForTrain(trainId, seatConfigs);
      await fetchTrainAndSeats();
      setShowAddCoach(false);
      setNewCoach({
        class: COACH_CLASSES.ECONOMY,
        rows: 10,
        seatsPerRow: 6,
        startRow: 1,
      });
    } catch (err) {
      setAddCoachError(
        err.response?.data?.message || "Failed to add coach. Check the backend is running."
      );
      console.error(err);
    } finally {
      setIsSavingSeats(false);
    }
  };

  const handleSeatClick = (coachId, seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleSelectAllSeats = () => {
    const allAvailableSeatNumbers = seats
      .filter((seat) => seat.status === SEAT_STATUS.AVAILABLE) // Only select currently available seats
      .map((seat) => seat.seatNumber);
    setSelectedSeats(allAvailableSeatNumbers);
  };

  const handleDeleteSelectedSeats = async () => {
    if (selectedSeats.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedSeats.length} selected seats?`
      )
    ) {
      return;
    }

    try {
      setError(null);
      await seatService.deleteSeats(trainId, selectedSeats);
      await fetchTrainAndSeats();
      setSelectedSeats([]);
    } catch (err) {
      setError("Failed to delete seats");
      console.error(err);
    }
  };

  const handlePriceConfigUpdate = async () => {
    try {
      const updates = [];
      seats.forEach((seat) => {
        const priceString = priceConfig?.[seat.class]?.[seat.type];
        const price = parseFloat(priceString);

        if (
          priceString !== undefined &&
          priceString !== null &&
          !isNaN(price)
        ) {
          updates.push(
            seatService.updateSeatPrice(trainId, seat.seatNumber, price)
          );
        }
      });

      await Promise.all(updates);
      await fetchTrainAndSeats();
      setShowPriceConfig(false);
      setError(null);
    } catch (err) {
      setError("Failed to update prices");
      console.error(err);
    }
  };

  const handleAddSingleSeat = async () => {
    setNewSeatError(null); // Clear previous errors
    const { class: seatClass, seatNumber } = newSeat;

    // Format: class letter + row + seat letter (e.g. E1A, B3C)
    const seatNumberRegex = /^[A-Z]\d+[A-Z]$/;
    if (!seatNumberRegex.test(seatNumber)) {
      setNewSeatError(
        "Use format: class letter + row + seat letter (e.g. E1A for economy row 1 seat A)."
      );
      return;
    }

    // Extract row and position from seat number
    const rowMatch = seatNumber.match(/[A-Z](\d+)[A-Z]/);
    const positionMatch = seatNumber.match(/[A-Z]\d+([A-Z])$/);

    if (!rowMatch || !positionMatch) {
      setNewSeatError(
        "Invalid seat number format. Could not extract row or position."
      );
      return;
    }

    const row = parseInt(rowMatch[1], 10);
    const position = positionMatch[1];

    // Check for duplicate seat number within the current train's seats
    const isDuplicate = seats.some(
      (seat) => seat.seatNumber === seatNumber && seat.class === seatClass
    );
    if (isDuplicate) {
      setNewSeatError(
        `Seat number ${seatNumber} in ${seatClass.toUpperCase()} class already exists.`
      );
      return;
    }

    try {
      setIsSavingSeats(true);
      const seatConfig = {
        seatNumber,
        type: resolveSeatType(seatClass, position),
        class: seatClass,
        price: 0,
        location: "Middle",
        row,
        position,
      };

      await seatService.createSeatsForTrain(trainId, [seatConfig]);
      await fetchTrainAndSeats(); // Refresh seat data
      setShowAddSingleSeat(false); // Close modal
      setNewSeat({
        class: COACH_CLASSES.ECONOMY,
        seatNumber: "",
      }); // Reset form
    } catch (err) {
      setNewSeatError(
        err.response?.data?.message ||
          "Failed to add single seat. Check the backend is running."
      );
      console.error(err);
    } finally {
      setIsSavingSeats(false);
    }
  };

  // Calculate available seats count
  const availableSeatsCount = seats.filter(
    (seat) => seat.status === SEAT_STATUS.AVAILABLE
  ).length;

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const filteredSeats = seats.filter(
    (seat) =>
      seat.seatNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seat.class?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <PageLoader />;
  if (error) return <div className="error-message">Error: {error}</div>;

  const seatsByClass = seats.reduce(
    (acc, seat) => {
      if (!acc[seat.class]) {
        acc[seat.class] = [];
      }
      acc[seat.class].push(seat);
      return acc;
    },
    {
      economy: [],
      business: [],
      premium: [],
    }
  );

  Object.keys(seatsByClass).forEach((className) => {
    seatsByClass[className].sort((a, b) => {
      const rowCompare = Number(a.row) - Number(b.row);
      return rowCompare !== 0
        ? rowCompare
        : a.position.localeCompare(b.position);
    });
  });

  const classOrder = ["economy", "business", "premium"];

  return (
    <div className="page-container">
      <Sidebar />
      <div className="management-page">
        <h1>Seat Management</h1>
        <SearchBar onSearch={handleSearch} placeholder="Search seats..." />

        {/* Display available seats count */}
        <div className="available-seats-info">
          <p>Total Available Seats: {availableSeatsCount}</p>
        </div>

        {schedules.length === 0 && (
          <div className="alert alert-warning" role="alert">
            No schedules for this train yet. You can still add seats below; create a
            schedule under Admin → Schedules to manage per-trip availability.
          </div>
        )}

        {/* Date and Schedule Selection */}
        <div className="schedule-selection">
          <div className="date-picker">
            <FaCalendarAlt className="icon" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="schedule-picker">
            <FaClock className="icon" />
            <select
              value={selectedSchedule?.id || ""}
              onChange={(e) => {
                const schedule = schedules.find(
                  (s) => s.id === parseInt(e.target.value)
                );
                setSelectedSchedule(schedule);
              }}
            >
              <option value="">Select a schedule</option>
              {schedules.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.departureTime} - {schedule.arrivalTime} (
                  {schedule.route.departureStation} to{" "}
                  {schedule.route.arrivalStation})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="management-content">
          <div className="management-header">
            <h1>
              <FaChair className="me-2" />
              Seat Management - {train?.trainName}
            </h1>
            <div className="coach-counts">
              <p>
                Total Coaches:{" "}
                <strong>
                  {new Set(seats.map((seat) => seat.coachId)).size}
                </strong>
              </p>
              <p>
                Total Seats: <strong>{seats.length}</strong>
              </p>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => setShowAddCoach(true)}
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
              onClick={() => navigate("/admin/trains")}
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
            {classOrder.map((classType) => {
              const seatsInClassByRow =
                seatsByClass[classType]?.reduce((acc, seat) => {
                  if (!acc[seat.row]) {
                    acc[seat.row] = [];
                  }
                  acc[seat.row].push(seat);
                  return acc;
                }, {}) || {};

              const sortedRowNumbers = Object.keys(seatsInClassByRow).sort(
                (a, b) => Number(a) - Number(b)
              );

              return (
                <div
                  key={classType}
                  className="coach-section"
                  data-class={classType}
                >
                  <div className="coach-header">
                    <h3>{classType.toUpperCase()} Class</h3>
                    <div className="coach-actions">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setSelectedSeats([])}
                        disabled={selectedSeats.length === 0}
                      >
                        <FaTimes className="me-2" /> Deselect All
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={handleSelectAllSeats}
                        disabled={
                          seats.filter(
                            (seat) => seat.status === SEAT_STATUS.AVAILABLE
                          ).length === 0 ||
                          selectedSeats.length ===
                            seats.filter(
                              (seat) => seat.status === SEAT_STATUS.AVAILABLE
                            ).length
                        } /* Disable if no available seats or all available are already selected */
                      >
                        <FaCheckDouble className="me-2" /> Select All
                      </button>
                    </div>
                  </div>
                  <div className="coach-layout">
                    <div className="aisle-label">Aisle</div>
                    {sortedRowNumbers.length > 0 ? (
                      <div className="seat-rows">
                        {sortedRowNumbers.map((rowNum) => {
                          const seatsInRow = seatsInClassByRow[rowNum].sort(
                            (a, b) => a.position.localeCompare(b.position)
                          );
                          const seatsPerSide = classType === "economy" ? 3 : 2;

                          return (
                            <div key={rowNum} className="seat-row">
                              <div className="row-number">{rowNum}</div>
                              <div className="row-seats">
                                <div className="seat-group left">
                                  {seatsInRow
                                    .slice(0, seatsPerSide)
                                    .map((seat) => (
                                      <span
                                        key={seat.seatNumber}
                                        className={`seat-name ${
                                          selectedSeats.includes(
                                            seat.seatNumber
                                          )
                                            ? "selected"
                                            : ""
                                        } ${
                                          seat.status !== SEAT_STATUS.AVAILABLE
                                            ? "blocked"
                                            : "available"
                                        }`}
                                        onClick={() =>
                                          handleSeatClick(null, seat.seatNumber)
                                        }
                                        data-row={seat.row}
                                        title={`Row ${seat.row}, ${seat.type} seat`}
                                      >
                                        {seat.seatNumber}
                                      </span>
                                    ))}
                                </div>
                                <div className="row-aisle"></div>
                                <div className="seat-group right">
                                  {seatsInRow
                                    .slice(seatsPerSide)
                                    .map((seat) => (
                                      <span
                                        key={seat.seatNumber}
                                        className={`seat-name ${
                                          selectedSeats.includes(
                                            seat.seatNumber
                                          )
                                            ? "selected"
                                            : ""
                                        } ${
                                          seat.status !== SEAT_STATUS.AVAILABLE
                                            ? "blocked"
                                            : "available"
                                        }`}
                                        onClick={() =>
                                          handleSeatClick(null, seat.seatNumber)
                                        }
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
            {new Set(seats.map((seat) => seat.coachId)).size === 0 &&
              !loading &&
              !error && (
                <div className="no-coaches-message">
                  No coaches or seats available for this train. Add a coach
                  above!
                </div>
              )}
          </div>
        </div>
      </div>

      {renderModal(
        showAddCoach,
        () => {
          setShowAddCoach(false);
          setAddCoachError(null);
        },
        <>
          <button
            type="button"
            className="seat-modal-close"
            onClick={() => {
              setShowAddCoach(false);
              setAddCoachError(null);
            }}
            aria-label="Close"
          >
            <FaTimes />
          </button>
          <h3>Add New Coach</h3>
          {addCoachError && (
            <div className="alert-danger" role="alert">
              {addCoachError}
            </div>
          )}
          <div className="form-group">
            <label>Class</label>
            <select
              value={newCoach.class}
              onChange={(e) => {
                const classType = e.target.value;
                setNewCoach((prev) => ({
                  ...prev,
                  class: classType,
                  seatsPerRow: getSeatsPerRowForClass(classType),
                }));
              }}
            >
              {Object.entries(COACH_CLASSES).map(([key, value]) => (
                <option key={value} value={value}>
                  {key}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Number of Rows</label>
            <input
              type="number"
              value={newCoach.rows}
              onChange={(e) =>
                setNewCoach((prev) => ({
                  ...prev,
                  rows: parseInt(e.target.value, 10) || 0,
                }))
              }
              min="1"
              max="20"
            />
          </div>
          <div className="form-group">
            <label>Starting Row Number</label>
            <input
              type="number"
              value={newCoach.startRow}
              onChange={(e) =>
                setNewCoach((prev) => ({
                  ...prev,
                  startRow: parseInt(e.target.value, 10) || 0,
                }))
              }
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
            type="button"
            className="btn btn-primary"
            disabled={isSavingSeats}
            onClick={handleAddCoach}
          >
            {isSavingSeats ? "Saving..." : "Add Coach"}
          </button>
        </>
      )}

      {renderModal(
        showAddSingleSeat,
        () => {
          setShowAddSingleSeat(false);
          setNewSeatError(null);
          setNewSeat({ class: COACH_CLASSES.ECONOMY, seatNumber: "" });
        },
        <>
          <button
            type="button"
            className="seat-modal-close"
            onClick={() => {
              setShowAddSingleSeat(false);
              setNewSeatError(null);
              setNewSeat({ class: COACH_CLASSES.ECONOMY, seatNumber: "" });
            }}
            aria-label="Close"
          >
            <FaTimes />
          </button>
          <h3>Add Single Seat</h3>
          {newSeatError && (
            <div className="alert-danger" role="alert">
              {newSeatError}
            </div>
          )}
          <div className="form-group">
            <label>Class</label>
            <select
              value={newSeat.class}
              onChange={(e) =>
                setNewSeat((prev) => ({ ...prev, class: e.target.value }))
              }
            >
              {Object.entries(COACH_CLASSES).map(([key, value]) => (
                <option key={value} value={value}>
                  {key}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Seat Number (e.g., E1A, B3C)</label>
            <input
              type="text"
              value={newSeat.seatNumber}
              onChange={(e) =>
                setNewSeat((prev) => ({
                  ...prev,
                  seatNumber: e.target.value.toUpperCase(),
                }))
              }
              placeholder="e.g., E1A"
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={isSavingSeats}
            onClick={handleAddSingleSeat}
          >
            {isSavingSeats ? "Saving..." : "Add Seat"}
          </button>
        </>,
        400
      )}

      {renderModal(
        showPriceConfig,
        () => setShowPriceConfig(false),
        <>
          <button
            type="button"
            className="seat-modal-close"
            onClick={() => setShowPriceConfig(false)}
            aria-label="Close"
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
                  {Object.values(COACH_CLASSES).some(
                    (classType) => getSeatsPerRowForClass(classType) > 4
                  ) && <th>Middle</th>}
                </tr>
              </thead>
              <tbody>
                {Object.entries(COACH_CLASSES).map(([key, value]) => (
                  <tr key={value}>
                    <td>{key}</td>
                    <td>
                      <input
                        type="number"
                        value={priceConfig[value]?.window || ""}
                        onChange={(e) =>
                          setPriceConfig((prev) => ({
                            ...prev,
                            [value]: {
                              ...prev[value],
                              window: e.target.value,
                            },
                          }))
                        }
                        placeholder="Price"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={priceConfig[value]?.aisle || ""}
                        onChange={(e) =>
                          setPriceConfig((prev) => ({
                            ...prev,
                            [value]: {
                              ...prev[value],
                              aisle: e.target.value,
                            },
                          }))
                        }
                        placeholder="Price"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    {getSeatsPerRowForClass(value) > 4 && (
                      <td>
                        <input
                          type="number"
                          value={priceConfig[value]?.middle || ""}
                          onChange={(e) =>
                            setPriceConfig((prev) => ({
                              ...prev,
                              [value]: {
                                ...prev[value],
                                middle: e.target.value,
                              },
                            }))
                          }
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
            type="button"
            className="btn btn-primary"
            onClick={handlePriceConfigUpdate}
          >
            Update Prices
          </button>
        </>,
        750
      )}
    </div>
  );
};

export default withAuthenticationRequired(SeatManagement, {
  onRedirecting: () => <PageLoader />,
});
