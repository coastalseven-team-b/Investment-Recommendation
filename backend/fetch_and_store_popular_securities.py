import requests
from pymongo import MongoClient
import time
from datetime import datetime, timedelta
import yfinance as yf

API_KEY = 'QPSLL26EW6QMATHZ'

# Top US/global stocks for dropdown
popular_stocks = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK-B', 'JPM', 'V',
    'UNH', 'HD', 'PG', 'MA', 'DIS', 'BAC', 'VZ', 'ADBE', 'NFLX', 'PFE'
]
# Top US/global mutual funds for dropdown
popular_mutual_funds = [
    'VFIAX', 'SWPPX', 'FXAIX', 'VTSAX', 'VIGAX', 'VSMAX', 'VBTLX', 'FZROX', 'SWISX', 'VIMAX'
]

client = MongoClient('mongodb://localhost:27017/')
db = client['investment_app']
collection = db['investment_options']

# Remove all previous companies
collection.delete_many({})

def fetch_overview(symbol):
    url = f'https://www.alphavantage.co/query?function=OVERVIEW&symbol={symbol}&apikey={API_KEY}'
    r = requests.get(url)
    if r.status_code == 200:
        return r.json()
    return None

def fetch_yearly_return_yahoo(symbol):
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1y")
        if hist.empty:
            return "N/A"
        first_close = hist["Close"].iloc[0]
        last_close = hist["Close"].iloc[-1]
        if first_close == 0:
            return "N/A"
        yearly_return = ((last_close - first_close) / first_close) * 100
        return round(yearly_return, 2)
    except Exception as e:
        print(f"Yahoo error for {symbol}: {e}")
        return "N/A"

def upsert_security(symbol, sec_type):
    data = fetch_overview(symbol)
    # Fallback: if no data, use symbol as name
    if not data or 'Symbol' not in data:
        print(f"No data for {symbol}, using fallback.")
        expected_return = fetch_yearly_return_yahoo(symbol)
        doc = {
            'investment_id': symbol,
            'name': symbol,
            'type': sec_type,
            'risk': 'Medium',
            'expected_return': expected_return,
            'sector': '',
            'industry': '',
            'description': '',
        }
        collection.update_one({'investment_id': symbol}, {'$set': doc}, upsert=True)
        print(f"Upserted {sec_type}: {symbol} (Return: {doc['expected_return']}%) [fallback]")
        return
    mapped_type = 'Stock' if sec_type.lower() == 'equity' else sec_type
    expected_return = fetch_yearly_return_yahoo(symbol)
    doc = {
        'investment_id': symbol,
        'name': data.get('Name', symbol),
        'type': mapped_type,
        'risk': 'Medium',
        'expected_return': expected_return,
        'sector': data.get('Sector', ''),
        'industry': data.get('Industry', ''),
        'description': data.get('Description', ''),
    }
    collection.update_one({'investment_id': symbol}, {'$set': doc}, upsert=True)
    print(f"Upserted {mapped_type}: {symbol} - {doc['name']} (Return: {doc['expected_return']}%)")

def main():
    print('Fetching and storing popular stocks...')
    for symbol in popular_stocks:
        upsert_security(symbol, 'Stock')
        time.sleep(2)
    print('Fetching and storing popular mutual funds...')
    for symbol in popular_mutual_funds:
        upsert_security(symbol, 'Mutual Fund')
        time.sleep(2)
    print('Done.')

if __name__ == '__main__':
    main() 