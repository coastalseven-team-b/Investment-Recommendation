from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import mongo
from bson import ObjectId
from datetime import datetime
import joblib
import numpy as np

recommendation_bp = Blueprint('recommendation', __name__)

# Load model and encoders once
clf = joblib.load('recommendation_model.pkl')
encoders = joblib.load('recommendation_encoders.pkl')

# Load RTC model, encoders, and thresholds
rtc_clf = joblib.load('risk_tenure_capital_model.pkl')
rtc_encoders = joblib.load('risk_tenure_capital_encoders.pkl')
rtc_thresholds = joblib.load('risk_tenure_capital_thresholds.pkl')

@recommendation_bp.route('/api/recommend', methods=['POST'])
@jwt_required()
def recommend():
    user_id = get_jwt_identity()
    data = request.json
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    # Check for required profile fields
    if not user.get('risk_level') or not user.get('investment_goal') or not user.get('risk_profile_completed', False):
        return jsonify({'error': 'Please complete your risk profile before getting recommendations.'}), 400
    if not user.get('financial_behavior') or user.get('financial_behavior', 'Unknown').lower() == 'unknown':
        return jsonify({'error': 'Please upload your bank statement to analyze your financial behavior before getting recommendations.'}), 400
    # Use user profile and input
    risk_profile = user.get('risk_level', 'Medium').title()
    behavior = user.get('financial_behavior', 'Saver').title()
    goal = user.get('investment_goal', 'Retirement').title()
    # Encode features
    X = np.array([[encoders['risk_profile'].transform([risk_profile])[0],
                   encoders['behavior'].transform([behavior])[0],
                   encoders['goal'].transform([goal])[0]]])
    # Predict
    y_pred = clf.predict(X)[0]
    rec_ids = np.array(encoders['recommendations'].classes_)[y_pred.astype(bool)].tolist()
    # Fetch investment details
    investments = list(mongo.db.investment_options.find({'investment_id': {'$in': rec_ids}}))
    for inv in investments:
        inv['_id'] = str(inv['_id'])
    if not investments:
        return jsonify({'error': 'No recommendations found for your profile. Please try updating your profile or contact support.'}), 404
    rec = {
        'user_id': str(user_id),
        'capital': data.get('capital'),
        'tenure': data.get('tenure'),
        'risk_level': risk_profile,
        'behavior': behavior,
        'goal': goal,
        'suggestions': investments,
        'createdAt': datetime.utcnow()
    }
    mongo.db.recommendations.insert_one(rec)
    rec['_id'] = str(rec.get('_id', ''))
    return jsonify(rec)

@recommendation_bp.route('/api/recommend-rtc', methods=['POST'])
@jwt_required()
def recommend_rtc():
    user_id = get_jwt_identity()
    data = request.json
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    # Check for required profile fields
    if not user.get('risk_level') or not user.get('risk_profile_completed', False):
        return jsonify({'error': 'Please complete your risk profile before getting recommendations.'}), 400
    if not user.get('financial_behavior') or user.get('financial_behavior', 'Unknown').lower() == 'unknown':
        return jsonify({'error': 'Please upload your bank statement to analyze your financial behavior before getting recommendations.'}), 400
    # Validate input
    try:
        tenure = int(data.get('tenure'))
        capital = int(data.get('capital'))
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid input'}), 400
    if not (1 <= tenure <= 10):
        return jsonify({'error': 'Tenure must be between 1 and 10'}), 400
    if not (1000 <= capital <= 100000):
        return jsonify({'error': 'Capital must be between 1000 and 100000'}), 400
    # Get risk_level from user
    risk_level = user.get('risk_level', 'Medium').capitalize()
    # Encode features
    risk_enc = rtc_encoders['risk_level'].transform([risk_level])[0]
    # Capital binning
    if capital < 20000:
        capital_bin = 'low'
    elif capital < 60000:
        capital_bin = 'medium'
    else:
        capital_bin = 'high'
    capital_bin_enc = rtc_encoders['capital_bin'].transform([capital_bin])[0]
    X = np.array([[risk_enc, tenure, capital, capital_bin_enc]])
    # Predict probabilities
    probs = rtc_clf.predict_proba(X)
    if isinstance(probs, list):
        probs = np.column_stack([p[:,1] for p in probs])
    # Apply thresholds
    preds = np.zeros(probs.shape[1], dtype=bool)
    for i, t in enumerate(rtc_thresholds):
        preds[i] = probs[0, i] >= t
    rec_ids = np.array(rtc_encoders['recommendations'].classes_)[preds].tolist()
    # Fetch investment details
    investments = list(mongo.db.investment_options.find({'investment_id': {'$in': rec_ids}}))
    for inv in investments:
        inv['_id'] = str(inv['_id'])
    if not investments:
        return jsonify({'error': 'No recommendations found for your profile. Please try updating your profile or contact support.'}), 404
    rec = {
        'user_id': str(user_id),
        'capital': capital,
        'tenure': tenure,
        'risk_level': risk_level,
        'suggestions': investments,
        'createdAt': datetime.utcnow()
    }
    mongo.db.recommendations.insert_one(rec)
    rec['_id'] = str(rec.get('_id', ''))
    return jsonify(rec) 