from flask import Flask
from db import init_db
from auth import auth_bp
from models import User  
from flask_cors import CORS

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your_secret_key_here'
CORS(app)

init_db(app)

app.register_blueprint(auth_bp, url_prefix='/api')
@app.route('/')
def index():
    return 'Flask Backend is running!'
if __name__ == '__main__':
    app.run(debug=True)
