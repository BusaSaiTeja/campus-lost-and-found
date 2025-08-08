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
CORS(app, supports_credentials=True, origins=["http://localhost:5173","http://127.0.0.1:5173", os.getenv('IP')])

# Blueprints
from auth import auth_bp
from upload import upload_bp
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(upload_bp, url_prefix='/api')

@app.route('/')
def index():
    return 'Flask Backend is running!'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
