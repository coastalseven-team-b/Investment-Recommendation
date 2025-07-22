from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from passlib.hash import bcrypt
from extensions import mongo
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if mongo.db.users.find_one({'email': data['email']}):
        return jsonify({'error': 'Email already registered'}), 400
    hashed_pw = bcrypt.hash(data['password'])
    user = {
        'name': data['name'],
        'email': data['email'],
        'password': hashed_pw,
        'risk_profile_completed': False,
        'createdAt': datetime.utcnow(),
        'virtual_balance': 100000
    }
    mongo.db.users.insert_one(user)
    return jsonify({'msg': 'Registered'}), 201

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = mongo.db.users.find_one({'email': data['email']})
    if not user or not bcrypt.verify(data['password'], user['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    access_token = create_access_token(identity=str(user['_id']))
    return jsonify({
        'token': access_token,
        'risk_profile_completed': user.get('risk_profile_completed', False)
    }) 