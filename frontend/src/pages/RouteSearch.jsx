import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/RouteSearch.css";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import { Link } from "react-router-dom";
import { FaTrain, FaClock, FaMapMarkerAlt, FaEuroSign } from "react-icons/fa";

const mockResults = [
  { from: "Berlin", to: "Munich", time: "08:30", price: 45, duration: "4h 10m", platform: "5A" },
  { from: "Berlin", to: "Munich", time: "08:30", price: 50, duration: "4h 00m", platform: "3B" },
  { from: "Berlin", to: "Munich", time: "08:30", price: 55, duration: "3h 55m", platform: "7C" },
  { from: "Berlin", to: "Hamburg", time: "09:15", price: 25, duration: "2h 30m", platform: "1A" },
  { from: "Berlin", to: "Hamburg", time: "11:45", price: 28, duration: "2h 25m", platform: "4D" },
  { from: "Hamburg", to: "Cologne", time: "13:30", price: 65, duration: "4h 50m", platform: "2B" },
  { from: "Hamburg", to: "Cologne", time: "15:00", price: 60, duration: "5h 10m", platform: "8F" },
  { from: "Munich", to: "Frankfurt", time: "07:30", price: 40, duration: "3h 45m", platform: "5D" },
  { from: "Munich", to: "Frankfurt", time: "14:45", price: 42, duration: "3h 50m", platform: "3E" },
  { from: "Frankfurt", to: "Berlin", time: "17:15", price: 60, duration: "4h 20m", platform: "6A" },
  { from: "Cologne", to: "Berlin", time: "06:50", price: 58, duration: "5h 00m", platform: "2C" },
  { from: "Cologne", to: "Frankfurt", time: "08:20", price: 32, duration: "2h 05m", platform: "4A" },
  { from: "Cologne", to: "Frankfurt", time: "12:40", price: 34, duration: "2h 10m", platform: "7B" },
  { from: "Frankfurt", to: "Hamburg", time: "16:00", price: 55, duration: "4h 30m", platform: "9F" },
];

const cities = ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt"];

export default function TrainSearchPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("");
  const [results, setResults] = useState([]);

  const availableTimes = mockResults
    .filter(r => r.from === from && r.to === to)
    .map(r => r.time);

  const handleSearch = () => {
    const filtered = mockResults.filter(r => 
      r.from === from && 
      r.to === to && 
      (time ? r.time === time : true)
    );
    setResults(filtered);
  };

  return (
    <div className="search-page">
      <NavBar />

      <header className="search-header text-center">
        <div className="search-container">
          <h1 className="search-title display-4 mb-3">Plan Your Journey</h1>
          <p className="lead text-light">Discover Your Next Adventure by Rail</p>

          <div className="container mt-5">
            <div className="row g-3 justify-content-center">
              <div className="col-md-3">
                <select className="form-select" value={from} onChange={e => { setFrom(e.target.value); setTime(""); }}>
                  <option value="">From</option>
                  {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <select className="form-select" value={to} onChange={e => { setTo(e.target.value); setTime(""); }}>
                  <option value="">To</option>
                  {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <select className="form-select" value={time} onChange={e => setTime(e.target.value)} disabled={!from || !to}>
                  <option value="">Select Time</option>
                  {availableTimes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-md-2 d-grid">
                <button className="btn search-btn" onClick={handleSearch} disabled={!from || !to}>
                  Search Routes
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="py-5">
        <div className="container">
          {results.length > 0 && (
            <div className="results-container">
              <h4 className="search-title mb-4">Available Routes</h4>
              <div className="table-responsive">
                <table className="table route-table">
                  <thead className="table-dark">
                    <tr>
                      <th><FaMapMarkerAlt className="me-2" />From</th>
                      <th><FaMapMarkerAlt className="me-2" />To</th>
                      <th><FaClock className="me-2" />Departure</th>
                      <th>Duration</th>
                      <th>Platform</th>
                      <th><FaEuroSign className="me-2" />Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, idx) => (
                      <tr key={idx} className="route-row">
                        <td>{r.from}</td>
                        <td>{r.to}</td>
                        <td>{r.time}</td>
                        <td>{r.duration}</td>
                        <td>{r.platform}</td>
                        <td>€{r.price}</td>
                        <td>
                          <Link
                            to="/reservation"
                            state={{ route: r }}
                            className="btn search-btn btn-sm"
                          >
                            Select
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results.length === 0 && from && to && (
            <div className="text-center text-muted mt-4">
              <p>No matching routes found. Try a different time!</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
