import React from "react";
import { AppBar, Toolbar, Button, IconButton, Typography, Box } from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { motion } from "framer-motion";
import axios from "axios";
import { useEffect, useState } from "react";

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Banner logic
  const [bannerMsg, setBannerMsg] = useState("");

  useEffect(() => {
    async function checkUserStatus() {
      const token = localStorage.getItem("token");
      if (!token) {
        setBannerMsg("");
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const profileRes = await axios.get("/api/profile", { headers });
        const profile = profileRes.data;
        let riskDone = profile.risk_profile_completed && profile.risk_level && profile.investment_goal;
        // Check bank upload by fetching transactions/behavior
        let bankDone = false;
        try {
          const txRes = await axios.get("/api/transactions", { headers });
          bankDone = txRes.data.behavior && txRes.data.behavior.toLowerCase() !== 'unknown';
        } catch {
          bankDone = false;
        }
        if (!riskDone && !bankDone) setBannerMsg("For a better experience and personalized recommendations, please fill in the risk questionnaire and upload your bank statement!");
        else if (!riskDone) setBannerMsg("Please complete your risk profile questionnaire for personalized recommendations.");
        else if (!bankDone) setBannerMsg("Please upload your bank statement for personalized recommendations.");
        else setBannerMsg("");
      } catch {
        setBannerMsg("");
      }
    }
    checkUserStatus();
  }, [location.pathname]);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { path: "/bank-upload", label: "Bank Data", icon: <UploadFileIcon /> },
    { path: "/investment", label: "Investments", icon: <AccountBalanceWalletIcon /> },
    { path: "/recommendation", label: "Recommendations", icon: <TrendingUpIcon /> },
    { path: "/tips", label: "Tips", icon: <TipsAndUpdatesIcon /> },
    { path: "/profile", label: "Profile", icon: <PersonIcon /> }
  ];

  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, type: "spring" }}
    >
      <AppBar position="sticky" color="default" elevation={4} sx={{ background: 'linear-gradient(90deg, #0f2027 0%, #2c5364 100%)' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 6 }}>
            <IconButton edge="start" color="primary" sx={{ background: 'white', mr: 1 }}>
              <Typography variant="h6" color="primary" fontWeight={700}>₹</Typography>
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              InvestSmart
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                startIcon={item.icon}
                color={location.pathname === item.path ? "primary" : "inherit"}
                variant={location.pathname === item.path ? "contained" : "text"}
                sx={{
                  borderRadius: 2,
                  fontWeight: location.pathname === item.path ? 700 : 500,
                  background: location.pathname === item.path ? 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)' : 'none',
                  color: 'white', // Always white text
                  boxShadow: location.pathname === item.path ? 3 : 0,
                  transition: 'all 0.2s',
                  mx: 0.5
                }}
              >
                {item.label}
              </Button>
            ))}
            <Button
              onClick={handleSignOut}
              startIcon={<LogoutIcon />}
              color="secondary"
              variant="outlined"
              sx={{ borderRadius: 2, fontWeight: 700, ml: 2, color: 'white', borderColor: 'white' }}
            >
              Sign Out
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      {/* Scrolling banner for users who skipped info or didn't upload bank statement */}
      {bannerMsg && (
        <Box sx={{ width: '100%', bgcolor: '#ffecb3', color: '#856404', py: 1, px: 2, overflow: 'hidden', borderBottom: '2px solid #ffe082', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <marquee style={{ fontWeight: 600, fontSize: 16 }}>
            {bannerMsg}
          </marquee>
        </Box>
      )}
    </motion.div>
  );
}

export default NavBar; 