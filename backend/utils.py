from functools import wraps
from flask import request, jsonify
import jwt

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if token:
            try:
                token = token.split()[1]
                data = jwt.decode(token, 'your_secret_key', algorithms=['HS256'])
            except:
                return jsonify({'message': 'Invalid token'}), 403
        else:
            return jsonify({'message': 'Token missing'}), 403
        return f(*args, **kwargs)
    return decorated
