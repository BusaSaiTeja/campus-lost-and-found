# app.py
import os
import certifi
from flask import Flask, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from dotenv import load_dotenv
import cloudinary
from pymongo.mongo_client import MongoClient
from pymongo.errors import ConnectionFailure
from flask_socketio import SocketIO

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['MONGO_URI'] = os.getenv('MONGO_URI')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# SocketIO (only allow the frontend host)
socketio = SocketIO(
    app,
    cors_allowed_origins=["https://campusfrontend.loca.lt"],
    async_mode="eventlet"
)
app.socketio = socketio

# Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# VAPID keys (ensure newline characters are fixed if stored with \n)
private_key = os.getenv('VAPID_PRIVATE_KEY') or ""
if private_key:
    private_key = private_key.replace("\\n", "\n")
app.config['VAPID_PRIVATE_KEY'] = private_key
app.config['VAPID_PUBLIC_KEY'] = os.getenv('VAPID_PUBLIC_KEY')
app.config['VAPID_CLAIMS_EMAIL'] = os.getenv('VAPID_CLAIMS_EMAIL')

# Mongo connection check (use certifi CA bundle)
try:
    mongo_client = MongoClient(app.config['MONGO_URI'], tlsCAFile=certifi.where())
    mongo_client.admin.command('ping')
    print("✅ MongoDB connected successfully!")
except ConnectionFailure as e:
    print("❌ MongoDB connection failed:", e)

# PyMongo for app usage
mongo = PyMongo(app)
app.mongo = mongo

# CORS — apply to ALL routes (important: allow credentials and exact origin, not '*')
CORS(
    app,
    supports_credentials=True,
    origins=["https://campusfrontend.loca.lt"],
    resources={r"/*": {"origins": "https://campusfrontend.loca.lt"}},
    send_wildcard=False
)

# Import blueprints after app is configured
from chat import chat_bp, init_socketio, init_chat
from auth import auth_bp
from upload import upload_bp
from notifications import notifications_bp

app.register_blueprint(notifications_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(upload_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')

# Initialize socketio events and chat
init_socketio(socketio)
init_chat(mongo.db, socketio)

VAPID_PUBLIC_KEY = app.config.get('VAPID_PUBLIC_KEY')

@app.route("/vapid_public_key", methods=["GET"])
def vapid_public_key():
    # This route will now have proper CORS headers because resources="/*"
    return jsonify({"key": VAPID_PUBLIC_KEY})

@app.route('/')
def index():
    return 'Flask Backend is running!'

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
