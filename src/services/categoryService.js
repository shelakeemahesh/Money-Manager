import axios from "../utils/axiosConfig";

const BASE = "/categories";
const SUB_BASE = "/subcategories";

// ─── Categories ────────────────────────────────────────────────────────────────
export const getAllCategories = () => axios.get(BASE);

export const createCategory = (data) => axios.post(BASE, data);

export const updateCategory = (id, data) => axios.put(`${BASE}/${id}`, data);

export const deleteCategory = (id) => axios.delete(`${BASE}/${id}`);

// ─── SubCategories ─────────────────────────────────────────────────────────────
export const getSubcategories = (categoryId) => axios.get(`${SUB_BASE}/${categoryId}`);

export const createSubcategory = (data) => axios.post(SUB_BASE, data);

export const deleteSubcategory = (id) => axios.delete(`${SUB_BASE}/${id}`);
