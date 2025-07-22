import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Box, Card, TextField, Button, Typography, Alert, CircularProgress, Link, Divider } from "@mui/material";
import { motion } from "framer-motion";
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/api/login", { email, password });
      localStorage.setItem("token", res.data.token);
      // Fetch user profile to check for gender, age, region
      const profileRes = await axios.get("/api/profile", {
        headers: { Authorization: `Bearer ${res.data.token}` }
      });
      const profile = profileRes.data;
      // Removed onboarding check
      if (res.data.risk_profile_completed) {
        navigate("/dashboard");
      } else {
        navigate("/risk-profile");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        <Card elevation={8} sx={{ borderRadius: 4, p: 4, position: 'relative', overflow: 'visible', background: 'linear-gradient(120deg, #232526 0%, #414345 100%)', color: 'white' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <LockOutlinedIcon sx={{ fontSize: 48, color: 'primary.main', bgcolor: 'white', borderRadius: '50%', p: 1, boxShadow: 3 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} sx={{ background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
              Sign In
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Welcome back! Please login to your account.
            </Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              fullWidth
              variant="filled"
              sx={{ input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.7)' }, bgcolor: 'rgba(255,255,255,0.05)' }}
              InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              fullWidth
              variant="filled"
              sx={{ input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.7)' }, bgcolor: 'rgba(255,255,255,0.05)' }}
              InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 2, borderRadius: 2, fontWeight: 700, boxShadow: 3 }}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
            </Button>
          </Box>
          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>OR</Typography>
          </Divider>
          <Typography align="center" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            New user?{' '}
            <Link component={RouterLink} to="/register" color="secondary" fontWeight={700} underline="hover">
              Register here
            </Link>
          </Typography>
        </Card>
      </motion.div>
    </Box>
  );
}

export default Login; 