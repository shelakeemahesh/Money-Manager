import axiosConfig from "../utils/axiosConfig";
import { API_ENDPOINTS } from "../utils/apiEndpoints";

// SIGNUP
export const signup = async ({ fullName, email, phoneNumber, password }) => {
  return axiosConfig.post(API_ENDPOINTS.REGISTER, {
    fullName,
    email,
    phoneNumber,
    password,
  });
};

// LOGIN
export const login = async ({ emailOrPhone, password }) => {
  return axiosConfig.post(API_ENDPOINTS.LOGIN, {
    emailOrPhone,
    password,
  });
};

// VERIFY OTP
export const verifyOtp = async ({ emailOrPhone, otpCode }) => {
  return axiosConfig.post(API_ENDPOINTS.VERIFY_OTP, {
    emailOrPhone,
    otpCode,
  });
};

// RESEND OTP
export const resendOtp = async ({ emailOrPhone, channel }) => {
  return axiosConfig.post(API_ENDPOINTS.RESEND_OTP, {
    emailOrPhone,
    channel,
  });
};

// SEND OTP
export const sendOtp = async ({ userId, deliveryType }) => {
  return axiosConfig.post(API_ENDPOINTS.SEND_OTP, {
    userId,
    deliveryType,
  });
};

// FORGOT PASSWORD
export const forgotPassword = async ({ emailOrPhone }) => {
  return axiosConfig.post(API_ENDPOINTS.FORGOT_PASSWORD, {
    email: emailOrPhone,
  });
};

// RESET PASSWORD (OTP)
export const resetPassword = async ({ emailOrPhone, otpCode, newPassword }) => {
  return axiosConfig.post(API_ENDPOINTS.RESET_PASSWORD, {
    emailOrPhone,
    otpCode,
    newPassword,
  });
};