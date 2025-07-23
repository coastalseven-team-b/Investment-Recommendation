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
      <Container>
        {summary?.basic_tips ? (
          <Card>
            <h2>Tips</h2>
            {summary.missing_data && summary.missing_data.length > 0 && (
              <div style={{ marginBottom: 12, color: '#e53935' }}>
                {`To get detailed summaries and personalized tips, please add your: ${summary.missing_data.join(' and ')}.`}
              </div>
            )}
            <ul>
              {summary.basic_tips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </Card>
        ) : (
          <>
            <Card>
              <h2>Financial Behaviour Summary</h2>
              {loading ? <div>Loading...</div> : error ? <div style={{ color: '#e53935' }}>{error}</div> : <div>{summary?.financial_behavior_summary || 'No summary available.'}</div>}
            </Card>
            <Card>
              <h2>Investment Summary</h2>
              {loading ? <div>Loading...</div> : error ? <div style={{ color: '#e53935' }}>{error}</div> : <div>{summary?.investment_summary || 'No summary available.'}</div>}
            </Card>
            <Card>
              <h2>Tips for Future Investments</h2>
              {loading ? <div>Loading...</div> : error ? <div style={{ color: '#e53935' }}>{error}</div> : (
                <ul>
                  {Array.isArray(summary?.investment_tips)
                    ? summary.investment_tips.map((tip, i) => <li key={i}>{tip}</li>)
                    : (summary?.investment_tips || '').split(/\n|\r/).filter(Boolean).map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
              )}
            </Card>
          </>
        )}
      </Container>
    </motion.div>
  );
}

export default Tips; 