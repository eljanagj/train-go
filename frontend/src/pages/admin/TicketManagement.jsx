import React, { useState, useEffect } from "react";
import { withAuthenticationRequired } from "@auth0/auth0-react";
import { PageLoader } from "../../components/PageLoader";
import Sidebar from "../../components/Sidebar";
import { ticketService } from "../../services/ticketService";
import {
  FaTicketAlt,
  FaUser,
  FaTrain,
  FaRoute,
  FaEye,
  FaDownload,
  FaCalendar,
} from "react-icons/fa";
import "../../styles/management.css";
import SearchBar from "../../components/SearchBar";

const TicketManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getAllTicketsForAdmin();
      setTickets(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch tickets");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "generated":
        return "#198754";
      case "downloaded":
        return "#0d6efd";
      case "pending":
        return "#fd7e14";
      case "expired":
        return "#dc3545";
      default:
        return "#6c757d";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewDetails = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetailsModal(true);
  };

  const handleDownloadTicket = async (ticketId) => {
    try {
      const pdfBlob = await ticketService.downloadTicketPdf(ticketId);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ticket-${ticketId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Refresh tickets to update download count
      fetchTickets();
    } catch (error) {
      console.error("Error downloading ticket:", error);
      alert("Failed to download ticket");
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.reservation?.passengerName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      ticket.reservation?.passengerSurname
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      ticket.reservation?.user?.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      ticket.reservation?.schedule?.route?.departureStation
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      ticket.reservation?.schedule?.route?.arrivalStation
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      ticket.reservation?.schedule?.train?.trainName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  if (loading) return <PageLoader />;

  return (
    <div className="management-page">
      <Sidebar />
      <div className="management-content">
        <div className="management-header">
          <h1>
            <FaTicketAlt className="me-2" />
            Ticket Management
          </h1>
          <SearchBar onSearch={handleSearch} placeholder="Search tickets..." />
          <p className="text-muted">View and manage all tickets</p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="management-table-container">
          <table className="management-table">
            <thead>
              <tr>
                <th>Ticket Number</th>
                <th>Generated</th>
                <th>Passenger</th>
                <th>Route</th>
                <th>Train</th>
                <th>Status</th>
                <th>Downloads</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="empty-state">
                      <FaTicketAlt size={48} className="text-muted mb-3" />
                      <p className="text-muted">No tickets found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <span className="text-monospace font-weight-bold">
                        {ticket.ticketNumber}
                      </span>
                    </td>
                    <td>
                      {formatDate(ticket.generatedAt || ticket.createdAt)}
                    </td>
                    <td>
                      <div>
                        <strong>
                          {ticket.reservation?.passengerName}{" "}
                          {ticket.reservation?.passengerSurname}
                        </strong>
                        <br />
                        <small className="text-muted">
                          {ticket.reservation?.user?.email}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="route-info">
                        <FaRoute className="me-1" />
                        {
                          ticket.reservation?.schedule?.route?.departureStation
                        }{" "}
                        → {ticket.reservation?.schedule?.route?.arrivalStation}
                      </div>
                    </td>
                    <td>
                      <div className="train-info">
                        <FaTrain className="me-1" />
                        {ticket.reservation?.schedule?.train?.trainName}
                      </div>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(ticket.status),
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "0.875rem",
                        }}
                      >
                        {ticket.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="download-count">
                        {ticket.downloadCount || 0}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewDetails(ticket)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {ticket.status === "generated" ||
                        ticket.status === "downloaded" ? (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleDownloadTicket(ticket.id)}
                            title="Download PDF"
                          >
                            <FaDownload />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedTicket && (
          <div
            className="modal-overlay"
            onClick={() => setShowDetailsModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5>Ticket Details</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Ticket Information</h6>
                    <p>
                      <strong>Ticket Number:</strong>{" "}
                      {selectedTicket.ticketNumber}
                    </p>
                    <p>
                      <strong>Status:</strong>
                      <span
                        className="ms-2"
                        style={{
                          backgroundColor: getStatusColor(
                            selectedTicket.status
                          ),
                          color: "white",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          fontSize: "0.8rem",
                        }}
                      >
                        {selectedTicket.status.toUpperCase()}
                      </span>
                    </p>
                    <p>
                      <strong>Type:</strong> {selectedTicket.type}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {formatDate(selectedTicket.createdAt)}
                    </p>
                    {selectedTicket.generatedAt && (
                      <p>
                        <strong>Generated:</strong>{" "}
                        {formatDate(selectedTicket.generatedAt)}
                      </p>
                    )}
                    {selectedTicket.downloadedAt && (
                      <p>
                        <strong>Last Downloaded:</strong>{" "}
                        {formatDate(selectedTicket.downloadedAt)}
                      </p>
                    )}
                    <p>
                      <strong>Download Count:</strong>{" "}
                      {selectedTicket.downloadCount || 0}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6>Expiration & Metadata</h6>
                    {selectedTicket.expiresAt ? (
                      <p>
                        <strong>Expires:</strong>{" "}
                        {formatDate(selectedTicket.expiresAt)}
                      </p>
                    ) : (
                      <p>
                        <strong>Expires:</strong>{" "}
                        <span className="text-muted">No expiration</span>
                      </p>
                    )}
                    {selectedTicket.qrCode && (
                      <p>
                        <strong>QR Code:</strong> Available
                      </p>
                    )}
                    {selectedTicket.pdfPath && (
                      <p>
                        <strong>PDF Path:</strong> {selectedTicket.pdfPath}
                      </p>
                    )}
                    {selectedTicket.metadata && (
                      <div>
                        <strong>Metadata:</strong>
                        <pre
                          className="mt-2 p-2 bg-light rounded"
                          style={{ fontSize: "0.8rem" }}
                        >
                          {JSON.stringify(
                            JSON.parse(selectedTicket.metadata),
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
                {selectedTicket.reservation && (
                  <div className="row mt-3">
                    <div className="col-md-6">
                      <h6>Passenger Information</h6>
                      <p>
                        <strong>Name:</strong>{" "}
                        {selectedTicket.reservation.passengerName}{" "}
                        {selectedTicket.reservation.passengerSurname}
                      </p>
                      <p>
                        <strong>Email:</strong>{" "}
                        {selectedTicket.reservation.user?.email}
                      </p>
                      <p>
                        <strong>Reservation ID:</strong>{" "}
                        {selectedTicket.reservation.id}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <h6>Journey Information</h6>
                      <p>
                        <strong>Route:</strong>{" "}
                        {
                          selectedTicket.reservation.schedule?.route
                            ?.departureStation
                        }{" "}
                        →{" "}
                        {
                          selectedTicket.reservation.schedule?.route
                            ?.arrivalStation
                        }
                      </p>
                      <p>
                        <strong>Train:</strong>{" "}
                        {selectedTicket.reservation.schedule?.train?.trainName}
                      </p>
                      <p>
                        <strong>Seat:</strong>{" "}
                        {selectedTicket.reservation.seatNumber}
                      </p>
                      <p>
                        <strong>Reservation Date:</strong>{" "}
                        {formatDate(selectedTicket.reservation.reservationDate)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default withAuthenticationRequired(TicketManagement, {
  onRedirecting: () => <PageLoader />,
});
