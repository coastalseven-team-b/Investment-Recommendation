from flask import current_app, Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from extensions import mongo
from datetime import datetime
import google.generativeai as genai
import re

genai.configure(api_key="AIzaSyBjMuHVsupmjxocF1k3hLPH0ideKpcrxi4")

summary_bp = Blueprint('summary', __name__)

@summary_bp.route('/api/summary', methods=['GET'])
@jwt_required()
def get_summary():
    user_id = get_jwt_identity()
    # Always generate summaries on each request, do not fetch from DB
    summary = generate_summaries(user_id)
    summary.pop('_id', None)
    summary.pop('user_id', None)
    return jsonify(summary)

def generate_summaries(user_id):
    print(f"[Background] (generate_summaries) Running for user {user_id}")
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
            'investment_tips': [
                "Set clear financial goals (e.g., saving for a house, retirement, or education).",
                "Build an emergency fund covering 3–6 months of living expenses.",
                "Start with simple investments like mutual funds or recurring deposits.",
                "Track your expenses and income to understand your financial habits.",
                "Upload your bank statement and add your investments to get personalized advice!"
            ]
        }
        mongo.db.summaries.update_one(
            {'user_id': ObjectId(user_id)},
            {'$set': {**default_summaries, 'updated_at': datetime.utcnow()}},
            upsert=True
        )
        print(f"[Background] (generate_summaries) No data for user {user_id}, wrote default summaries.")
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
    print(f"[Background] (generate_summaries) Finished for user {user_id}")
    return results

def run_generate_summaries(user_id):
    print(f"[Background] Starting summary generation for user {user_id}")
    with current_app.app_context():
        generate_summaries(user_id)
    print(f"[Background] Finished summary generation for user {user_id}") 