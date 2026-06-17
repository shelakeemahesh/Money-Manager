import axiosConfig from "../utils/axiosConfig";
import { API_ENDPOINTS } from "../utils/apiEndpoints";

export const getFriendTransactions = async (params) => {
  return axiosConfig.get(API_ENDPOINTS.FRIEND_TRANSACTIONS, { params });
};

export const createFriendTransaction = async (data) => {
  return axiosConfig.post(API_ENDPOINTS.FRIEND_TRANSACTIONS, data);
};

export const updateFriendTransaction = async (id, data) => {
  return axiosConfig.put(`${API_ENDPOINTS.FRIEND_TRANSACTIONS}/${id}`, data);
};

export const deleteFriendTransaction = async (id) => {
  return axiosConfig.delete(`${API_ENDPOINTS.FRIEND_TRANSACTIONS}/${id}`);
};

export const settleFriendTransaction = async (id) => {
  return axiosConfig.patch(API_ENDPOINTS.FRIEND_TRANSACTIONS_SETTLE(id));
};

export const getFriendTransactionsSummary = async () => {
  return axiosConfig.get(API_ENDPOINTS.FRIEND_TRANSACTIONS_SUMMARY);
};

export const getFriendDetailSummary = async (name) => {
  return axiosConfig.get(API_ENDPOINTS.FRIEND_TRANSACTIONS_DETAIL_SUMMARY(name));
};
