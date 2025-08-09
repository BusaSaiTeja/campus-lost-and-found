from flask import Blueprint, request, jsonify, current_app
from flask_pymongo import PyMongo
import json
from pywebpush import webpush, WebPushException

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/save-subscription', methods=['POST'])
def save_subscription():
    subscription = request.get_json()
    if not subscription:
        return jsonify({'message': 'No subscription data received'}), 400

    mongo = current_app.mongo
    existing = mongo.db.subscriptions.find_one({'endpoint': subscription.get('endpoint')})
    if not existing:
        mongo.db.subscriptions.insert_one(subscription)
    return jsonify({'message': 'Subscription saved'}), 201


def add_base64_padding(s):
    """Add '=' padding to base64 strings if missing."""
    return s + '=' * (-len(s) % 4)

def fix_subscription_keys(subscription):
    """Fix base64 padding on subscription keys."""
    keys = subscription.get('keys', {})
    for k in ['p256dh', 'auth']:
        if k in keys:
            keys[k] = add_base64_padding(keys[k])
    subscription['keys'] = keys
    return subscription

def send_push_notification(subscription_info, message_body):
    print("sending notifications")

    # Fix base64 padding on keys before sending
    fixed_subscription = fix_subscription_keys(subscription_info)

    try:
        webpush(
            subscription_info=fixed_subscription,
            data=json.dumps(message_body),
            vapid_private_key=current_app.config['VAPID_PRIVATE_KEY'],
            vapid_claims={"sub": current_app.config['VAPID_CLAIMS_EMAIL']},
        )
    except WebPushException as ex:
        print(f"Web push failed: {repr(ex)}")
