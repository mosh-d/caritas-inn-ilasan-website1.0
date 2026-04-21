import axios from "axios";

const PRODUCTION_URL = "https://five-clover-shared-backend.onrender.com";

// Determine API base URL based on environment
let API_BASE_URL = import.meta.env.VITE_BACKEND_URL || PRODUCTION_URL;

export const createReservation = async (reservationData) => {
  try {
    console.log("Sending reservation data to:", API_BASE_URL);
    console.log("Payload:", JSON.stringify(reservationData, null, 2));
    // Ensure API_BASE_URL doesn't end with a slash to prevent double slashes
    const baseUrl = API_BASE_URL.endsWith("/")
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;
    const response = await axios.post(
      `${baseUrl}/api/reservations`,
      reservationData,
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      },
    );
    console.log("Reservation response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
    });
    throw error;
  }
};

export const getRoomTypeId = (roomTypeName) => {
  const roomTypeMap = {
    "Budget Suite": 10,
    Budget: 10, // Fallback
    "Standard Suite": 11,
    Standard: 11, // Fallback
    "Superior Suite": 13,
    Superior: 13, // Fallback
    "Executive Suite": 14,
    Executive: 14, // Fallback
    "Deluxe Suite": 12,
    Deluxe: 12, // Fallback
  };

  console.log("getRoomTypeId called with:", roomTypeName);
  console.log("Mapped to ID:", roomTypeMap[roomTypeName]);

  return roomTypeMap[roomTypeName] || null;
};
