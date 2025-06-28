import React, { useState } from "react";
import SearchBar from "../components/SearchBar";

const withSearch = (
  WrappedComponent,
  searchFields = [],
  placeholder = "Search..."
) => {
  return function WithSearch(props) {
    const [searchTerm, setSearchTerm] = useState("");

    const handleSearch = (term) => {
      setSearchTerm(term.toLowerCase());
    };

    const filterData = (data) => {
      if (!searchTerm || searchFields.length === 0) return data;

      return data.filter((item) =>
        searchFields.some((field) => {
          const fieldValue = getNestedValue(item, field);
          return (
            fieldValue && String(fieldValue).toLowerCase().includes(searchTerm)
          );
        })
      );
    };

    // Helper function to get nested object values
    const getNestedValue = (obj, path) => {
      return path.split(".").reduce((acc, part) => acc && acc[part], obj);
    };

    return (
      <>
        <div style={{ marginBottom: "1rem", padding: "0 16px" }}>
          <SearchBar onSearch={handleSearch} placeholder={placeholder} />
        </div>
        <WrappedComponent
          {...props}
          filteredData={filterData}
          searchTerm={searchTerm}
        />
      </>
    );
  };
};

export default withSearch;
