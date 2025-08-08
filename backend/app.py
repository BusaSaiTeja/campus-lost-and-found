import os
import certifi
from flask import Flask
from flask_cors import CORS
from flask_pymongo import PyMongo
from dotenv import load_dotenv
import cloudinary
from pymongo.mongo_client import MongoClient
from pymongo.errors import ConnectionFailure
from flask_socketio import SocketIO

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
app.config['MONGO_URI'] = os.getenv('MONGO_URI')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# Setup SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")
app.socketio = socketio

# Cloudinary config
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# Check MongoDB connection manually (optional)
try:
    mongo_client = MongoClient(app.config['MONGO_URI'], tlsCAFile=certifi.where())
    mongo_client.admin.command('ping')
    print("✅ MongoDB connected successfully!")
except ConnectionFailure as e:
    print("❌ MongoDB connection failed:", e)

# Setup PyMongo (for app usage)
mongo = PyMongo(app)
app.mongo = mongo

# Setup CORS for frontend URLs
CORS(app, supports_credentials=True, origins=["http://localhost:5173", os.getenv('IP')])

# Import blueprints and init functions
from chat import chat_bp, init_socketio, init_chat
from auth import auth_bp
from upload import upload_bp

app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(upload_bp, url_prefix='/api')
app.register_blueprint(chat_bp, url_prefix='/api')

# Initialize SocketIO events and MongoDB collections in blueprints
init_socketio(socketio)
init_chat(mongo.db, socketio)

@app.route('/')
def index():
    return 'Flask Backend is running!'

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
