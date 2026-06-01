/**
 * Single switch for API auth. Set DISABLE_AUTH=false in .env to re-enable JWT checks.
 */
export const AUTH_DISABLED =
  process.env.DISABLE_AUTH !== 'false' && process.env.DISABLE_AUTH !== '0';
