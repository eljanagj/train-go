import React, { useState, useEffect } from 'react';
import { NavDropdown } from 'react-bootstrap';
import { FaFilter } from 'react-icons/fa';
import '../styles/FilterDropdown.css';

const FilterDropdown = ({ filterStatus, onFilterChange }) => {
  const [showFilter, setShowFilter] = useState(false);

  // Log when the FilterDropdown component re-renders
  console.log('FilterDropdown re-rendered. showFilter is:', showFilter);

  // Log when the showFilter state changes
  useEffect(() => {
    console.log('FilterDropdown showFilter state changed to:', showFilter);
  }, [showFilter]);

  return (
    <NavDropdown
      // Add a unique custom class for specificity
      className="maintenance-filter-dropdown"
      show={showFilter}
      onToggle={(isOpen, event, metadata) => {
        console.log('FilterDropdown onToggle called, isOpen:', isOpen);
        setShowFilter(isOpen);
      }}
      title={
        <span>
          <FaFilter className="me-2" /> Filter: {filterStatus === 'all' ? 'All' :
            filterStatus === 'in_progress' ? 'In Progress' :
            filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
        </span>
      }
      id="filter-dropdown"
      onSelect={(status) => {
        console.log('FilterDropdown onSelect called, status:', status);
        onFilterChange(status);
        setShowFilter(false); // Close dropdown on select
        console.log('FilterDropdown setShowFilter(false) called in onSelect');
      }}
    >
      <NavDropdown.Item eventKey="all">All</NavDropdown.Item>
      <NavDropdown.Item eventKey="pending">Pending</NavDropdown.Item>
      <NavDropdown.Item eventKey="in_progress">In Progress</NavDropdown.Item>
      <NavDropdown.Item eventKey="completed">Completed</NavDropdown.Item>
      <NavDropdown.Item eventKey="overdue">Overdue</NavDropdown.Item>
      <NavDropdown.Item eventKey="out_of_service">Out of Service</NavDropdown.Item>
      <NavDropdown.Item eventKey="scheduled">Scheduled</NavDropdown.Item>
    </NavDropdown>
  );
};

export default FilterDropdown; 