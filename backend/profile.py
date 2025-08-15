from flask import Blueprint, jsonify, request, current_app
from werkzeug.security import generate_password_hash
from bson import ObjectId
from auth import token_required  # your JWT/session middleware

profile_bp = Blueprint("profile", __name__)

@profile_bp.route("/profile", methods=["GET"])
@token_required
def get_profile(current_user):
    return jsonify({
        "username": current_user["username"]
    }), 200

@profile_bp.route("/profile/password", methods=["PUT"])
@token_required
def update_password(current_user):
    try:
        data = request.get_json()
        new_password = data.get("newPassword")

        if not new_password or len(new_password) < 6:
            return jsonify({"message": "Password must be at least 6 characters"}), 400

        mongo = current_app.mongo
        hashed_pw = generate_password_hash(new_password)

        mongo.db.users.update_one(
            {"_id": ObjectId(current_user["_id"])},
            {"$set": {"password": hashed_pw}}
        )

        return jsonify({"message": "Password updated successfully"}), 200
    except Exception as e:
        print("Password update error:", e)
        return jsonify({"message": "Server error"}), 500
