import { useEffect } from "react";

export const useSEO = ({ title, description, keywords }) => {
  useEffect(() => {
    // 1. Update Title
    if (title) {
      document.title = `${title} | CredoWallet`;
    } else {
      document.title = "CredoWallet | Personal Wealth & Finance Manager";
    }

    // 2. Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = description || "CredoWallet is a premium personal wealth management console to track incomes, expenses, budgets, AI insights, and friends ledger.";

    // 3. Update Meta Keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement("meta");
      metaKeywords.name = "keywords";
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = keywords || "finance, wealth manager, budget, income, expense, money tracker, personal finance, AI budget, friends ledger, credowallet";

    // 4. Update Open Graph Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = title ? `${title} | CredoWallet` : "CredoWallet | Personal Wealth & Finance Manager";

    // 5. Update Open Graph Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    ogDesc.content = description || "CredoWallet is a premium personal wealth management console to track incomes, expenses, budgets, AI insights, and friends ledger.";

    // 6. Update Twitter Title
    let twTitle = document.querySelector('meta[property="twitter:title"]');
    if (!twTitle) {
      twTitle = document.createElement("meta");
      twTitle.setAttribute("property", "twitter:title");
      document.head.appendChild(twTitle);
    }
    twTitle.content = title ? `${title} | CredoWallet` : "CredoWallet | Personal Wealth & Finance Manager";

    // 7. Update Twitter Description
    let twDesc = document.querySelector('meta[property="twitter:description"]');
    if (!twDesc) {
      twDesc = document.createElement("meta");
      twDesc.setAttribute("property", "twitter:description");
      document.head.appendChild(twDesc);
    }
    twDesc.content = description || "CredoWallet is a premium personal wealth management console to track incomes, expenses, budgets, AI insights, and friends ledger.";
  }, [title, description, keywords]);
};

export default useSEO;
