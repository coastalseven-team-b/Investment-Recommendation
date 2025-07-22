import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import { Box, Card, Typography, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { motion } from "framer-motion";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SavingsIcon from '@mui/icons-material/Savings';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(date) {
  if (!date) return "-";
  try {
    const d = typeof date === 'string' ? new Date(date.replace(/Z?$/, 'Z')) : new Date(date);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString('en-IN');
  } catch {
    return "-";
  }
}

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [profileRes, invRes] = await Promise.all([
          axios.get("/api/profile", { headers }),
          axios.get("/api/investments", { headers })
        ]);
        setProfile(profileRes.data);
        setInvestments(invRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <NavBar />
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
          <CircularProgress color="primary" />
        </Box>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <NavBar />
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
          <Typography color="error">Error loading profile.</Typography>
        </Box>
      </>
    );
  }

  const invested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const returns = investments.reduce((sum, inv) => sum + inv.amount * (inv.expected_return/100), 0);
  const totalValue = profile.virtual_balance + invested + returns;

  const statCards = [
    {
      title: "Total Balance",
      value: formatCurrency(totalValue),
      icon: <CurrencyRupeeIcon fontSize="large" color="primary" />, 
      change: `+${formatCurrency(returns)} • This month`,
      changeColor: "success.main"
    },
    {
      title: "Invested Amount",
      value: formatCurrency(invested),
      icon: <AccountBalanceWalletIcon fontSize="large" color="secondary" />, 
      change: `${investments.length} investments`,
      changeColor: "white"
    },
    {
      title: "Total Returns",
      value: formatCurrency(returns),
      icon: <TrendingUpIcon fontSize="large" color="success" />, 
      change: `+${invested > 0 ? ((returns / invested) * 100).toFixed(1) : 0}% • ROI`,
      changeColor: "success.main"
    },
    {
      title: "Available Balance",
      value: formatCurrency(profile.virtual_balance),
      icon: <SavingsIcon fontSize="large" color="info" />, 
      change: `Ready to invest`,
      changeColor: "white"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <NavBar />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
              Welcome back, {profile.name}! 👋
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Here's your investment portfolio overview
            </Typography>
          </Box>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statCards.map((card, idx) => (
              <Grid item xs={12} sm={6} md={3} key={card.title}>
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5 + idx * 0.1, type: "spring" }}
                >
                  <Card elevation={6} sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #232526 0%, #414345 100%)', color: 'white', minHeight: 170 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.7)' }}>
                        {card.title}
                      </Typography>
                      {card.icon}
                    </Box>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: card.changeColor }}>
                      {card.change}
                    </Typography>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Portfolio Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: "spring" }}
          >
            <Card elevation={8} sx={{ borderRadius: 4, p: 4, mb: 4, background: 'linear-gradient(120deg, #232526 0%, #414345 100%)', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap' }}>
                <Typography variant="h5" fontWeight={700}>
                  Your Portfolio
                </Typography>
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Box textAlign="center">
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Total Investments</Typography>
                    <Typography variant="h6" fontWeight={700}>{investments.length}</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Annual Avg. Return</Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {investments.length > 0 ? (investments.reduce((sum, inv) => sum + inv.expected_return, 0) / investments.length).toFixed(1) : 0}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {investments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, color: 'rgba(255,255,255,0.7)' }}>
                  <Box sx={{ fontSize: 64, mb: 2 }}>📈</Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>No investments yet</Typography>
                  <Typography variant="body1">Start building your portfolio by making your first investment</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ background: 'rgba(184, 24, 24, 0.03)', borderRadius: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Investment</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Type</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Amount</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Annual Expected Return</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Date Invested</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {investments.map(inv => (
                        <TableRow key={inv._id} hover>
                          <TableCell sx={{ color: 'white' }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="subtitle2" fontWeight={700}>{inv.company || 'N/A'}</Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>{inv.type}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: 'white' }}>{inv.type}</TableCell>
                          <TableCell sx={{ color: 'white' }}>{formatCurrency(inv.amount)}</TableCell>
                          <TableCell sx={{ color: inv.expected_return >= 0 ? 'success.main' : 'error.main', fontWeight: 700 }}>{inv.expected_return}%</TableCell>
                          <TableCell sx={{ color: 'white' }}>{formatDate(inv.date_invested)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </motion.div>
        </Box>
      </Box>
    </motion.div>
  );
}

export default Dashboard; 