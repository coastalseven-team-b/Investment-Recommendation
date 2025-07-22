import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import NavBar from "../components/NavBar";
import { motion } from "framer-motion";

const Container = styled.div`
  background: ${({ theme }) => theme.background};
  color: black;
  min-height: 100vh;
  padding: 32px;
`;
const Card = styled.div`
  background: ${({ theme }) => theme.card};
  padding: 24px;
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
  const [profile, setProfile] = useState(null);
  const [behaviour, setBehaviour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      let profileData = null;
      let behaviourData = null;
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const profileRes = await axios.get("/api/profile", { headers });
        profileData = profileRes.data;
        setProfile(profileData);
      } catch (err) {
        setError("Failed to load user profile");
      }
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const behaviourRes = await axios.get("/api/financial-behaviour", { headers });
        behaviourData = behaviourRes.data.behaviour;
        setBehaviour(behaviourData);
      } catch (err) {
        // Ignore behaviour error, just don't set it
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const getTips = () => {
    if (typeof window !== 'undefined' && localStorage.getItem('skipped_risk_profile') === 'true') {
      return [
        'Diversify your investments to reduce risk.',
        'Consider starting with index funds or fixed deposits.',
        'Review your investments periodically.',
        'Avoid putting all your money in one asset class.'
      ];
    }
    if (!profile) return [];
    let tips = [];
    if (behaviour && tipsByBehaviour[behaviour]) tips = tips.concat(tipsByBehaviour[behaviour]);
    if (profile.risk_level && tipsByRisk[profile.risk_level]) tips = tips.concat(tipsByRisk[profile.risk_level]);
    if (profile.investment_goal && tipsByGoal[profile.investment_goal]) tips = tips.concat(tipsByGoal[profile.investment_goal]);
    return tips;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.4, ease: "backOut" }}
    >
      <NavBar />
      <Container>
        <Card>
          <h2>Personalized Financial Tips</h2>
          {loading && <div>Loading...</div>}
          {!loading && getTips().length === 0 && (
            <div style={{ color: '#e53935' }}>No tips available. Please complete your profile and risk assessment.</div>
          )}
          {!loading && getTips().length > 0 && (
            <ul>
              {getTips().map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          )}
        </Card>
      </Container>
    </motion.div>
  );
}

export default Tips; 