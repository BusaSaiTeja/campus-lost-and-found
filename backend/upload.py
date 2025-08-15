import base64
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from datetime import datetime
import cloudinary.uploader
from bson import ObjectId
from auth import token_required
import traceback
from notifications import send_push_notification
import re
from urllib.parse import urlparse, unquote

upload_bp = Blueprint('upload', __name__)

@upload_bp.route('/upload', methods=['POST'])
@token_required
def upload_item(current_user):
    try:
        print("Received upload request")
        mongo = current_app.mongo
        data = request.get_json()
        image_data = data.get('image')
        place_desc = data.get('placeDesc')
        item_desc = data.get('itemDesc')
        geo_location = data.get('geoLocation')

        # Validate required fields
        missing = []
        if not image_data:
            missing.append('image')
        if not place_desc:
            missing.append('placeDesc')
        if not item_desc:
            missing.append('itemDesc')
        if not geo_location:
            missing.append('geoLocation')

        if missing:
            return jsonify({'message': f'Missing required fields: {", ".join(missing)}'}), 400

        if not isinstance(geo_location, dict) or 'lat' not in geo_location or 'lng' not in geo_location:
            return jsonify({'message': 'Invalid location data'}), 400

        if image_data.startswith("data:image"):
            image_parts = image_data.split(";base64,")
            if len(image_parts) < 2:
                return jsonify({'message': 'Invalid image data format'}), 400

            file_ext = image_parts[0].split('/')[-1]
            encoded = image_parts[1]
            decoded_image = base64.b64decode(encoded)
        else:
            return jsonify({'message': 'Invalid image data'}), 400

        filename = secure_filename(f"{datetime.now().timestamp()}.{file_ext}")

        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            decoded_image,
            resource_type="image",
            public_id=filename,
            overwrite=True,
            folder="lost_items"
        )

        image_url = upload_result.get('secure_url')
        public_id = upload_result.get('public_id')

        if not image_url:
            return jsonify({'message': 'Image upload failed'}), 500

        uploaded_by_id = current_user['_id']
        if isinstance(uploaded_by_id, str):
            uploaded_by_id = ObjectId(uploaded_by_id)

        location_geojson = {
            "type": "Point",
            "coordinates": [geo_location['lng'], geo_location['lat']]
        }

        mongo.db.items.insert_one({
            "placeDesc": place_desc,
            "itemDesc": item_desc,
            "imageUrl": image_url,
            "public_id": public_id,  # Store public_id for deletion
            "location": location_geojson,
            "timestamp": datetime.utcnow(),
            "status": "not claimed",
            "uploadedBy": uploaded_by_id,
            "username": current_user["username"]
        })

        subscriptions = list(mongo.db.subscriptions.find({}))
        notification_payload = {
            "title": "New Lost & Found Item",
            "body": f"{current_user['username']} uploaded a new item: {item_desc}",
            "url": "/"  # You can customize the URL to open on click
        }

        for sub in subscriptions:
            try:
                send_push_notification(sub, notification_payload)
            except Exception as e:
                print(f"Failed to send notification to {sub.get('endpoint')}: {e}")

        return jsonify({"message": "Item uploaded successfully"}), 200

    except Exception as e:
        print("Full upload error:", traceback.format_exc())
        return jsonify({'message': str(e)}), 500

@upload_bp.route('/delete/<upload_id>', methods=['DELETE'])
@token_required
def delete_upload(current_user, upload_id):
    try:
        mongo = current_app.mongo
        uploaded_by_id = current_user['_id']
        if isinstance(uploaded_by_id, str):
            uploaded_by_id = ObjectId(uploaded_by_id)

        item = mongo.db.items.find_one({
            "_id": ObjectId(upload_id),
            "uploadedBy": uploaded_by_id
        })

        if not item:
            return jsonify({"message": "Upload not found or not yours"}), 404

        # Delete from Cloudinary if public_id exists
        if item.get("public_id"):
            try:
                cloudinary.uploader.destroy(item["public_id"])
                print(f"Deleted image from Cloudinary: {item['public_id']}")
            except Exception as e:
                print(f"Failed to delete from Cloudinary: {e}")

        # Delete from MongoDB
        mongo.db.items.delete_one({"_id": ObjectId(upload_id)})

        return jsonify({"message": "Item deleted successfully"}), 200

    except Exception as e:
        print("Error deleting upload:", e)
        return jsonify({"message": "Failed to delete upload"}), 500

@upload_bp.route('/uploads', methods=['GET'])
def get_all_uploads():
    try:
        mongo = current_app.mongo
        uploads_cursor = mongo.db.items.find({}).sort("timestamp", -1)
        
        uploads = []
        for u in uploads_cursor:
            u['_id'] = str(u['_id'])
            uploads.append(u)
        return jsonify(uploads), 200
    except Exception as e:
        print("Error fetching all uploads:", e)
        return jsonify({'error': 'Could not fetch uploads'}), 500

@upload_bp.route('/myuploads', methods=['GET'])
@token_required
def my_uploads(current_user):
    try:
        mongo = current_app.mongo

        uploaded_by_id = current_user['_id']
        if isinstance(uploaded_by_id, str):
            uploaded_by_id = ObjectId(uploaded_by_id)

        uploads_cursor = mongo.db.items.find({"uploadedBy": uploaded_by_id})

        uploads = []
        for u in uploads_cursor:
            u['_id'] = str(u['_id'])
            uploads.append(u)

        return jsonify(uploads), 200

    except Exception as e:
        print("Error fetching my uploads:", e)
        return jsonify({'error': 'Could not fetch uploads'}), 500

@upload_bp.route('/mark-claimed/<upload_id>', methods=['POST'])
@token_required
def mark_as_claimed(current_user, upload_id):
    try:
        mongo = current_app.mongo

        uploaded_by_id = current_user['_id']
        if isinstance(uploaded_by_id, str):
            uploaded_by_id = ObjectId(uploaded_by_id)

        item = mongo.db.items.find_one({
            "_id": ObjectId(upload_id),
            "uploadedBy": uploaded_by_id
        })

        if not item:
            return jsonify({"message": "Upload not found or not yours"}), 404

        mongo.db.items.update_one(
            {"_id": ObjectId(upload_id)},
            {"$set": {"status": "claimed"}}
        )
        return jsonify({"message": "Marked as claimed"}), 200
    except Exception as e:
        print("Error updating status:", e)
        return jsonify({"message": "Failed to mark as claimed"}), 500

