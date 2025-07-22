---
title: Project Description
---

# 1. Project Title {#project-title}

Personalized Investment Recommendation App for Bank Customers

# 2. Objective {#objective}

To develop a smart, user-friendly application that analyzes customer
financial behavior, assesses risk profiles, and recommends suitable
mutual funds and stocks. The app also allows users to simulate
portfolios, track performance, and improve their financial literacy
through tips and suggestions.

# 3. Team Roles {#team-roles}

\- 2 Frontend Developers (React)  
- 1 Backend Developer (Python with Flask/FastAPI)  
- 1 Database Developer (MongoDB)  
- 1 AI/ML Developer (Rule-based or Scikit-learn based model)

# 4. Key Features & Technologies {#key-features-technologies}

- \- Customer Risk Profiling: Frontend (React)

- \- Bank Account Sync (Simulated): Backend (Flask/FastAPI)

- \- Mutual Fund & Stock Suggestion: AI/ML (Scikit-learn or rule-based)

- \- Simulated Portfolio: Frontend + Backend + MongoDB

- \- Performance Tracking: API + AI Module

- \- Educational Tips: Frontend (React) + Tips Dataset

# 5. MongoDB Schema Design {#mongodb-schema-design}

1.  1\. users: Stores user info, age, email, password, and joined date.

2.  2\. risk_profiles: Stores user answers, risk score, risk level, and
    investment goals.

3.  3\. bank_transactions: Stores credit/debit/investment transactions
    for analysis.

4.  4\. investment_options: Stores stocks and mutual funds with
    metadata.

5.  5\. simulated_portfolio: Tracks user's virtual investment data and
    returns.

6.  6\. financial_tips: Stores financial tips mapped by risk level.

7.  7\. ai_classifications: Optional classification of users as Saver,
    Spender, or Investor.

# 6. Risk Profiling Questionnaire {#risk-profiling-questionnaire}

A 7-question form used to assess the user\'s risk-taking ability and
investment style. Based on the score:

- \- 7--15 → Low Risk  
  - 16--25 → Medium Risk  
  - 26--35 → High Risk

# 7. Purpose of Simulated Bank Data {#purpose-of-simulated-bank-data}

Simulated bank transactions allow analysis of income, expenses, savings,
and investments to classify user financial behavior. This supports
investment recommendations even without real bank data.

# 8. Financial Behavior Classification {#financial-behavior-classification}

Using rule-based logic or ML, users are classified into:  
- Saver  
- Spender  
- Investor  
  
This is derived from spending, saving, and investment rates calculated
from their transaction history.

# 9. Why Simulated Portfolio is Needed {#why-simulated-portfolio-is-needed}

Simulated portfolios provide a risk-free environment for users to test
and track virtual investments. It also helps validate the recommendation
engine and improve user engagement by visualizing growth over time.

# 10. Datasets Used {#datasets-used}

\- risk_profiles.json  
- bank_data.csv  
- investment_options.json  
- portfolio.json  
- tips.json

Generated on: 2025-07-02 05:00:32
