from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import mongo
from bson import ObjectId
import csv
import io
from datetime import datetime
import google.generativeai as genai
import re
import threading
from utils import generate_summaries, run_generate_summaries

# Set your Gemini API key (replace with your actual key or use env variable)
genai.configure(api_key="AIzaSyBjMuHVsupmjxocF1k3hLPH0ideKpcrxi4")

transaction_bp = Blueprint('transaction', __name__)

@transaction_bp.route('/api/transactions/upload', methods=['POST'])
@jwt_required()
def upload_transactions():
    user_id = get_jwt_identity()
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    stream = io.StringIO(file.stream.read().decode("UTF8"), newline=None)
    csv_input = csv.DictReader(stream)

    new_count = 0
    all_dates = []  # To store transaction dates

    for row in csv_input:
        try:
            # Normalize type and amount
            tx_type = row.get('type', 'debit').strip().lower()
            amount = abs(float(row['amount']))

            # Track transaction date
            tx_date = datetime.strptime(row['date'], '%Y-%m-%d').date()
            all_dates.append(tx_date)

            # Check for duplicate
            exists = mongo.db.transactions.find_one({
                'user_id': ObjectId(user_id),
                'date': row['date'],
                'amount': amount,
                'description': row['description']
            })

            if not exists:
                mongo.db.transactions.insert_one({
                    'user_id': ObjectId(user_id),
                    'date': row['date'],
                    'amount': amount,
                    'description': row['description'],
                    'type': tx_type
                })
                new_count += 1

        except Exception as e:
            # Gracefully handle unexpected rows (e.g., missing fields or invalid dates)
            print(f"Skipping invalid row: {row}, error: {e}")
            continue

    # ✅ Validate 12 months range
    if all_dates:
        min_date = min(all_dates)
        max_date = max(all_dates)
        duration = (max_date - min_date).days
        if duration < 365:
            return jsonify({'error': 'Invalid transactions uploaded: Less than 12 months of data'}), 400

    behavior = calculate_financial_behavior(user_id)

    # Save to user profile
    mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'financial_behavior': behavior}})

    resp = jsonify({'msg': f'{new_count} transactions uploaded', 'financial_behavior_label': behavior})
    if new_count > 0:
        print(f"[Main] Spawning background thread for summary generation for user {user_id}")
        threading.Thread(target=run_generate_summaries, args=(user_id,)).start()
    return resp

def calculate_financial_behavior(user_id):
    txs = list(mongo.db.transactions.find({'user_id': ObjectId(user_id)}))
    print('DEBUG: Transactions for user:', txs)
    income = sum(abs(float(tx['amount'])) for tx in txs if tx['type'] == 'credit')
    expenses = sum(abs(float(tx['amount'])) for tx in txs if tx['type'] == 'debit')
    investment = sum(abs(float(tx['amount'])) for tx in txs if tx['type'] == 'investment')
    print(f'DEBUG: income={income}, expenses={expenses}, investment={investment}')
    if income == 0:
        print('DEBUG: income is zero, returning Unknown')
        return 'Unknown'
    saving_rate = (income - expenses - investment) / income
    spending_rate = expenses / income
    investment_rate = investment / income
    print(f'DEBUG: saving_rate={saving_rate}, spending_rate={spending_rate}, investment_rate={investment_rate}')
    if saving_rate >= 0.4 and investment_rate < 0.2:
        print('DEBUG: Classified as Saver')
        return 'Saver'
    elif spending_rate >= 0.6 and investment_rate < 0.2:
        print('DEBUG: Classified as Spender')
        return 'Spender'
    elif investment_rate >= 0.15 and saving_rate >= 0.2:
        print('DEBUG: Classified as Investor')
        return 'Investor'
    else:
        print('DEBUG: No classification matched, returning Unknown')
        return 'Unknown'

@transaction_bp.route('/api/summary', methods=['GET'])
@jwt_required()
def get_summary():
    user_id = get_jwt_identity()
    txs = list(mongo.db.transactions.find({'user_id': ObjectId(user_id)}))
    investments = list(mongo.db.investments.find({'user_id': ObjectId(user_id)}))
    missing_data = []
    if not txs:
        missing_data.append('transactions')
    if not investments:
        missing_data.append('investments')
    if missing_data:
        from utils import generate_summaries
        default = generate_summaries(user_id)
        return jsonify({
            'financial_behavior_summary': default['financial_behavior_summary'],
            'investment_summary': default['investment_summary'],
            'investment_tips': default['investment_tips'],
            'missing_data': missing_data
        })
    # If both are present, proceed as before
    summary = mongo.db.summaries.find_one({'user_id': ObjectId(user_id)})
    missing = False
    error_found = False
    error_prefix = 'Error generating summary:'
    if not summary:
        # No summary at all, generate all
        summary = generate_summaries(user_id)
        missing = True
    else:
        # Check for missing fields or error messages
        fields = ['financial_behavior_summary', 'investment_summary', 'investment_tips']
        for f in fields:
            val = summary.get(f, '')
            if not val or (isinstance(val, str) and val.strip().startswith(error_prefix)):
                missing = True
                error_found = True
        if missing or error_found:
            summary = generate_summaries(user_id)
    # Convert ObjectId and datetime to string
    summary['user_id'] = str(user_id)
    if 'updated_at' in summary:
        summary['updated_at'] = summary['updated_at'].isoformat()
    summary.pop('_id', None)
    return jsonify(summary)

@transaction_bp.route('/api/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    user_id = get_jwt_identity()
    txs = list(mongo.db.transactions.find({'user_id': ObjectId(user_id)}))
    for tx in txs:
        tx['_id'] = str(tx['_id'])
        tx['user_id'] = str(tx['user_id'])
    # Also return the latest behavior
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    behavior = user.get('financial_behavior', 'Unknown') if user else 'Unknown'
    return jsonify({'transactions': txs, 'behavior': behavior})