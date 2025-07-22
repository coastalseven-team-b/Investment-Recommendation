import random
import json
import pandas as pd
from sklearn.model_selection import train_test_split

# Inputs
risk_levels = ["Low", "Medium", "High"]
investment_pool = [
    # Mutual Funds
    {"id": "MF001", "name": "Axis Bluechip Fund", "risk": "Low", "goals": ["Retirement", "Emergency"]},
    {"id": "MF002", "name": "HDFC Balanced Advantage", "risk": "Medium", "goals": ["Family", "Education"]},
    {"id": "MF003", "name": "Tata Digital India Fund", "risk": "High", "goals": ["Wealth Creation"]},
    {"id": "MF004", "name": "ICICI Liquid Fund", "risk": "Low", "goals": ["Emergency", "Retirement"]},
    {"id": "MF005", "name": "Nippon Small Cap Fund", "risk": "High", "goals": ["Wealth Creation", "Education"]},
    {"id": "MF006", "name": "SBI Equity Hybrid Fund", "risk": "Medium", "goals": ["Family", "Retirement"]},
    {"id": "MF007", "name": "Kotak Gold Fund", "risk": "Medium", "goals": ["Emergency", "Family"]},
    {"id": "MF008", "name": "Mirae Asset Large Cap Fund", "risk": "Low", "goals": ["Retirement", "Wealth Creation"]},
    {"id": "MF009", "name": "DSP Midcap Fund", "risk": "High", "goals": ["Wealth Creation", "Education"]},
    {"id": "MF010", "name": "UTI Flexi Cap Fund", "risk": "Medium", "goals": ["Education", "Family"]},
    {"id": "ST001", "name": "Infosys", "risk": "Medium", "goals": ["Wealth Creation", "Education"]},
    {"id": "ST002", "name": "TCS", "risk": "Low", "goals": ["Retirement", "Family"]},
    {"id": "ST003", "name": "Reliance", "risk": "Medium", "goals": ["Wealth Creation", "Retirement"]},
    {"id": "ST004", "name": "Adani Enterprises", "risk": "High", "goals": ["Wealth Creation"]},
    {"id": "ST005", "name": "HDFC Bank", "risk": "Low", "goals": ["Emergency", "Family"]},
    {"id": "ST006", "name": "ITC", "risk": "Medium", "goals": ["Wealth Creation", "Education"]},
    {"id": "ST007", "name": "Zomato", "risk": "High", "goals": ["Wealth Creation"]},
    {"id": "ST008", "name": "IRCTC", "risk": "Medium", "goals": ["Education", "Family"]},
    {"id": "ST009", "name": "Hindustan Unilever", "risk": "Low", "goals": ["Emergency", "Family"]},
    {"id": "ST010", "name": "Bajaj Finance", "risk": "High", "goals": ["Wealth Creation", "Retirement"]}
]

# Recommendation logic
def get_recommendations(risk, capital, tenure):
    # Filter by risk
    candidates = [i["id"] for i in investment_pool if i["risk"] == risk]

    # Apply simple heuristic filters
    if capital >= 50000 and tenure >= 5 and risk == "High":
        return random.sample(candidates, min(5, len(candidates)))
    elif capital <= 20000 and risk == "Low":
        return random.sample(candidates, min(3, len(candidates)))
    elif risk == "Medium" and 2 <= tenure <= 7:
        return random.sample(candidates, min(4, len(candidates)))
    else:
        return random.sample(candidates, min(3, len(candidates)))

# Generate dataset
def generate_data(num_samples=300):
    dataset = []
    for i in range(num_samples):
        risk = random.choice(risk_levels)
        tenure = random.randint(1, 10)  # 1 to 10 years (any number)
        capital = random.randint(1000, 100000)  # ₹1000 to ₹100000

        recs = get_recommendations(risk, capital, tenure)

        dataset.append({
            "user_id": f"U{i+1:03}",
            "risk_level": risk,
            "tenure": tenure,
            "capital": capital,
            "recommendations": recs
        })
    return dataset

# Generate 300 samples
full_data = generate_data(300)

# Split the dataset
train, temp = train_test_split(full_data, test_size=0.3, random_state=42)
val, test = train_test_split(temp, test_size=0.5, random_state=42)

# Save datasets
def save_json_csv(dataset, name):
    with open(f"{name}.json", "w") as f:
        json.dump(dataset, f, indent=2)


save_json_csv(train, "training_data")
save_json_csv(val, "validation_data")
save_json_csv(test, "testing_data")

print("✅ Dataset generated and saved as:")
print("- training_data.json / .csv (70%)")
print("- validation_data.json / .csv (15%)")
print("- testing_data.json / .csv (15%)")
