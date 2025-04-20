export enum TrainStatus {
    ACTIVE         = 'ACTIVE',          // Available for service
    IN_TRANSIT     = 'IN_TRANSIT',      // Currently running between stations
    ARRIVED        = 'ARRIVED',         // Has reached a station
    DELAYED        = 'DELAYED',         // Running behind schedule
    MAINTENANCE    = 'MAINTENANCE',     // Out of service for repairs
    DECOMMISSIONED = 'DECOMMISSIONED',  // Permanently retired
  }