---
title: Page Structure, Questionnaire, Risk Logic & Sample Datasets
---

# 1. Pages and Content Outline {#pages-and-content-outline}

1.  1\. Login/Register Page: User authentication, basic details input,
    secure access to user dashboard.

2.  2\. Risk Profiling Questionnaire: Form with 7 multiple-choice
    questions to assess user risk level.

3.  3\. Dashboard: User overview, risk level, behavior type,
    recommendations, and portfolio summary.

4.  4\. Bank Data Upload/Sync Page: Upload dummy bank transactions or
    simulate spending patterns.

5.  5\. Investment Recommendations: Display top 3--5 suggested mutual
    funds/stocks based on risk & behavior.

6.  6\. Simulated Portfolio: Track virtual investments, performance
    metrics, and growth charts.

7.  7\. Financial Tips: Display personalized financial literacy tips
    based on user risk level.

8.  8\. Admin/Analytics Page (Optional): Admin view of user analytics,
    investment trends, ML insights.

# 2. Risk Profiling Questionnaire (with Scores) {#risk-profiling-questionnaire-with-scores}

- 1\. What is your age group?

<!-- -->

- a\) \< 25 (4)

- b\) 25--35 (3)

- c\) 36--50 (2)

- d\) \> 50 (1)

<!-- -->

- 2\. What is your investment goal?

<!-- -->

- a\) Wealth Growth (5)

- b\) Retirement (2)

- c\) Emergency Fund (1)

<!-- -->

- 3\. How would you react to a 10% drop in value?

<!-- -->

- a\) Buy more (5)

- b\) Hold (3)

- c\) Sell (1)

<!-- -->

- 4\. What is your primary income source?

<!-- -->

- a\) Business (4)

- b\) Job (3)

- c\) Pension (1)

<!-- -->

- 5\. How long can you stay invested?

<!-- -->

- a\) \<1 year (1)

- b\) 1--3 years (2)

- c\) 3--5 years (3)

- d\) 5+ years (5)

<!-- -->

- 6\. What % of income do you save?

<!-- -->

- a\) \<10% (1)

- b\) 10--25% (2)

- c\) 25--50% (3)

- d\) \>50% (4)

<!-- -->

- 7\. How familiar are you with investing?

<!-- -->

- a\) Beginner (1)

- b\) Intermediate (3)

- c\) Expert (5)

# 3. Risk Scoring Logic {#risk-scoring-logic}

Each option in the questionnaire is assigned a score from 1 to 5. The
sum of all answers gives the total risk score:  
- 7--15 → Low Risk  
- 16--25 → Medium Risk  
- 26--35 → High Risk

# 4. Financial Behavior Classification {#financial-behavior-classification}

User financial behavior is classified using bank transaction analysis:  
- Saver: Saving Rate ≥ 40%, Investment Rate \< 15%  
- Spender: Spending Rate ≥ 60%, Investment Rate \< 10%  
- Investor: Investment Rate ≥ 20%, Saving Rate ≥ 20%  
Saving Rate = (Income - Expenses - Investment) / Income  
Spending Rate = Expenses / Income  
Investment Rate = Investment / Income

# 5. Sample Dataset Examples {#sample-dataset-examples}

a\. risk_profiles.json

\[  
{\"user_id\": \"U001\", \"risk_score\": 13, \"risk_level\":
\"Medium\"},  
{\"user_id\": \"U002\", \"risk_score\": 6, \"risk_level\": \"Low\"}  
\]

b\. bank_data.csv

user_id,date,description,amount,type  
U001,2025-06-01,Salary,30000,Credit  
U001,2025-06-10,Grocery,-2500,Debit  
U001,2025-06-15,SIP,-5000,Investment

c\. investment_options.json

\[  
{\"investment_id\": \"MF001\", \"type\": \"Mutual Fund\", \"name\":
\"Axis Bluechip\", \"risk\": \"Low\", \"expected_return\": \"8%\"},  
{\"investment_id\": \"ST001\", \"type\": \"Stock\", \"name\":
\"Infosys\", \"risk\": \"Medium\", \"expected_return\": \"10%\"}  
\]

d\. portfolio.json

\[  
{\"user_id\": \"U001\", \"investment_id\": \"MF001\", \"amount\": 10000,
\"date_invested\": \"2025-07-01\", \"current_value\": 10400}  
\]

e\. tips.json

\[  
{\"risk_level\": \"Low\", \"tip\": \"Choose low-volatility mutual
funds.\"},  
{\"risk_level\": \"High\", \"tip\": \"Diversify across aggressive
equity.\"}  
\]

Generated on: 2025-07-02 05:11:18
