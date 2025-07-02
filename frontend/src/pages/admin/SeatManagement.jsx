import React, { useState, useEffect } from "react";
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

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTrainAndSeats();
    fetchSchedules();
  }, [trainId]);

  const fetchSchedules = async () => {
    try {
      const data = await scheduleService.getSchedulesByTrain(trainId);
      setSchedules(data);
      if (data.length > 0) {
        setSelectedSchedule(data[0]);
      }
      console.log("DEBUG: Schedules fetched: ", data);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    }
  };

  const fetchTrainAndSeats = async () => {
    console.log("DEBUG: fetchTrainAndSeats called.");
    try {
      setLoading(true);
      const trainData = await trainService.getTrain(trainId);
      setTrain(trainData);

      if (selectedSchedule) {
        console.log(
          "DEBUG: Fetching seat details for date:",
          selectedDate,
          "time:",
          selectedSchedule.departureTime
        );
        const seatsData = await seatService.getSeatDetails(
          trainId,
          selectedDate,
          selectedSchedule.departureTime
        );
        console.log("DEBUG: Fetched seats data (raw):", seatsData);
        setSeats(
          Object.entries(seatsData).map(([seatNumber, config]) => ({
            seatNumber,
            ...config,
          }))
        );
        console.log("DEBUG: Seats state updated.");
      } else {
        console.log("DEBUG: No schedule selected, not fetching seat details.");
      }

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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSchedule) {
      fetchTrainAndSeats();
    }
  }, [selectedDate, selectedSchedule]);

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
      const existingRows = new Set(
        seats
          .filter((seat) => seat.class === coachClass)
          .map((seat) => seat.row)
      );

      // Check for conflicts with existing rows
      for (let i = 0; i < numRows; i++) {
        const currentRow = startRow + i;
        if (existingRows.has(currentRow)) {
          setAddCoachError(
            `Row ${currentRow} in ${coachClass.toUpperCase()} class already exists. Please choose a different starting row or fewer rows.`
          );
          return;
        }
      }

      const seatConfigs = [];
      const seatsPerRow = getSeatsPerRowForClass(newCoach.class);
      const totalSeats = newCoach.rows * seatsPerRow;

      // Get the prefix for the coach class
      const coachPrefix = coachClass.charAt(0).toUpperCase(); // P for Premium, B for Business, E for Economy

      for (let i = 0; i < newCoach.rows; i++) {
        const row = newCoach.startRow + i;
        for (let pos = 0; pos < seatsPerRow; pos++) {
          const position = String.fromCharCode(65 + pos); // A, B, C, etc.
          // Include coach class prefix in seat number
          const seatNumber = `${coachPrefix}${row}${position}`;

          let type;
          const positionIndex = pos; // pos is the 0-based index (0 for A, 1 for B, etc.)
          const coachClass = newCoach.class;

          if (coachClass === COACH_CLASSES.ECONOMY) {
            // Economy class (3+3)
            if (position === "A" || position === "F") {
              type = SEAT_TYPES.WINDOW;
            } else if (position === "C" || position === "D") {
              type = SEAT_TYPES.AISLE;
            } else if (position === "B" || position === "E") {
              type = SEAT_TYPES.MIDDLE;
            }
          } else {
            // Business/Premium class (2+2)
            if (position === "A" || position === "D") {
              type = SEAT_TYPES.WINDOW;
            } else if (position === "B" || position === "C") {
              type = SEAT_TYPES.AISLE;
            } // No middle seats in 2+2 layout
          }

          seatConfigs.push({
            seatNumber,
            type,
            class: newCoach.class,
            price: 0,
            location:
              row <= newCoach.rows / 3
                ? "Front"
                : row <= (newCoach.rows * 2) / 3
                ? "Middle"
                : "Back",
            row,
            position,
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
        startRow: 1,
      });
    } catch (err) {
      setAddCoachError("Failed to add coach");
      console.error(err);
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

    // Validate seat number format (e.g., B3A, E5B)
    const seatNumberRegex = /^[A-Z]\d+[A-Z]$/;
    if (!seatNumberRegex.test(seatNumber)) {
      setNewSeatError(
        "Invalid seat number format. Please use the format like B3A or E5B."
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
      // Determine seat type based on position (assuming standard A, B, C, D, E, F)
      let type = SEAT_TYPES.MIDDLE; // Default to middle
      const positionIndex = position.charCodeAt(0) - 65;
      const seatsPerRow = getSeatsPerRowForClass(seatClass);

      if (seatsPerRow === 6) {
        // Economy class
        if (position === "A" || position === "F") {
          type = SEAT_TYPES.WINDOW;
        } else if (position === "C" || position === "D") {
          type = SEAT_TYPES.AISLE;
        } else if (position === "B" || position === "E") {
          type = SEAT_TYPES.MIDDLE;
        }
      } else {
        // Business/Premium class (2+2)
        if (position === "A" || position === "D") {
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
        location:
          row <= (train?.totalRows || 0) / 3
            ? "Front"
            : row <= ((train?.totalRows || 0) * 2) / 3
            ? "Middle"
            : "Back", // Basic location logic
        row,
        position,
      };

      await seatService.createSeatsForTrain(trainId, [seatConfig]); // API expects an array
      await fetchTrainAndSeats(); // Refresh seat data
      setShowAddSingleSeat(false); // Close modal
      setNewSeat({
        class: COACH_CLASSES.ECONOMY,
        seatNumber: "",
      }); // Reset form
    } catch (err) {
      setNewSeatError("Failed to add single seat");
      console.error(err);
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
                  {schedule.route.departureStation?.name} to{" "}
                  {schedule.route.arrivalStation?.name})
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

      {showAddCoach && (
        <div className="modal">
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "2rem",
                borderRadius: "8px",
                width: "90%",
                maxWidth: "500px",
                position: "relative",
                zIndex: 10000,
              }}
            >
              <button
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  padding: "0.25rem",
                  lineHeight: 1,
                }}
                onClick={() => {
                  console.log("Closing modal...");
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
                      rows: parseInt(e.target.value),
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
                      startRow: parseInt(e.target.value),
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
                className="btn btn-primary"
                onClick={() => {
                  console.log("Adding coach...");
                  handleAddCoach();
                }}
              >
                Add Coach
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddSingleSeat && (
        <div className="modal">
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "2rem",
                borderRadius: "8px",
                width: "90%",
                maxWidth: "400px",
                position: "relative",
                zIndex: 10000,
              }}
            >
              <button
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  padding: "0.25rem",
                  lineHeight: 1,
                }}
                onClick={() => {
                  setShowAddSingleSeat(false);
                  setNewSeatError(null);
                  setNewSeat({
                    class: COACH_CLASSES.ECONOMY,
                    seatNumber: "",
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
                <label>Seat Number (e.g., 1A, 5B)</label>
                <input
                  type="text"
                  value={newSeat.seatNumber}
                  onChange={(e) =>
                    setNewSeat((prev) => ({
                      ...prev,
                      seatNumber: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="e.g., 1A"
                />
              </div>
              <button className="btn btn-primary" onClick={handleAddSingleSeat}>
                Add Seat
              </button>
            </div>
          </div>
        </div>
      )}

      {showPriceConfig && (
        <div className="modal">
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                padding: "2rem",
                borderRadius: "8px",
                width: "90%",
                maxWidth: "750px",
                position: "relative",
                zIndex: 10000,
              }}
            >
              <button
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  padding: "0.25rem",
                  lineHeight: 1,
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
                className="btn btn-primary"
                onClick={handlePriceConfigUpdate}
              >
                Update Prices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default withAuthenticationRequired(SeatManagement, {
  onRedirecting: () => <PageLoader />,
});
