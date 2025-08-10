from flask import Blueprint, request, jsonify, current_app
from pywebpush import webpush, WebPushException
import json

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/save-subscription', methods=['POST'])
def save_subscription():
    subscription = request.get_json()
    if not subscription:
        return jsonify({'message': 'No subscription data received'}), 400

    mongo = current_app.mongo
    subscriptions_collection = mongo.db.subscriptions
    existing = subscriptions_collection.find_one({"endpoint": subscription['endpoint']})

    if existing:
        # Optionally, update keys in case they changed
        subscriptions_collection.update_one(
            {"endpoint": subscription['endpoint']},
            {"$set": {"keys": subscription.get('keys', {})}}
        )
        return jsonify({"message": "Subscription updated"}), 200
    else:
        # Insert new subscription
        subscriptions_collection.insert_one(subscription)
        return jsonify({"message": "Subscription saved"}), 201


def send_push_notification(subscription_info, message_body):
    """Send a push notification to a single subscription"""
    print("sending notifications")
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(message_body),
            vapid_private_key=current_app.config['VAPID_PRIVATE_KEY'],
            vapid_claims={"sub": current_app.config['VAPID_CLAIMS_EMAIL']},
        )
        print("Push notification sent successfully")
    except WebPushException as ex:
        print(f"Web push failed: {repr(ex)}")
        if ex.response and ex.response.status_code == 410:
            # Remove expired subscription from DB
            mongo = current_app.mongo
            mongo.db.subscriptions.delete_one({"endpoint": subscription_info.get("endpoint")})
            print(f"Deleted expired subscription: {subscription_info.get('endpoint')}")
