from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import mongo
from bson import ObjectId
import csv
import io
from datetime import datetime

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
    for row in csv_input:
        # Normalize type and amount
        tx_type = row.get('type', 'debit').strip().lower()
        amount = abs(float(row['amount']))
        # Ignore user_id from CSV
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
    behavior = calculate_financial_behavior(user_id)
    # Save to user profile
    mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'financial_behavior': behavior}})
    return jsonify({'msg': f'{new_count} transactions uploaded', 'financial_behavior_label': behavior})

def calculate_financial_behavior(user_id):
    txs = list(mongo.db.transactions.find({'user_id': ObjectId(user_id)}))
    print('DEBUG: Transactions for user:', txs)
    income = sum(abs(float(tx['amount'])) for tx in txs if tx['type'] == 'credit')
    expenses = sum(abs(float(tx['amount'])) for tx in txs if tx['type'] == 'debit')
    investment = sum(abs(float(tx['amount'])) for tx in txs if tx['type'] == 'investment')
    print(f'DEBUG: income={income}, expenses={expenses}, investment={investment}')
    if income == 0:
        has_credit = any(tx['type'] == 'credit' for tx in txs)
        if not has_credit:
            print('WARNING: No credit transactions found. Please upload bank data with at least one credit transaction (e.g., salary).')
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