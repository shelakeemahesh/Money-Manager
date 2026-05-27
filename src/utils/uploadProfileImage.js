import axiosConfig from "./axiosConfig.jsx";
import { API_ENDPOINTS } from "./apiEndpoints.js";

const uploadProfileImage = async (image) => {
  try {
    // 1. Fetch upload signature from backend
    const signatureData = await axiosConfig.get(API_ENDPOINTS.PROFILE_UPLOAD_SIGNATURE);
    
    const { signature, timestamp, apiKey, cloudName, uploadPreset } = signatureData;

    // 2. Prepare FormData for signed upload
    const formData = new FormData();
    formData.append("file", image);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("upload_preset", uploadPreset);

    // 3. Upload directly to Cloudinary using signed parameters
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    // We use standard fetch here to prevent backend interceptors from attaching JWT token
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Cloudinary upload failed: ${
          data.error?.message || response.statusText
        }`
      );
    }

    console.log("Image uploaded successfully:", data.secure_url);
    return data.secure_url;

  } catch (error) {
    console.error("Error uploading the image:", error);
    throw error;
  }
};

export default uploadProfileImage;