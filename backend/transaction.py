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
    all_dates = []  # To store transaction dates

    for row in csv_input:
        try:
            # Normalize and strip all fields
            tx_type = row.get('type', 'debit').strip().lower()
            amount = abs(float(row['amount']))
            tx_date_str = row['date'].strip()
            description = row['description'].strip()

            # Try multiple date formats
            try:
                tx_date = datetime.strptime(tx_date_str, '%Y-%m-%d').date()
            except ValueError:
                try:
                    tx_date = datetime.strptime(tx_date_str, '%m/%d/%Y').date()
                except ValueError:
                    print(f"Skipping invalid row: {row}, error: date format not recognized")
                    continue
            all_dates.append(tx_date)

            # Debug: print the duplicate check query
            duplicate_query = {
                'user_id': ObjectId(user_id),
                'date': tx_date_str,
                'amount': amount,
                'description': description
            }
            exists = mongo.db.transactions.find_one(duplicate_query)

            if not exists:
                insert_doc = {
                    'user_id': ObjectId(user_id),
                    'date': tx_date_str,
                    'amount': amount,
                    'description': description,
                    'type': tx_type
                }
                mongo.db.transactions.insert_one(insert_doc)
                new_count += 1

        except Exception as e:
            # Gracefully handle unexpected rows (e.g., missing fields or invalid dates)
            continue

    # Print all transactions for this user after upload
    all_user_txs = list(mongo.db.transactions.find({'user_id': ObjectId(user_id)}))

    # ✅ Validate 12 months range
    if all_dates:
        min_date = min(all_dates)
        max_date = max(all_dates)
        # Accept if min_date is same month last year or earlier
        months_apart = (max_date.year - min_date.year) * 12 + (max_date.month - min_date.month)
        if months_apart < 11:  # 0-based, so 11 means 12 months span
            return jsonify({'error': 'Invalid transactions uploaded: Less than 12 months of data'}), 400

    behavior = calculate_financial_behavior(user_id)

    # Save to user profile
    mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'financial_behavior': behavior}})

    return jsonify({'msg': f'{new_count} transactions uploaded', 'financial_behavior_label': behavior})

def calculate_financial_behavior(user_id):
    txs = list(mongo.db.transactions.find({'user_id': ObjectId(user_id)}))
    income = sum(abs(float(tx['amount'])) for tx in txs if tx['type'] == 'credit')
    expenses = sum(abs(float(tx['amount'])) for tx in txs if tx['type'] == 'debit')
    investment = sum(abs(float(tx['amount'])) for tx in txs if tx['type'] == 'investment')
    if income == 0:
        return 'Unknown'
    saving_rate = (income - expenses - investment) / income
    spending_rate = expenses / income
    investment_rate = investment / income
    if saving_rate >= 0.4 and investment_rate < 0.2:
        return 'Saver'
    elif spending_rate >= 0.6 and investment_rate < 0.2:
        return 'Spender'
    elif investment_rate >= 0.15 and saving_rate >= 0.2:
        return 'Investor'
    else:
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