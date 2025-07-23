from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import mongo
from bson import ObjectId
import csv
import io
from datetime import datetime
import google.generativeai as genai
import re

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

    # Only after saving, generate summaries (synchronously)
    if new_count > 0:
        generate_summaries(user_id)

    return jsonify({'msg': f'{new_count} transactions uploaded', 'financial_behavior_label': behavior})

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

# Helper to generate summaries using Gemini
def generate_summaries(user_id):
    txs = list(mongo.db.transactions.find({'user_id': ObjectId(user_id)}))
    investments = list(mongo.db.investments.find({'user_id': ObjectId(user_id)}))
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    goal = user.get('investment_goal', None) if user else None

    # If no data, return default summaries and tips
    if not txs and not investments:
        default_summaries = {
            'financial_behavior_summary': (
                "No bank transactions found. Start by uploading your bank statement to get a personalized summary of your financial behavior. "
                "Tracking your expenses and income is the first step to better financial health!"
            ),
            'investment_summary': (
                "No investments found. Add your investments to receive a summary of your investment activity and personalized suggestions. "
                "Investing early helps you reach your financial goals faster!"
            ),
            'investment_tips': (
                "Here are some general tips to get started:\n"
                "1. Set clear financial goals (e.g., saving for a house, retirement, or education).\n"
                "2. Build an emergency fund covering 3–6 months of living expenses.\n"
                "3. Start with simple investments like mutual funds or recurring deposits.\n"
                "4. Track your expenses and income to understand your financial habits.\n"
                "5. Upload your bank statement and add your investments to get personalized advice!"
            )
        }
        mongo.db.summaries.update_one(
            {'user_id': ObjectId(user_id)},
            {'$set': {**default_summaries, 'updated_at': datetime.utcnow()}},
            upsert=True
        )
        return default_summaries

    # Prepare prompt for each summary
    txs_str = '\n'.join([f"{t['date']} {t['type']} {t['amount']} {t['description']}" for t in txs])
    inv_str = '\n'.join([f"{i.get('date_invested', '')} {i.get('type', '')} {i.get('company', '')} {i.get('amount', '')}" for i in investments])
    goal_str = f"\nUser's investment goal: {goal}" if goal else ""

    prompts = {
        'financial_behavior_summary': f"Analyze the following bank transactions and summarize the user's financial behavior in 3-5 sentences. Think of it like you are giving this summary directly to the user.\nTransactions:\n{txs_str}",
        'investment_summary': f"Summarize the user's investment activity based on the following investments in 3-5 sentences. Think of it like you are giving this summary directly to the user.\nInvestments:\n{inv_str}",
        'investment_tips': f"Based on the user's transactions and investments{goal_str}, provide 3 to 5 personalized tips for future investments and financial planning, formatted as concise bullet points (not paragraphs). Each tip should be a single, clear point. Think of it like you are giving this tips directly to the user\nTransactions:\n{txs_str}\nInvestments:\n{inv_str}"
    }
    # Use the correct Gemini model name
    model = genai.GenerativeModel('gemini-2.5-flash')
    results = {}
    for key, prompt in prompts.items():
        try:
            response = model.generate_content(prompt)
            text = response.text.strip()
            # Remove special markdown characters and extra dashes, but allow a single '-'
            # Replace multiple dashes with a single dash, remove all other markdown special chars
            text = re.sub(r'--+', '-', text)  # Replace multiple dashes with a single dash
            text = re.sub(r'[\*`#_>]+', '', text)  # Remove other markdown special chars
            text = re.sub(r'\s{2,}', ' ', text)
            if key == 'investment_tips':
                # Try to split into points: by newlines, numbers, or capitalized starts
                tips = re.split(r'\n|\r|\d+\.\s*|(?<=\.)\s+(?=[A-Z])', text)
                tips = [t.strip() for t in tips if t.strip() and len(t.strip()) > 2]
                results[key] = tips
            else:
                results[key] = text.strip()
        except Exception as e:
            results[key] = [f"Error generating summary: {e}"] if key == 'investment_tips' else f"Error generating summary: {e}"
    # Store/update in summaries collection
    mongo.db.summaries.update_one(
        {'user_id': ObjectId(user_id)},
        {'$set': {**results, 'updated_at': datetime.utcnow()}},
        upsert=True
    )
    return results

def run_generate_summaries(user_id):
    with current_app.app_context():
        generate_summaries(user_id)

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
        basic_tips = [
            "Start by uploading your bank statement to track your financial behavior.",
            "Add your investments to receive a personalized investment summary.",
            "Set clear financial goals (e.g., saving for a house, retirement, or education).",
            "Build an emergency fund covering 3–6 months of living expenses.",
            "Begin with simple investments like mutual funds or recurring deposits."
        ]
        return jsonify({
            'basic_tips': basic_tips,
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