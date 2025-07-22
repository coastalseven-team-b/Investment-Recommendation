import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import { theme } from "./theme";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RiskProfile from "./pages/RiskProfile";
import Dashboard from "./pages/Dashboard";
import BankUpload from "./pages/BankUpload";
import Investment from "./pages/Investment";
import Recommendation from "./pages/Recommendation";
import Tips from "./pages/Tips";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { AnimatePresence } from "framer-motion";

// Global styles
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.textPrimary};
    line-height: 1.6;
  }
  
  html {
    scroll-behavior: smooth;
  }
  
  button {
    font-family: inherit;
  }
  
  input, select, textarea {
    font-family: inherit;
  }
  
  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.backgroundSecondary};
  }
  
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.cardBorder};
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.textTertiary};
  }
`;

function App() {
  const location = useLocation();
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/risk-profile" element={<RiskProfile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bank-upload" element={<BankUpload />} />
          <Route path="/investment" element={<Investment />} />
          <Route path="/recommendation" element={<Recommendation />} />
          <Route path="/tips" element={<Tips />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AnimatePresence>
    </ThemeProvider>
  );
}

export default App; 