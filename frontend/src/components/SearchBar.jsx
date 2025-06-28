import React, { useState } from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import { Search, Clear } from "@mui/icons-material";
import "../styles/SearchBar.css";

const SearchBar = ({
  onSearch,
  placeholder = "Search...",
  fullWidth = true,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
  };

  return (
    <TextField
      className="search-bar"
      fullWidth={fullWidth}
      variant="outlined"
      placeholder={placeholder}
      value={searchTerm}
      onChange={handleSearch}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search />
          </InputAdornment>
        ),
        endAdornment: searchTerm && (
          <InputAdornment position="end">
            <IconButton onClick={handleClear} size="small">
              <Clear />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

export default SearchBar;
