import { createContext, useState, useEffect } from "react";
import { API_ENDPOINTS } from "../utils/apiEndpoints";
import axiosConfig from "../utils/axiosConfig";

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      localStorage.removeItem("user");
      return null;
    }
  });
  const [incomeList, setIncomeList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [anomalyAlerts, setAnomalyAlerts] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  useEffect(() => {
    if (user) {
      fetchAllData();
    } else {
      setIncomeList([]);
      setExpenseList([]);
      setCategoryList([]);
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      const [incomeRes, expenseRes, categoryRes] = await Promise.all([
        axiosConfig.get(API_ENDPOINTS.GET_INCOME),
        axiosConfig.get(API_ENDPOINTS.GET_EXPENSE),
        axiosConfig.get(API_ENDPOINTS.GET_CATEGORY)
      ]);
      setIncomeList(incomeRes.data);
      setExpenseList(expenseRes.data);
      setCategoryList(categoryRes.data);
    } catch (error) {
      console.error("Failed to load initial data", error);
    }
  };

  const totalIncome = incomeList.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpense = expenseList.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalBalance = totalIncome - totalExpense;

  const addAnomaly = (alert) => {
    setAnomalyAlerts((prev) => [
      { id: Date.now(), ...alert, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) },
      ...prev,
    ]);
  };

  const dismissAnomaly = (id) => setAnomalyAlerts((prev) => prev.filter((a) => a.id !== id));

  const contextValue = {
    user, setUser,
    incomeList, setIncomeList,
    expenseList, setExpenseList,
    categoryList, setCategoryList,
    totalIncome, totalExpense, totalBalance,
    anomalyAlerts, addAnomaly, dismissAnomaly,
    theme, toggleTheme, setTheme,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;