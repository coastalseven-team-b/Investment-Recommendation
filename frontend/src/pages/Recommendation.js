import React, { useState, useEffect } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import { useNavigate } from "react-router-dom";
import { Box, Card, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert, CircularProgress } from "@mui/material";
import { motion } from "framer-motion";

function Recommendation() {
  const [recs, setRecs] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [rtcRecs, setRtcRecs] = useState(null);
  const [rtcMsg, setRtcMsg] = useState("");
  const [rtcLoading, setRtcLoading] = useState(false);
  const [tenure, setTenure] = useState("");
  const [capital, setCapital] = useState("");
  const [profile, setProfile] = useState(null);
  const [behavior, setBehavior] = useState(null);
  const [prereqMsg, setPrereqMsg] = useState("");
  const [prereq, setPrereq] = useState({ risk: false, behavior: false });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrereqs = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      // If user skipped info, show basic recommendations
      if (typeof window !== 'undefined' && localStorage.getItem('skipped_risk_profile') === 'true') {
        setPrereqMsg('You are seeing basic recommendations. Fill in your details for personalized suggestions.');
        setRecs([
          { name: 'Index Fund', desc: 'A diversified, low-cost investment option.' },
          { name: 'Fixed Deposit', desc: 'Safe, guaranteed returns.' },
          { name: 'Blue Chip Stocks', desc: 'Stable, established companies.' }
        ]);
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const profileRes = await axios.get("/api/profile", { headers });
        setProfile(profileRes.data);
        let riskOk = profileRes.data.risk_profile_completed && profileRes.data.risk_level && profileRes.data.investment_goal;
        let behaviorOk = false;
        try {
          const txRes = await axios.get("/api/transactions", { headers });
          setBehavior(txRes.data.behavior);
          behaviorOk = txRes.data.behavior && txRes.data.behavior.toLowerCase() !== 'unknown';
        } catch {
          behaviorOk = false;
        }
        setPrereq({ risk: riskOk, behavior: behaviorOk });
        if (!riskOk && !behaviorOk) setPrereqMsg("Please complete your risk profile and upload your bank statement before getting recommendations.");
        else if (!riskOk) setPrereqMsg("Please complete your risk profile before getting recommendations.");
        else if (!behaviorOk) setPrereqMsg("Please upload your bank statement before getting recommendations.");
        else setPrereqMsg("");
      } catch {
        setPrereqMsg("Failed to load user profile. Please log in again.");
      }
    };
    fetchPrereqs();
  }, []);

  const handleGetRecommendations = async () => {
    setMsg("");
    setRecs(null);
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setMsg("You are not logged in. Please log in again.");
      setLoading(false);
      setTimeout(() => navigate("/login"), 1500);
      return;
    }
    try {
      const res = await axios.post("/api/recommend", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecs(res.data.suggestions);
    } catch (e) {
      if (e.response && (e.response.status === 401 || (e.response.data && (e.response.data.msg || e.response.data.error) && String(e.response.data.msg || e.response.data.error).toLowerCase().includes("segment")))) {
        setMsg("Session expired or invalid. Please log in again.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setMsg(e.response?.data?.error || e.response?.data?.msg || "Failed to get recommendations");
      }
    }
    setLoading(false);
  };

  const handleGetRtcRecommendations = async () => {
    setRtcMsg("");
    setRtcRecs(null);
    const t = parseInt(tenure);
    const c = parseInt(capital);
    if (isNaN(t) || t < 1 || t > 10) {
      setRtcMsg("Tenure must be between 1 and 10");
      return;
    }
    if (isNaN(c) || c < 1000 || c > 100000) {
      setRtcMsg("Capital must be between 1000 and 100000");
      return;
    }
    setRtcLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setRtcMsg("You are not logged in. Please log in again.");
      setTimeout(() => navigate("/login"), 1500);
      setRtcLoading(false);
      return;
    }
    try {
      const res = await axios.post("/api/recommend-rtc", { tenure: t, capital: c }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRtcRecs(res.data.suggestions);
    } catch (e) {
      if (e.response && (e.response.status === 401 || (e.response.data && (e.response.data.msg || e.response.data.error) && String(e.response.data.msg || e.response.data.error).toLowerCase().includes("segment")))) {
        setRtcMsg("Session expired or invalid. Please log in again.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setRtcMsg(e.response?.data?.error || e.response?.data?.msg || "Failed to get recommendations");
      }
    }
    setRtcLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <NavBar />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Box sx={{ maxWidth: 1000, mx: 'auto', px: 2 }}>
          {prereqMsg && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, type: "spring" }}
            >
              <Card elevation={8} sx={{ borderRadius: 4, p: 4, mb: 4, background: 'linear-gradient(90deg, #fff3cd 0%, #ffeeba 100%)', color: '#856404', border: '1px solid #ffeeba' }}>
                <Typography variant="h6" fontWeight={700}>{prereqMsg}</Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  {!prereq.risk && <Button onClick={() => navigate('/risk-profile')} variant="contained" color="primary">Go to Risk Profile</Button>}
                  {!prereq.behavior && <Button onClick={() => navigate('/bank-upload')} variant="contained" color="secondary">Go to Bank Upload</Button>}
                </Box>
              </Card>
            </motion.div>
          )}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <Card elevation={8} sx={{ borderRadius: 4, p: 4, mb: 4, background: 'linear-gradient(120deg, #232526 0%, #414345 100%)', color: 'white' }}>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 2, background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Recommendation using Financial Behavior, Risk Profile, and Goal
              </Typography>
              {/* If user skipped info, show basic recommendations */}
              {typeof window !== 'undefined' && localStorage.getItem('skipped_risk_profile') === 'true' ? (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>You are seeing basic recommendations. Fill in your details for personalized suggestions.</Alert>
                  <ul>
                    <li><b>Index Fund</b>: A diversified, low-cost investment option.</li>
                    <li><b>Fixed Deposit</b>: Safe, guaranteed returns.</li>
                    <li><b>Blue Chip Stocks</b>: Stable, established companies.</li>
                  </ul>
                </Box>
              ) : (
                <Button onClick={handleGetRecommendations} disabled={loading || !prereq.risk || !prereq.behavior} variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 700, mb: 2 }}>
                  {loading ? <CircularProgress size={22} color="inherit" /> : "Get Recommendations"}
                </Button>
              )}
              {msg && <Alert severity="error" sx={{ mb: 2 }}>{msg}</Alert>}
              {recs && recs.length > 0 && (
                <TableContainer component={Paper} sx={{ background: 'rgba(255,255,255,0.03)', borderRadius: 3, mt: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Name</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Type</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Risk</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Expected Return</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recs.map((r, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ color: 'white' }}>{r.name}</TableCell>
                          <TableCell sx={{ color: 'white' }}>{r.type}</TableCell>
                          <TableCell sx={{ color: 'white' }}>{r.risk}</TableCell>
                          <TableCell sx={{ color: 'white' }}>{r.expected_return}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, type: "spring" }}
          >
            <Card elevation={8} sx={{ borderRadius: 4, p: 4, mb: 4, background: 'linear-gradient(120deg, #232526 0%, #414345 100%)', color: 'white' }}>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 2, background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Recommendation using Risk, Tenure, and Capital
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Tenure (1-10)"
                  type="number"
                  value={tenure}
                  onChange={e => setTenure(e.target.value)}
                  variant="filled"
                  sx={{ minWidth: 140, bgcolor: 'rgba(255,255,255,0.05)', input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.7)' } }}
                  InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
                />
                <TextField
                  label="Capital (1000-100000)"
                  type="number"
                  value={capital}
                  onChange={e => setCapital(e.target.value)}
                  variant="filled"
                  sx={{ minWidth: 180, bgcolor: 'rgba(255,255,255,0.05)', input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.7)' } }}
                  InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
                />
                <Button onClick={handleGetRtcRecommendations} disabled={rtcLoading || !prereq.risk || !prereq.behavior} variant="contained" color="secondary" sx={{ borderRadius: 2, fontWeight: 700, minWidth: 200 }}>
                  {rtcLoading ? <CircularProgress size={22} color="inherit" /> : "Get Recommendations"}
                </Button>
              </Box>
              {rtcMsg && <Alert severity="error" sx={{ mb: 2 }}>{rtcMsg}</Alert>}
              {rtcRecs && rtcRecs.length > 0 && (
                <TableContainer component={Paper} sx={{ background: 'rgba(255,255,255,0.03)', borderRadius: 3, mt: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Name</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Type</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Risk</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Expected Return</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rtcRecs.map((r, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ color: 'white' }}>{r.name}</TableCell>
                          <TableCell sx={{ color: 'white' }}>{r.type}</TableCell>
                          <TableCell sx={{ color: 'white' }}>{r.risk}</TableCell>
                          <TableCell sx={{ color: 'white' }}>{r.expected_return}</TableCell>
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

export default Recommendation; 