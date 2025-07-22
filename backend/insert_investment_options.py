import random
from pymongo import MongoClient

investment_options = [
    {"id": "MF001", "name": "Axis Bluechip Fund", "risk": "Low"},
    {"id": "MF002", "name": "HDFC Balanced Advantage", "risk": "Medium"},
    {"id": "MF003", "name": "Tata Digital India Fund", "risk": "High"},
    {"id": "MF004", "name": "ICICI Liquid Fund", "risk": "Low"},
    {"id": "MF005", "name": "Nippon Small Cap Fund", "risk": "High"},
    {"id": "MF006", "name": "SBI Equity Hybrid Fund", "risk": "Medium"},
    {"id": "MF007", "name": "Kotak Gold Fund", "risk": "Medium"},
    {"id": "MF008", "name": "Mirae Asset Large Cap Fund", "risk": "Low"},
    {"id": "MF009", "name": "DSP Midcap Fund", "risk": "High"},
    {"id": "MF010", "name": "UTI Flexi Cap Fund", "risk": "Medium"},
    {"id": "ST001", "name": "Infosys", "risk": "Medium"},
    {"id": "ST002", "name": "TCS", "risk": "Low"},
    {"id": "ST003", "name": "Reliance", "risk": "Medium"},
    {"id": "ST004", "name": "Adani Enterprises", "risk": "High"},
    {"id": "ST005", "name": "HDFC Bank", "risk": "Low"},
    {"id": "ST006", "name": "ITC", "risk": "Medium"},
    {"id": "ST007", "name": "Zomato", "risk": "High"},
    {"id": "ST008", "name": "IRCTC", "risk": "Medium"},
    {"id": "ST009", "name": "Hindustan Unilever", "risk": "Low"},
    {"id": "ST010", "name": "Bajaj Finance", "risk": "High"}
]

for opt in investment_options:
    opt['expected_return'] = f"{random.randint(2, 10)}%"
    opt['investment_id'] = opt.pop('id')
    opt['type'] = 'Mutual Fund' if opt['investment_id'].startswith('MF') else 'Stock'

client = MongoClient('mongodb://localhost:27017/')
db = client['investment_app']
db.investment_options.delete_many({})  # Optional: clear existing
result = db.investment_options.insert_many(investment_options)
print(f"Inserted {len(result.inserted_ids)} investment options.") 