import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { Box, Card, Typography, Button, Radio, RadioGroup, FormControl, FormControlLabel, Select, MenuItem, Alert, InputLabel, FormHelperText } from "@mui/material";
import { motion } from "framer-motion";

const questions = [
  { q: "How would you describe your investment knowledge?", options: [
    { text: "None", score: 1 },
    { text: "Basic", score: 2 },
    { text: "Intermediate", score: 3 },
    { text: "Advanced", score: 4 }
  ]},
  { q: "What is your investment horizon?", options: [
    { text: "<1 year", score: 1 },
    { text: "1-3 years", score: 2 },
    { text: "3-5 years", score: 3 },
    { text: ">5 years", score: 4 }
  ]},
  { q: "How do you react to market volatility?", options: [
    { text: "Very anxious", score: 1 },
    { text: "Somewhat concerned", score: 2 },
    { text: "Neutral", score: 3 },
    { text: "Confident", score: 4 }
  ]},
  { q: "What is your primary investment goal?", options: [
    { text: "Preserve capital", score: 1 },
    { text: "Steady income", score: 2 },
    { text: "Growth", score: 3 },
    { text: "Aggressive growth", score: 4 }
  ]},
  { q: "How much of your income can you invest?", options: [
    { text: "<10%", score: 1 },
    { text: "10-20%", score: 2 },
    { text: "20-40%", score: 3 },
    { text: ">40%", score: 4 }
  ]},
  { q: "How would you react to a 20% loss?", options: [
    { text: "Sell everything", score: 1 },
    { text: "Sell some", score: 2 },
    { text: "Hold", score: 3 },
    { text: "Buy more", score: 4 }
  ]},
  { q: "What is your age group?", options: [
    { text: ">60", score: 1 },
    { text: "45-60", score: 2 },
    { text: "30-44", score: 3 },
    { text: "<30", score: 4 }
  ]}
];

function RiskProfile() {
  const [answers, setAnswers] = useState(Array(7).fill(null));
  const [goal, setGoal] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (qIdx, score) => {
    const newAns = [...answers];
    newAns[qIdx] = score;
    setAnswers(newAns);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (answers.some(a => a === null) || !goal) {
      setError("Please answer all questions and enter your investment goal.");
      return;
    }
    const total = answers.reduce((a, b) => a + b, 0);
    let risk_level = "Low";
    if (total >= 22) risk_level = "High";
    else if (total >= 15) risk_level = "Medium";
    try {
      await axios.post("/api/risk-profile", {
        risk_score: total,
        risk_level,
        investment_goal: goal
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      localStorage.removeItem('skipped_risk_profile');
      navigate("/dashboard");
    } catch (err) {
      setError("Failed to save risk profile");
    }
  };

  return (
    <>
      <NavBar />
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{ width: '100%', maxWidth: 600 }}
        >
          <Card elevation={8} sx={{ borderRadius: 4, p: 4, background: 'linear-gradient(120deg, #232526 0%, #414345 100%)', color: 'white' }}>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 2, background: 'linear-gradient(90deg, #00c6ff 0%, #0072ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Risk Profiling Questionnaire
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
              {questions.map((q, i) => (
                <FormControl key={i} component="fieldset" sx={{ mb: 3, width: '100%' }} required>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>{i + 1}. {q.q}</Typography>
                  <RadioGroup row value={answers[i] || ''} onChange={e => handleChange(i, Number(e.target.value))}>
                    {q.options.map((opt, j) => (
                      <FormControlLabel
                        key={j}
                        value={opt.score}
                        control={<Radio sx={{ color: 'white' }} />}
                        label={<Typography sx={{ color: 'white' }}>{opt.text}</Typography>}
                        sx={{ mr: 3 }}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              ))}
              <FormControl fullWidth required sx={{ mb: 3 }}>
                <InputLabel id="goal-label" sx={{ color: 'rgba(255,255,255,0.7)' }}>Investment Goal</InputLabel>
                <Select
                  labelId="goal-label"
                  value={goal}
                  label="Investment Goal"
                  onChange={e => setGoal(e.target.value)}
                  sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.05)' }}
                >
                  <MenuItem value="">Select Investment Goal</MenuItem>
                  <MenuItem value="Retirement">Retirement</MenuItem>
                  <MenuItem value="Education">Education</MenuItem>
                  <MenuItem value="Emergency">Emergency</MenuItem>
                  <MenuItem value="Family">Family</MenuItem>
                  <MenuItem value="Wealth Creation">Wealth Creation</MenuItem>
                </Select>
                <FormHelperText sx={{ color: 'rgba(255,255,255,0.7)' }}>Choose your main investment goal</FormHelperText>
              </FormControl>
              <Button type="submit" variant="contained" color="primary" size="large" sx={{ borderRadius: 2, fontWeight: 700, boxShadow: 3, mt: 2 }} fullWidth>
                Submit
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                sx={{ borderRadius: 2, fontWeight: 700, boxShadow: 3, mt: 2, ml: 2 }}
                fullWidth
                onClick={() => {
                  localStorage.setItem('skipped_risk_profile', 'true');
                  navigate('/dashboard');
                }}
              >
                Skip Questionnaire
              </Button>
            </Box>
          </Card>
        </motion.div>
      </Box>
    </>
  );
}

export default RiskProfile; 