import os
import certifi
from flask import Flask
from flask_cors import CORS
from flask_pymongo import PyMongo
from dotenv import load_dotenv
import cloudinary
from pymongo.mongo_client import MongoClient
from pymongo.errors import ConnectionFailure

# Load .env
load_dotenv()

# Flask app
app = Flask(__name__)
app.config['MONGO_URI'] = os.getenv('MONGO_URI')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

private_key = os.getenv('VAPID_PRIVATE_KEY')
if private_key:
    private_key = private_key.replace('\\n', '\n')  # Convert literal \n to newline characters
app.config['VAPID_PRIVATE_KEY'] = private_key
app.config['VAPID_CLAIMS_EMAIL'] = os.getenv('VAPID_CLAIMS_EMAIL')

# Mongo Connection Check
try:
    mongo_client = MongoClient(app.config['MONGO_URI'], tlsCAFile=certifi.where())
    mongo_client.admin.command('ping')
    print("✅ MongoDB connected successfully!")
except ConnectionFailure as e:
    print("❌ MongoDB connection failed:", e)

# PyMongo Setup
mongo = PyMongo(app)
app.mongo = mongo

# CORS
CORS(app, supports_credentials=True, origins=["https://campusfrontend.loca.lt"])

# Blueprints
from auth import auth_bp
from upload import upload_bp
from notifications import notifications_bp
app.register_blueprint(notifications_bp ,url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(upload_bp, url_prefix='/api')

@app.route('/')
def index():
    return 'Flask Backend is running!'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
