from flask import Flask, jsonify
from flask_cors import CORS
from auth import auth_bp

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'  # Replace with a strong secret key

CORS(app)  # enable CORS for frontend calls

app.register_blueprint(auth_bp, url_prefix='/api')

@app.route('/')
def index():
    return jsonify({'message': 'API is running'})

if __name__ == '__main__':
    app.run(debug=True)
