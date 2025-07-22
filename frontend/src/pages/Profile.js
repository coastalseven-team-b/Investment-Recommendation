import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { motion } from "framer-motion";

const RISK_LEVELS = ["Low", "Medium", "High"];
const GOALS = ["Retirement", "Education", "Emergency", "Family", "Wealth Creation"];
const BEHAVIORS = ["Saver", "Spender", "Investor"];

const Container = styled.div`
  background: ${({ theme }) => theme.background};
  color: black;
  min-height: 100vh;
  padding: 32px;
`;
const Card = styled.div`
  background: ${({ theme }) => theme.card};
  padding: 32px;
  border-radius: 8px;
  margin-bottom: 24px;
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
  margin-right: ${({ theme }) => theme.spacing.md};
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
const Error = styled.div`
  color: ${({ theme }) => theme.accent};
  margin-bottom: 10px;
`;
const Input = styled.input`
  background: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.textPrimary};
  border: 1px solid ${({ theme }) => theme.cardBorder};
  padding: 10px;
  margin: 8px 0;
  border-radius: 4px;
  font-size: 15px;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.primary}30;
  }
`;

function Profile() {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdData, setPwdData] = useState({ current: "", next: "", repeat: "" });
  const [pwdError, setPwdError] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchProfile = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.get("/api/profile", { headers });
        setProfile(res.data);
        setEditData({
          name: res.data.name || "",
          email: res.data.email || "",
          risk_level: res.data.risk_level || "",
          investment_goal: res.data.investment_goal || "",
          financial_behavior: res.data.financial_behavior || ""
        });
      } catch {
        setError("Failed to load profile");
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleEdit = () => {
    setEditMode(true);
    setMsg("");
    setError("");
  };
  const handleCancel = () => {
    setEditMode(false);
    setMsg("");
    setError("");
  };
  const handleChange = e => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };
  const handleSave = async () => {
    setMsg("");
    setError("");
    // Validation: all fields required
    if (!editData.name || !editData.email || !editData.risk_level || !editData.investment_goal || !editData.financial_behavior) {
      setError("All fields are required.");
      return;
    }
    // Username validation: must not start with a number and not be all numbers
    if (/^\d/.test(editData.name)) {
      setError("Username must not start with a number.");
      return;
    }
    if (/^\d+$/.test(editData.name)) {
      setError("Username cannot be all numbers.");
      return;
    }
    // Email validation: must not start with a number and not be all numbers
    if (/^\d/.test(editData.email)) {
      setError("Email must not start with a number and must be a valid email address.");
      return;
    }
    if (/^\d+$/.test(editData.email)) {
      setError("Email cannot be all numbers and must be a valid email address.");
      return;
    }
    // Email format validation
    if (!/^\S+@\S+\.\S+$/.test(editData.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    // Email should only contain letters, numbers, @ and .
    if (!/^[a-zA-Z0-9@.]+$/.test(editData.email)) {
      setError("Email can only contain letters, numbers, @ and .");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post("/api/profile", editData, { headers });
      setMsg("Profile updated");
      setEditMode(false);
      setProfile({ ...profile, ...editData });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
    }
  };
  // Password change logic
  const handlePwdChange = e => {
    setPwdData({ ...pwdData, [e.target.name]: e.target.value });
  };
  const handlePwdSubmit = async e => {
    e.preventDefault();
    setPwdError("");
    setPwdMsg("");
    if (pwdData.next !== pwdData.repeat) {
      setPwdError("New passwords do not match.");
      return;
    }
    if (pwdData.current === pwdData.next) {
      setPwdError("New password must be different from current password.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post("/api/change-password", {
        current_password: pwdData.current,
        new_password: pwdData.next
      }, { headers });
      setPwdMsg("Password changed successfully");
      setShowPwd(false);
      setPwdData({ current: "", next: "", repeat: "" });
    } catch (err) {
      setPwdError(err.response?.data?.error || "Failed to change password");
    }
  };

  if (!profile) return <><NavBar /><Container>Loading...</Container></>;

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, y: 80 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: -80, y: 80 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <NavBar />
      <Container>
        <Card>
          <h2>Profile</h2>
          {msg && <div style={{ color: '#388e3c', marginBottom: 8 }}>{msg}</div>}
          {error && <Error>{error}</Error>}
          {!editMode ? (
            <>
              <div><b>Name:</b> {profile.name}</div>
              <div><b>Email:</b> {profile.email}</div>
              <div><b>Risk Level:</b> {profile.risk_level || '-'}</div>
              <div><b>Investment Goal:</b> {profile.investment_goal || '-'}</div>
              <div><b>Financial Behavior:</b> {profile.financial_behavior || '-'}</div>
              <Button onClick={handleEdit}>Edit</Button>
              <Button style={{ marginLeft: 16, background: '#1976d2' }} onClick={() => setShowPwd(true)}>Change Password</Button>
            </>
          ) : (
            <>
              <Input name="name" value={editData.name} onChange={handleChange} placeholder="Name" />
              <Input name="email" value={editData.email} onChange={handleChange} placeholder="Email" />
              <select name="risk_level" value={editData.risk_level} onChange={handleChange} style={{margin: '8px 0', padding: 10, borderRadius: 4}}>
                <option value="">Select Risk Level</option>
                {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select name="investment_goal" value={editData.investment_goal} onChange={handleChange} style={{margin: '8px 0', padding: 10, borderRadius: 4}}>
                <option value="">Select Investment Goal</option>
                {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select name="financial_behavior" value={editData.financial_behavior} onChange={handleChange} style={{margin: '8px 0', padding: 10, borderRadius: 4}}>
                <option value="">Select Financial Behavior</option>
                {BEHAVIORS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <Button onClick={handleSave}>Save</Button>
              <Button style={{ marginLeft: 16, background: '#e53935' }} onClick={handleCancel}>Cancel</Button>
            </>
          )}
        </Card>
        {showPwd && (
          <Card>
            <h3>Change Password</h3>
            {pwdError && <Error>{pwdError}</Error>}
            {pwdMsg && <div style={{ color: '#388e3c', marginBottom: 8 }}>{pwdMsg}</div>}
            <form onSubmit={handlePwdSubmit}>
              <Input
                type="password"
                name="current"
                value={pwdData.current}
                onChange={handlePwdChange}
                placeholder="Current Password"
                required
              />
              <Input
                type="password"
                name="next"
                value={pwdData.next}
                onChange={handlePwdChange}
                placeholder="New Password"
                required
              />
              <Input
                type="password"
                name="repeat"
                value={pwdData.repeat}
                onChange={handlePwdChange}
                placeholder="Retype New Password"
                required
              />
              <Button type="submit">Change Password</Button>
              <Button style={{ marginLeft: 16, background: '#e53935' }} type="button" onClick={() => setShowPwd(false)}>Cancel</Button>
            </form>
          </Card>
        )}
      </Container>
    </motion.div>
  );
}

export default Profile; 