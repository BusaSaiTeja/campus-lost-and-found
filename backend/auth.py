import jwt
import datetime
from functools import wraps
from models import User
from flask import request, jsonify, session, current_app, Blueprint, make_response, session
from flask_cors import CORS, cross_origin

auth_bp = Blueprint('auth', __name__)

ACCESS_TOKEN_EXPIRES_MINUTES = 15
REFRESH_TOKEN_EXPIRES_DAYS = 7

def create_access_token(username):
    return jwt.encode({
        'username': username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES)
    }, current_app.config['SECRET_KEY'], algorithm='HS256')

def create_refresh_token(username):
    return jwt.encode({
        'username': username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=REFRESH_TOKEN_EXPIRES_DAYS)
    }, current_app.config['SECRET_KEY'], algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.cookies.get('access_token')  # get token from cookie
        print("token is :", token)
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.find_by_username(data['username'])
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Access token expired'}), 401
        except Exception:
            return jsonify({'message': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
@cross_origin(origins="https://campusfrontend.loca.lt", supports_credentials=True)
def register():
    print("register is called")
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    if User.find_by_username(username):
        return jsonify({'message': 'User already exists'}), 400

    new_user_id = User.create_user(username, password)  # returns inserted_id

    access_token = create_access_token(username)
    refresh_token = create_refresh_token(username)
    session['user_id'] = str(new_user_id)

    response = make_response(jsonify({'access_token': access_token}))
    response.set_cookie('access_token', access_token, httponly=True, samesite='None', secure=True)
    response.set_cookie('refresh_token', refresh_token, httponly=True, samesite='None', secure=True)
    response.set_cookie('user_id', str(new_user_id), samesite='None', secure=True, httponly=False)

    return response

@auth_bp.route('/login', methods=['POST'])
@cross_origin(origins="https://campusfrontend.loca.lt", supports_credentials=True)
def login():
    print("login is called")
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    print(username, password)
    user = User.find_by_username(username)

    if not user or not User.check_password(user, password):
        return jsonify({'message': 'Invalid credentials'}), 401

    access_token = create_access_token(username)
    refresh_token = create_refresh_token(username)
    session['user_id'] = str(user['_id'])

    response = make_response(jsonify({'message': 'Login successful'}))
    response.set_cookie('access_token', access_token, httponly=True, samesite='None', secure=True)
    response.set_cookie('refresh_token', refresh_token, httponly=True, samesite='None', secure=True)
    response.set_cookie('user_id', str(user['_id']), samesite='None', secure=True, httponly=False)

    return response

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    refresh_token = request.cookies.get('refresh_token')
    if not refresh_token:
        return jsonify({'message': 'Refresh token missing'}), 401
    try:
        data = jwt.decode(refresh_token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        username = data['username']
        user = User.find_by_username(username)
        if not user:
            return jsonify({'message': 'User not found'}), 401

        new_access_token = create_access_token(username)
        response = make_response(jsonify({'message': 'Token refreshed'}))
        response.set_cookie('access_token', new_access_token, httponly=True, samesite='None', secure=True)
        return response
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Refresh token expired'}), 401
    except Exception:
        return jsonify({'message': 'Invalid refresh token'}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    response = make_response(jsonify({'message': 'Logged out'}))
    response.set_cookie('access_token', '', expires=0, httponly=True, samesite='None', secure=True)
    response.set_cookie('refresh_token', '', expires=0, httponly=True, samesite='None', secure=True)
    response.set_cookie('user_id', '', expires=0, httponly=True, samesite='None', secure=True)
    return response

@auth_bp.route('/verify_token', methods=['GET'])
@token_required
def verify_token(current_user):
    return jsonify({
        'valid': True,
        'user': current_user['username'],
        'user_id': str(current_user['_id'])  # ✅ also return here
    })
