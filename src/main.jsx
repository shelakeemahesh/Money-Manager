import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AppContextProvider } from './context/AppContext.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'

// Global button click throttle and request tracking interceptor
document.addEventListener('click', (event) => {
  const button = event.target.closest('button, input[type="submit"], [role="button"]');
  if (!button) return;

  // If the button is disabled or loading, block the click immediately
  if (button.disabled || button.getAttribute('aria-disabled') === 'true' || button.dataset.loading === 'true') {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  const now = Date.now();
  const lastClick = button.dataset.lastClick ? parseInt(button.dataset.lastClick, 10) : 0;
  
  // Ignore rapid repeated clicks on the same button within 1.2 seconds
  if (now - lastClick < 1200) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  
  button.dataset.lastClick = now.toString();
  
  // Associate this button with any Axios requests triggered synchronously
  window.lastClickedButton = button;
  setTimeout(() => {
    if (window.lastClickedButton === button) {
      window.lastClickedButton = null;
    }
  }, 0);
}, true); // Use capture phase to intercept before React handlers trigger


ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </ErrorBoundary>
)
