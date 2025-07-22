import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from extensions import mongo, jwt
import requests

load_dotenv()

app = Flask(__name__)
app.config["MONGO_URI"] = os.getenv("MONGO_URI")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET")

mongo.init_app(app)
jwt.init_app(app)
CORS(app)

# --- Index creation for optimal performance ---
def create_indexes():
    # Users: unique email
    mongo.db.users.create_index("email", unique=True)
    # Transactions: user_id, date
    mongo.db.transactions.create_index([("user_id", 1), ("date", -1)])
    # Investments: user_id, date_invested
    mongo.db.investments.create_index([("user_id", 1), ("date_invested", -1)])
    # Investment options: investment_id (unique), type
    mongo.db.investment_options.create_index("investment_id", unique=True)
    mongo.db.investment_options.create_index("type")
    # Recommendations: user_id, createdAt
    mongo.db.recommendations.create_index([("user_id", 1), ("createdAt", -1)])

# Call index creation at startup
with app.app_context():
    create_indexes()

# Register blueprints
from auth import auth_bp
from user import user_bp
from investment import investment_bp
from transaction import transaction_bp
from recommendation import recommendation_bp

app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(investment_bp)
app.register_blueprint(transaction_bp)
app.register_blueprint(recommendation_bp)

if __name__ == "__main__":
    app.run(debug=True, port=5050) 