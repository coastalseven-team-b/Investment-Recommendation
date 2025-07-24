import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import NavBar from "../components/NavBar";
import { motion } from "framer-motion";
import { Card, Typography, Box, Divider, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const Container = styled.div`
  background: ${({ theme }) => theme.background};
  color: black;
  min-height: 100vh;
  padding: 32px;
`;

const Button = styled.button`
  background: ${({ theme }) => theme.gradientPrimary};
  color: #fff;
  border: none;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radiusMd};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: ${({ theme }) => theme.spacing.md};
  &:hover {
    box-shadow: ${({ theme }) => theme.shadowMd};
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const tipsByBehaviour = {
  Saver: [
    "Consider investing a portion of your savings for higher returns.",
    "Explore low-risk mutual funds to grow your wealth.",
    "Maintain an emergency fund for unexpected expenses."
  ],
  Spender: [
    "Track your expenses and set a monthly budget.",
    "Try to save at least 10% of your income.",
    "Automate savings to build better habits."
  ],
  Investor: [
    "Diversify your investments to manage risk.",
    "Review your portfolio regularly.",
    "Stay updated on market trends and adjust your strategy."
  ]
};

const tipsByRisk = {
  Low: [
    "Focus on stable, low-risk investments like bonds and blue-chip stocks.",
    "Avoid high-volatility assets.",
    "Review your risk profile annually."
  ],
  Medium: [
    "Balance your portfolio with a mix of equity and debt funds.",
    "Consider SIPs in mutual funds for disciplined investing.",
    "Monitor your investments and rebalance as needed."
  ],
  High: [
    "Explore high-growth stocks and sectoral funds.",
    "Be prepared for market fluctuations.",
    "Set clear profit and loss targets."
  ]
};

const tipsByGoal = {
  Retirement: [
    "Start investing early to benefit from compounding.",
    "Consider pension funds and long-term mutual funds.",
    "Review your retirement corpus annually."
  ],
  Education: [
    "Invest in child education plans or PPF.",
    "Start a SIP for long-term education goals.",
    "Review your plan as education costs change."
  ],
  Emergency: [
    "Maintain a liquid emergency fund.",
    "Keep 6-12 months of expenses in savings.",
    "Avoid investing emergency funds in volatile assets."
  ],
  Family: [
    "Plan for family health insurance.",
    "Invest in joint savings or mutual funds.",
    "Set financial goals for major family events."
  ],
  "Wealth Creation": [
    "Diversify across asset classes for growth.",
    "Consider equity mutual funds and stocks.",
    "Review your portfolio for high-performing assets."
  ]
};

function Tips() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get("/api/summary", { headers });
        setSummary(res.data);
      } catch (err) {
        setError("Failed to load financial summaries. Please upload your bank data and make investments.");
      }
      setLoading(false);
    };
    fetchSummary();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.4, ease: "backOut" }}
    >
      <NavBar />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Financial Behaviour Summary */}
          <Card elevation={8} sx={{ borderRadius: 4, p: 4, background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)', color: 'white', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccountBalanceWalletIcon sx={{ fontSize: 36, mr: 2, color: 'white' }} />
              <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 1 }}>Financial Behaviour Summary</Typography>
            </Box>
            {loading ? <Typography>Loading...</Typography> : error ? <Typography color="error">{error}</Typography> : <Typography variant="body1" sx={{ fontSize: 18 }}>{summary?.financial_behavior_summary || 'No summary available.'}</Typography>}
          </Card>
          <Divider sx={{ my: 2, borderColor: '#00c6ff' }} />
          {/* Investment Summary */}
          <Card elevation={8} sx={{ borderRadius: 4, p: 4, background: 'linear-gradient(90deg, #232526 0%, #414345 100%)', color: 'white', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon sx={{ fontSize: 36, mr: 2, color: '#00c6ff' }} />
              <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 1 }}>Investment Summary</Typography>
            </Box>
            {loading ? <Typography>Loading...</Typography> : error ? <Typography color="error">{error}</Typography> : <Typography variant="body1" sx={{ fontSize: 18 }}>{summary?.investment_summary || 'No summary available.'}</Typography>}
          </Card>
          <Divider sx={{ my: 2, borderColor: '#00c6ff' }} />
          {/* Tips for Future Investments */}
          <Card elevation={8} sx={{ borderRadius: 4, p: 4, background: 'linear-gradient(90deg, #fff3cd 0%, #ffeeba 100%)', color: '#856404', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EmojiObjectsIcon sx={{ fontSize: 36, mr: 2, color: '#ff9800' }} />
              <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 1, color: '#856404' }}>Tips for Future Investments</Typography>
            </Box>
            {loading ? <Typography>Loading...</Typography> : error ? <Typography color="error">{error}</Typography> : (
              <List>
                {(Array.isArray(summary?.investment_tips)
                  ? summary.investment_tips
                  : (summary?.investment_tips || '').split(/\n|\r/).filter(Boolean)
                ).map((tip, i) => (
                  <ListItem key={i} sx={{ pl: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><EmojiObjectsIcon sx={{ color: '#ff9800' }} /></ListItemIcon>
                    <ListItemText primary={<Typography sx={{ fontSize: 17 }}>{tip}</Typography>} />
                  </ListItem>
                ))}
              </List>
            )}
          </Card>
        </Box>
      </Box>
    </motion.div>
  );
}

export default Tips; 