import jwt
import datetime
from functools import wraps
from models import User
from flask import request, jsonify, session, current_app, Blueprint

auth_bp = Blueprint('auth', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            token = token.split()[1]  # Bearer <token>
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.find_by_username(data['username'])
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if User.find_by_username(username):
        return jsonify({'message': 'User already exists'}), 400

    new_user_id = User.create_user(username, password)  # returns inserted_id

    # Generate token
    token = jwt.encode({
        'username': username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, current_app.config['SECRET_KEY'], algorithm='HS256')

    if isinstance(token, bytes):
        token = token.decode('utf-8')

    return jsonify({
        'message': 'User registered successfully',
        'token': token,
        'user_id': str(new_user_id)  # ✅ return user_id to frontend
    })

@auth_bp.route('/login', methods=['POST'])
def login():
    print("Request from IP:", request.remote_addr)
    print("Headers:", dict(request.headers))
    print("JSON Data:", request.get_json())

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.find_by_username(username)

    if not user or not User.check_password(user, password):
        return jsonify({'message': 'Invalid credentials'}), 401

    # Save user ID in session
    session['user_id'] = str(user['_id'])

    # Create JWT token
    token = jwt.encode({
        'username': user['username'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, current_app.config['SECRET_KEY'], algorithm='HS256')

    if isinstance(token, bytes):
        token = token.decode('utf-8')

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user_id': str(user['_id'])  # ✅ return user_id to frontend
    })

@auth_bp.route('/verify_token', methods=['GET'])
@token_required
def verify_token(current_user):
    return jsonify({
        'valid': True,
        'user': current_user['username'],
        'user_id': str(current_user['_id'])  # ✅ also return here
    })
