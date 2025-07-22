import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import debounce from "lodash.debounce";
import { Box, Card, Typography, Button, TextField, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert, CircularProgress, Autocomplete } from "@mui/material";
import { motion } from "framer-motion";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SellIcon from '@mui/icons-material/Sell';

function formatDate(date) {
  if (!date) return "-";
  try {
    const d = typeof date === 'string' ? new Date(date.replace(/Z?$/, 'Z')) : new Date(date);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  } catch {
    return "-";
  }
}

function getPeriodReturns(annualRate) {
  const r = annualRate / 100;
  return {
    monthly: ((Math.pow(1 + r, 1/12) - 1) * 100).toFixed(2),
    quarterly: ((Math.pow(1 + r, 1/4) - 1) * 100).toFixed(2),
    halfYearly: ((Math.pow(1 + r, 1/2) - 1) * 100).toFixed(2),
    yearly: (r * 100).toFixed(2)
  };
}

function Investment() {
  const [type, setType] = useState("Stock");
  const [amount, setAmount] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [investments, setInvestments] = useState([]);
  const [msg, setMsg] = useState("");
  const [options, setOptions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [stockQuery, setStockQuery] = useState("");
  const [stockSuggestions, setStockSuggestions] = useState([]);
  const [showStockSuggestions, setShowStockSuggestions] = useState(false);
  const [mfQuery, setMfQuery] = useState("");
  const [mfSuggestions, setMfSuggestions] = useState([]);
  const [showMfSuggestions, setShowMfSuggestions] = useState(false);
  const [virtualBalance, setVirtualBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchInvestments = async () => {
    const res = await axios.get("/api/investments", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    setInvestments(res.data);
  };

  const fetchOptions = async (t) => {
    const res = await axios.get(`/api/investment-options?type=${t}`);
    setOptions(res.data);
    setSelectedCompany("");
    setExpectedReturn("");
  };

  // Debounced stock search
  const fetchStockSuggestions = debounce(async (query) => {
    try {
      const res = await axios.get(`/api/stocks/search?query=${encodeURIComponent(query || '')}`);
      setStockSuggestions(res.data);
    } catch {
      setStockSuggestions([]);
    }
  }, 400);

  // Debounced mutual fund search
  const fetchMfSuggestions = debounce(async (query) => {
    try {
      const res = await axios.get(`/api/mutualfunds/search?query=${encodeURIComponent(query || '')}`);
      setMfSuggestions(res.data);
    } catch {
      setMfSuggestions([]);
    }
  }, 400);

  useEffect(() => {
    fetchInvestments();
    fetchOptions(type);
    // Fetch user profile for virtual balance
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get("/api/profile", { headers });
        setVirtualBalance(res.data.virtual_balance);
      } catch {
        setVirtualBalance(null);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchOptions(type);
  }, [type]);

  useEffect(() => {
    if (type === "Stock") {
      fetchStockSuggestions(stockQuery);
    }
  }, [stockQuery, type]);

  useEffect(() => {
    if (type === "Mutual Fund") {
      fetchMfSuggestions(mfQuery);
    }
  }, [mfQuery, type]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!type || !selectedCompany || !amount || !expectedReturn) {
      setMsg("All fields are required.");
      return;
    }
    let cleanReturn = expectedReturn;
    if (typeof cleanReturn === "string") {
      cleanReturn = cleanReturn.replace("%", "").trim();
    }
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      setMsg("Amount must be a positive number.");
      return;
    }
    if (virtualBalance !== null && amt > virtualBalance) {
      setMsg("Insufficient funds: amount exceeds your virtual balance.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/investments", {
        type,
        company: selectedCompany,
        amount: amt,
        expected_return: Number(cleanReturn)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setMsg("Investment added");
      setAmount("");
      setExpectedReturn("");
      setSelectedCompany("");
      fetchInvestments();
      // Update balance after investment
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get("/api/profile", { headers });
      setVirtualBalance(res.data.virtual_balance);
    } catch {
      setMsg("Failed to add investment");
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async (id) => {
    setLoading(true);
    try {
      await axios.post(`/api/investments/${id}/sell`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setMsg("Investment sold");
      fetchInvestments();
    } catch {
      setMsg("Failed to sell investment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, rotateY: 90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      exit={{ opacity: 0, rotateY: 90 }}
      transition={{ duration: 0.6, ease: "anticipate" }}
      style={{ perspective: 1000 }}
    >
      <NavBar />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Box sx={{ maxWidth: 1000, mx: 'auto', px: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: "spring" }}
          >
            <Card elevation={8} sx={{ borderRadius: 4, p: 4, mb: 4, background: 'linear-gradient(120deg, #232526 0%, #414345 100%)', color: 'white' }}>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 2, background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Virtual Investments
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}>
                Virtual Balance: ₹{virtualBalance !== null ? virtualBalance : '...'}
              </Typography>
              <Box component="form" onSubmit={handleAdd} autoComplete="off" sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
                <Select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  variant="filled"
                  sx={{ minWidth: 140, bgcolor: 'rgba(255,255,255,0.05)', color: 'white' }}
                >
                  <MenuItem value="Stock">Stock</MenuItem>
                  <MenuItem value="Mutual Fund">Mutual Fund</MenuItem>
                </Select>
                {type === "Stock" ? (
                  <Autocomplete
                    freeSolo
                    options={stockSuggestions.map(s => s.name)}
                    inputValue={stockQuery}
                    onInputChange={(_, newInputValue) => setStockQuery(newInputValue)}
                    onChange={(_, newValue) => {
                      setSelectedCompany(newValue || "");
                      const found = stockSuggestions.find(s => s.name === newValue);
                      if (found && found.expected_return !== undefined) setExpectedReturn(String(found.expected_return));
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Search Stock" variant="filled" sx={{ bgcolor: 'rgba(255,255,255,0.05)', minWidth: 200, input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.7)' } }} InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }} />
                    )}
                  />
                ) : (
                  <Autocomplete
                    freeSolo
                    options={mfSuggestions.map(f => f.name)}
                    inputValue={mfQuery}
                    onInputChange={(_, newInputValue) => setMfQuery(newInputValue)}
                    onChange={(_, newValue) => {
                      setSelectedCompany(newValue || "");
                      const found = mfSuggestions.find(f => f.name === newValue);
                      if (found && found.expected_return !== undefined) setExpectedReturn(String(found.expected_return));
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Search Mutual Fund" variant="filled" sx={{ bgcolor: 'rgba(255,255,255,0.05)', minWidth: 200, input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.7)' } }} InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }} />
                    )}
                  />
                )}
                <TextField
                  type="number"
                  label="Amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  variant="filled"
                  sx={{ minWidth: 120, bgcolor: 'rgba(255,255,255,0.05)', input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.7)' } }}
                  InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
                />
                {/* Show expected returns breakdown if a company is selected and expectedReturn is available */}
                {selectedCompany && expectedReturn && !isNaN(Number(expectedReturn)) && (
                  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3, alignItems: 'center', bgcolor: 'rgba(255,255,255,0.07)', borderRadius: 2, px: 2, py: 1, mb: 1 }}>
                    {(() => {
                      const returns = getPeriodReturns(Number(expectedReturn));
                      return (
                        <>
                          <Typography variant="body2" sx={{ color: 'white' }}>Monthly: <b>{returns.monthly}%</b></Typography>
                          <Typography variant="body2" sx={{ color: 'white' }}>Quarterly: <b>{returns.quarterly}%</b></Typography>
                          <Typography variant="body2" sx={{ color: 'white' }}>Half-Yearly: <b>{returns.halfYearly}%</b></Typography>
                          <Typography variant="body2" sx={{ color: 'white' }}>Yearly: <b>{returns.yearly}%</b></Typography>
                        </>
                      );
                    })()}
                  </Box>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<AddCircleOutlineIcon />}
                  sx={{ borderRadius: 2, fontWeight: 700, boxShadow: 3, minWidth: 180 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : "Add Investment"}
                </Button>
              </Box>
              {msg && <Alert severity={msg.includes('fail') ? 'error' : msg.includes('added') ? 'success' : 'info'} sx={{ mb: 2 }}>{msg}</Alert>}
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <Card elevation={6} sx={{ borderRadius: 3, p: 3, background: 'linear-gradient(120deg, #232526 0%, #414345 100%)', color: 'white' }}>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 2, color: 'white' }}>
                Current Investments
              </Typography>
              <TableContainer component={Paper} sx={{ background: 'rgba(255,255,255,0.03)', borderRadius: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Type</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Company</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Amount</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Monthly Return %</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Quarterly Return %</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Half-Yearly Return %</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Yearly Return %</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Date Invested</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {investments.map(inv => {
                      const returns = getPeriodReturns(inv.expected_return);
                      return (
                        <TableRow key={inv._id} hover>
                          <TableCell sx={{ color: 'white' }}>{inv.type}</TableCell>
                          <TableCell sx={{ color: 'white' }}>{inv.company || "-"}</TableCell>
                          <TableCell sx={{ color: 'white' }}>{inv.amount}</TableCell>
                          <TableCell sx={{ color: 'white' }}>{returns.monthly}%</TableCell>
                          <TableCell sx={{ color: 'white' }}>{returns.quarterly}%</TableCell>
                          <TableCell sx={{ color: 'white' }}>{returns.halfYearly}%</TableCell>
                          <TableCell sx={{ color: 'white' }}>{returns.yearly}%</TableCell>
                          <TableCell sx={{ color: 'white' }}>{formatDate(inv.date_invested)}</TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleSell(inv._id)}
                              variant="contained"
                              color="secondary"
                              startIcon={<SellIcon />}
                              sx={{ borderRadius: 2, fontWeight: 700 }}
                              disabled={loading}
                            >
                              Sell
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </motion.div>
        </Box>
      </Box>
    </motion.div>
  );
}

export default Investment; 