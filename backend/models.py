from db import get_db
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from datetime import datetime

class User:
    @staticmethod
    def collection():
        return get_db().users

    @staticmethod
    def find_by_username(username):
        return User.collection().find_one({'username': username})

    @staticmethod
    def create_user(username, password):
        password_hash = generate_password_hash(password)
        user_doc = {
            'username': username,
            'password_hash': password_hash
        }
        return User.collection().insert_one(user_doc)

    @staticmethod
    def check_password(user_doc, password):
        return check_password_hash(user_doc['password_hash'], password)