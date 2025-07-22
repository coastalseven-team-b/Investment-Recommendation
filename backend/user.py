from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import mongo
from bson import ObjectId
from passlib.hash import bcrypt
import re

user_bp = Blueprint('user', __name__)

@user_bp.route('/api/risk-profile', methods=['POST'])
@jwt_required()
def risk_profile():
    data = request.json
    user_id = get_jwt_identity()
    update = {
        'risk_score': data['risk_score'],
        'risk_level': data['risk_level'],
        'investment_goal': data['investment_goal'],
        'risk_profile_completed': True
    }
    mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$set': update})
    return jsonify({'msg': 'Risk profile updated'})

@user_bp.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)}, {'password': 0})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    user['_id'] = str(user['_id'])
    return jsonify(user)

@user_bp.route('/api/profile', methods=['POST'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.json
    # Validation: username must not start with a number or be all numbers
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    if not name or not email or not data.get('risk_level') or not data.get('investment_goal') or not data.get('financial_behavior'):
        return jsonify({'error': 'All fields are required'}), 400
    if name[0].isdigit():
        return jsonify({'error': 'Username must not start with a number.'}), 400
    if name.isdigit():
        return jsonify({'error': 'Username cannot be all numbers.'}), 400
    if email[0].isdigit():
        return jsonify({'error': 'Email must not start with a number and must be a valid email address.'}), 400
    if email.isdigit():
        return jsonify({'error': 'Email cannot be all numbers and must be a valid email address.'}), 400
    if not re.match(r'^\S+@\S+\.\S+$', email):
        return jsonify({'error': 'Please enter a valid email address.'}), 400
    # Check if email is already used by another user
    existing = mongo.db.users.find_one({'email': email, '_id': {'$ne': ObjectId(user_id)}})
    if existing:
        return jsonify({'error': 'Email already registered by another user.'}), 400
    update = {
        'name': name,
        'email': email,
        'risk_level': data['risk_level'],
        'investment_goal': data['investment_goal'],
        'financial_behavior': data['financial_behavior']
    }
    mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$set': update})
    return jsonify({'msg': 'Profile updated'})

@user_bp.route('/api/profile/onboarding', methods=['POST'])
@jwt_required()
def onboarding():
    user_id = get_jwt_identity()
    data = request.json
    gender = data.get('gender')
    age = data.get('age')
    region = data.get('region')
    if not gender or not age or not region:
        return jsonify({'error': 'All fields required'}), 400
    mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {
        'gender': gender,
        'age': age,
        'region': region
    }})
    return jsonify({'msg': 'Profile updated'})

@user_bp.route('/api/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    data = request.json
    current = data.get('current_password', '')
    new = data.get('new_password', '')
    if not current or not new:
        return jsonify({'error': 'All fields are required'}), 400
    user = mongo.db.users.find_one({'_id': ObjectId(user_id)})
    if not user or not bcrypt.verify(current, user['password']):
        return jsonify({'error': 'Current password is incorrect.'}), 400
    if current == new:
        return jsonify({'error': 'New password must be different from current password.'}), 400
    hashed_pw = bcrypt.hash(new)
    mongo.db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'password': hashed_pw}})
    return jsonify({'msg': 'Password changed successfully'}) 