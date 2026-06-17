import axiosConfig from "../utils/axiosConfig";
import { API_ENDPOINTS } from "../utils/apiEndpoints";

export const getFriendExpenses = async () => {
  return axiosConfig.get(API_ENDPOINTS.FRIEND_EXPENSES);
};

export const createFriendExpense = async (data) => {
  return axiosConfig.post(API_ENDPOINTS.FRIEND_EXPENSES, data);
};

export const updateFriendExpense = async (id, data) => {
  return axiosConfig.put(`${API_ENDPOINTS.FRIEND_EXPENSES}/${id}`, data);
};

export const deleteFriendExpense = async (id) => {
  return axiosConfig.delete(`${API_ENDPOINTS.FRIEND_EXPENSES}/${id}`);
};

export const getFriendStats = async () => {
  return axiosConfig.get(API_ENDPOINTS.FRIEND_STATS);
};
