import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Box, Card, TextField, Button, Typography, Alert, CircularProgress, Link, Divider, LinearProgress } from "@mui/material";
import { motion } from "framer-motion";
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password) => {
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'medium';
    return 'strong';
  };
  const passwordStrength = validatePassword(password);
  const passwordStrengthValue = password.length === 0 ? 0 : passwordStrength === 'weak' ? 33 : passwordStrength === 'medium' ? 66 : 100;
  const passwordStrengthColor = passwordStrength === 'weak' ? 'error' : passwordStrength === 'medium' ? 'warning' : 'success';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (/^\d/.test(name)) {
      setError("Username must not start with a number.");
      setLoading(false);
      return;
    }
    if (/^\d+$/.test(name)) {
      setError("Username cannot be all numbers.");
      setLoading(false);
      return;
    }
    if (/^\d/.test(email)) {
      setError("Invalid Email address. Please add a valid Email address");
      setLoading(false);
      return;
    }
    if (/^\d+$/.test(email)) {
      setError("Invalid Email address. Please add a valid Email address");
      setLoading(false);
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Invalid Email address. Please add a valid Email address");
      setLoading(false);
      return;
    }
    if (!/^[a-zA-Z0-9@.]+$/.test(email)) {
      setError("Invalid Email address. Please add a valid Email address");
      setLoading(false);
      return;
    }
    const emailParts = email.split('@');
    if (emailParts.length !== 2 || !/^[a-zA-Z0-9]+$/.test(emailParts[0])) {
      setError("Invalid Email address. Please add a valid Email address");
      setLoading(false);
      return;
    }
    if (password !== rePassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    try {
      await axios.post("/api/register", { name, email, password });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ width: '100%', maxWidth: 450 }}
      >
        <Card elevation={8} sx={{ borderRadius: 4, p: 4, position: 'relative', overflow: 'visible', background: 'linear-gradient(120deg, #232526 0%, #414345 100%)', color: 'white' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
              <PersonAddAlt1Icon sx={{ fontSize: 48, color: 'secondary.main', bgcolor: 'white', borderRadius: '50%', p: 1, boxShadow: 3 }} />
            </Box>
            <Typography variant="h4" fontWeight={700} sx={{ background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
              Create Account
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Join thousands of smart investors
            </Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Full Name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              fullWidth
              variant="filled"
              sx={{ input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.7)' }, bgcolor: 'rgba(255,255,255,0.05)' }}
              InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
            />
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
              helperText={password && `Password strength: ${passwordStrength}`}
            />
            {password && (
              <LinearProgress variant="determinate" value={passwordStrengthValue} color={passwordStrengthColor} sx={{ height: 6, borderRadius: 2, mb: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
            )}
            <TextField
              label="Confirm Password"
              type="password"
              value={rePassword}
              onChange={e => setRePassword(e.target.value)}
              required
              fullWidth
              variant="filled"
              sx={{ input: { color: 'white' }, label: { color: 'rgba(255,255,255,0.7)' }, bgcolor: 'rgba(255,255,255,0.05)' }}
              InputLabelProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
              error={rePassword && password !== rePassword}
              helperText={rePassword && password !== rePassword ? 'Passwords do not match' : ''}
            />
            <Button
              type="submit"
              variant="contained"
              color="secondary"
              size="large"
              sx={{ mt: 2, borderRadius: 2, fontWeight: 700, boxShadow: 3 }}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
            </Button>
          </Box>
          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>OR</Typography>
          </Divider>
          <Typography align="center" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" color="primary" fontWeight={700} underline="hover">
              Sign In
            </Link>
          </Typography>
        </Card>
      </motion.div>
    </Box>
  );
}

export default Register; 