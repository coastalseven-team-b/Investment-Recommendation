import React, { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "../components/NavBar";
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert, CircularProgress } from "@mui/material";
import { motion } from "framer-motion";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

function BankUpload() {
  const [file, setFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [behavior, setBehavior] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      const txRes = await axios.get("/api/transactions", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setTransactions(txRes.data.transactions || txRes.data);
      setBehavior(txRes.data.behavior || null);
    } catch {
      setMsg("Failed to fetch transactions");
    }
  };

  useEffect(() => {
    fetchTransactions();
    // Check if transactions exist after fetching
    const checkBankUploaded = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const txRes = await axios.get("/api/transactions", { headers });
        const txs = txRes.data.transactions || txRes.data;
        if (Array.isArray(txs) && txs.length > 0) {
          localStorage.setItem('bank_uploaded', 'true');
        }
      } catch {}
    };
    checkBankUploaded();
  }, []);

  const handleFile = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("/api/transactions/upload", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data"
        }
      });
      setMsg(res.data.msg);
      setBehavior(res.data.financial_behavior_label || res.data.financial_behavior_score || null);
      localStorage.setItem('bank_uploaded', 'true');
      fetchTransactions();
    } catch (err) {
      setMsg("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, ease: "backOut" }}
    >
      <NavBar />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Box sx={{ maxWidth: 900, mx: 'auto', px: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: "spring" }}
          >
            <Card elevation={8} sx={{ borderRadius: 4, p: 4, mb: 4, background: 'linear-gradient(120deg, #232526 0%, #414345 100%)', color: 'white' }}>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 2, background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Bank Data Upload / Sync
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  color="primary"
                  sx={{ borderRadius: 2, fontWeight: 700, boxShadow: 3 }}
                >
                  Choose File
                  <input type="file" accept=".csv" hidden onChange={handleFile} />
                </Button>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {file ? file.name : 'No file selected'}
                </Typography>
                <Button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  variant="contained"
                  color="secondary"
                  sx={{ borderRadius: 2, fontWeight: 700, ml: 2 }}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Upload'}
                </Button>
              </Box>
              {msg && <Alert severity={msg.includes('fail') ? 'error' : 'success'} sx={{ mb: 2 }}>{msg}</Alert>}
              {behavior && <Alert severity="info" sx={{ mb: 2 }}>User Financial Behavior: <b>{behavior}</b></Alert>}
            </Card>
          </motion.div>
          {transactions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
            >
              <Card elevation={6} sx={{ borderRadius: 3, p: 3, background: 'linear-gradient(120deg, #232526 0%, #414345 100%)', color: 'white' }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 2, color: 'white' }}>
                  Transactions
                </Typography>
                <TableContainer component={Paper} sx={{ background: 'rgba(255,255,255,0.03)', borderRadius: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Date</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Amount</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Description</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 700, background: 'rgba(0,0,0,0.2)' }}>Type</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map(tx => (
                        <TableRow key={tx._id} hover>
                          <TableCell sx={{ color: 'white' }}>{tx.date}</TableCell>
                          <TableCell sx={{ color: 'white' }}>{tx.amount}</TableCell>
                          <TableCell sx={{ color: 'white' }}>{tx.description}</TableCell>
                          <TableCell sx={{ color: 'white' }}>{tx.type}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </motion.div>
          )}
        </Box>
      </Box>
    </motion.div>
  );
}

export default BankUpload; 