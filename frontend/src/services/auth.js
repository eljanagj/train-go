// Function to get the access token from localStorage
export const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

// Function to set the access token
export const setAccessToken = (token) => {
  localStorage.setItem('access_token', token);
};

// Function to remove the access token
export const removeAccessToken = () => {
  localStorage.removeItem('access_token');
}; 