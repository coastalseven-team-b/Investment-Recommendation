from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import mongo
from bson import ObjectId
from datetime import datetime
import yfinance as yf
from flask import current_app
import os
import requests

investment_bp = Blueprint('investment', __name__)

@investment_bp.route('/api/investments', methods=['GET'])
@jwt_required()
def get_investments():
    user_id = get_jwt_identity()
    investments = list(mongo.db.investments.find({'user_id': ObjectId(user_id)}))
    for inv in investments:
        inv['_id'] = str(inv['_id'])
        inv['user_id'] = str(inv['user_id'])
        if 'date_invested' in inv and inv['date_invested']:
            inv['date_invested'] = inv['date_invested'].isoformat()
    return jsonify(investments)

@investment_bp.route('/api/investments', methods=['POST'])
@jwt_required()
def add_investment():
    user_id = get_jwt_identity()
    data = request.json
    investment = {
        'user_id': ObjectId(user_id),
        'type': data['type'],
        'company': data.get('company', None),
        'amount': data['amount'],
        'expected_return': data['expected_return'],
        'date_invested': datetime.utcnow()
    }
    mongo.db.investments.insert_one(investment)
    # Deduct from virtual balance
    mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$inc': {'virtual_balance': -data['amount']}})
    return jsonify({'msg': 'Investment added'})

@investment_bp.route('/api/investments/<inv_id>/sell', methods=['POST'])
@jwt_required()
def sell_investment(inv_id):
    user_id = get_jwt_identity()
    inv = mongo.db.investments.find_one({'_id': ObjectId(inv_id), 'user_id': ObjectId(user_id)})
    if not inv:
        return jsonify({'error': 'Investment not found'}), 404
    # Add back to virtual balance
    mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$inc': {'virtual_balance': inv['amount']}})
    mongo.db.investments.delete_one({'_id': ObjectId(inv_id)})
    return jsonify({'msg': 'Investment sold'})

@investment_bp.route('/api/investment-options', methods=['GET'])
def get_investment_options():
    inv_type = request.args.get('type')
    query = {}
    if inv_type:
        # Map 'Stock' to both 'Stock' and 'Equity' for backward compatibility
        if inv_type == 'Stock':
            query['type'] = {'$in': ['Stock', 'Equity']}
        else:
            query['type'] = inv_type
    options = list(mongo.db.investment_options.find(query))
    for opt in options:
        opt['_id'] = str(opt['_id'])
        # Map 'Equity' to 'Stock' in response
        if opt.get('type', '').lower() == 'equity':
            opt['type'] = 'Stock'
    return jsonify(options)

@investment_bp.route('/api/stocks/search', methods=['GET'])
def search_stocks():
    query = request.args.get('query', '').strip()
    top_stocks = [
        # Indian
        {'symbol': 'RELIANCE.NS', 'name': 'Reliance Industries', 'exchange': 'NSE'},
        {'symbol': 'TCS.NS', 'name': 'Tata Consultancy Services', 'exchange': 'NSE'},
        {'symbol': 'HDFCBANK.NS', 'name': 'HDFC Bank', 'exchange': 'NSE'},
        {'symbol': 'INFY.NS', 'name': 'Infosys', 'exchange': 'NSE'},
        {'symbol': 'ICICIBANK.NS', 'name': 'ICICI Bank', 'exchange': 'NSE'},
        # US
        {'symbol': 'AAPL', 'name': 'Apple Inc.', 'exchange': 'NASDAQ'},
        {'symbol': 'MSFT', 'name': 'Microsoft Corporation', 'exchange': 'NASDAQ'},
        {'symbol': 'GOOGL', 'name': 'Alphabet Inc.', 'exchange': 'NASDAQ'},
        {'symbol': 'AMZN', 'name': 'Amazon.com, Inc.', 'exchange': 'NASDAQ'},
        {'symbol': 'TSLA', 'name': 'Tesla, Inc.', 'exchange': 'NASDAQ'},
    ]
    def get_expected_return(symbol):
        try:
            t = yf.Ticker(symbol)
            hist = t.history(period="1y")
            if len(hist) > 0:
                start = hist["Close"].iloc[0]
                end = hist["Close"].iloc[-1]
                if start > 0:
                    return round(((end - start) / start) * 100, 2)
        except Exception:
            pass
        return None
    def enrich_stock(stock):
        try:
            t = yf.Ticker(stock['symbol'])
            info = t.info
            expected_return = get_expected_return(stock['symbol'])
            return {
                'symbol': stock['symbol'],
                'name': info.get('shortName', stock['name']),
                'exchange': info.get('exchange', stock.get('exchange', '')),
                'sector': info.get('sector', ''),
                'industry': info.get('industry', ''),
                'expected_return': expected_return
            }
        except Exception:
            return {**stock, 'expected_return': None, 'sector': '', 'industry': ''}
    # If no query or too short, return top stocks with enriched info
    if not query or len(query) < 2:
        return jsonify([enrich_stock(s) for s in top_stocks])
    results = []
    # Try yfinance symbol search
    try:
        t = yf.Ticker(query)
        info = t.info
        if info and 'shortName' in info:
            expected_return = get_expected_return(t.ticker)
            results.append({
                'symbol': t.ticker,
                'name': info.get('shortName', t.ticker),
                'exchange': info.get('exchange', ''),
                'sector': info.get('sector', ''),
                'industry': info.get('industry', ''),
                'expected_return': expected_return
            })
    except Exception:
        pass
    # Try Alpha Vantage if available
    try:
        api_key = os.getenv('ALPHA_VANTAGE_API_KEY')
        if api_key:
            url = f'https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords={query}&apikey={api_key}'
            r = requests.get(url)
            if r.status_code == 200:
                data = r.json()
                for match in data.get('bestMatches', [])[:5]:
                    symbol = match.get('1. symbol')
                    name = match.get('2. name')
                    region = match.get('4. region', '')
                    if symbol and name:
                        expected_return = get_expected_return(symbol)
                        results.append({
                            'symbol': symbol,
                            'name': name,
                            'exchange': region,
                            'sector': '',
                            'industry': '',
                            'expected_return': expected_return
                        })
    except Exception:
        pass
    # Remove duplicates by symbol
    seen = set()
    unique_results = []
    for s in results:
        if s['symbol'] not in seen:
            seen.add(s['symbol'])
            unique_results.append(s)
    # Always return at least top stocks if nothing found
    if not unique_results:
        unique_results = [enrich_stock(s) for s in top_stocks]
    return jsonify(unique_results)

@investment_bp.route('/api/mutualfunds/search', methods=['GET'])
def search_mutualfunds():
    import yfinance as yf
    query = request.args.get('query', '').strip()
    # Example top mutual funds (add more as needed)
    top_funds = [
        {'symbol': 'NIFTYBEES.NS', 'name': 'Nippon India ETF Nifty BeES'},
        {'symbol': 'ICICITECH.NS', 'name': 'ICICI Prudential Technology Fund'},
        {'symbol': 'AXISBLUE.NS', 'name': 'Axis Bluechip Fund'},
        {'symbol': 'VFIAX', 'name': 'Vanguard 500 Index Fund Admiral Shares'},
        {'symbol': 'FXAIX', 'name': 'Fidelity 500 Index Fund'},
    ]
    def get_expected_return(symbol):
        try:
            t = yf.Ticker(symbol)
            hist = t.history(period="1y")
            if len(hist) > 0:
                start = hist["Close"].iloc[0]
                end = hist["Close"].iloc[-1]
                if start > 0:
                    return round(((end - start) / start) * 100, 2)
        except Exception:
            pass
        return None
    def enrich_fund(fund):
        try:
            t = yf.Ticker(fund['symbol'])
            info = t.info
            expected_return = get_expected_return(fund['symbol'])
            return {
                'symbol': fund['symbol'],
                'name': info.get('shortName', fund['name']),
                'expected_return': expected_return,
                'sector': info.get('category', ''),
                'industry': info.get('fundFamily', '')
            }
        except Exception:
            return {**fund, 'expected_return': None, 'sector': '', 'industry': ''}
    # If no query or too short, return top funds with enriched info
    if not query or len(query) < 2:
        return jsonify([enrich_fund(f) for f in top_funds])
    results = []
    # Try yfinance symbol search
    try:
        t = yf.Ticker(query)
        info = t.info
        if info and 'shortName' in info:
            expected_return = get_expected_return(t.ticker)
            results.append({
                'symbol': t.ticker,
                'name': info.get('shortName', t.ticker),
                'expected_return': expected_return,
                'sector': info.get('category', ''),
                'industry': info.get('fundFamily', '')
            })
    except Exception:
        pass
    # Remove duplicates by symbol
    seen = set()
    unique_results = []
    for f in results:
        if f['symbol'] not in seen:
            seen.add(f['symbol'])
            unique_results.append(f)
    # Always return at least top funds if nothing found
    if not unique_results:
        unique_results = [enrich_fund(f) for f in top_funds]
    return jsonify(unique_results) 