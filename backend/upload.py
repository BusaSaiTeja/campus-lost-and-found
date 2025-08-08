import base64
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from datetime import datetime
import cloudinary.uploader
from bson import ObjectId
from auth import token_required
import traceback

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
        contact = data.get('contact')
        geo_location = data.get('geoLocation')
        uploaded_by_id = current_user['_id']

        # Validate required fields
        missing = []
        if not image_data:
            missing.append('image')
        if not place_desc:
            missing.append('placeDesc')
        if not item_desc:
            missing.append('itemDesc')
        if not contact:
            missing.append('contact')
        if not geo_location:
            missing.append('geoLocation')

        if missing:
            return jsonify({'message': f'Missing required fields: {", ".join(missing)}'}), 400
        
        # Validate geo location structure
        if not isinstance(geo_location, dict) or 'lat' not in geo_location or 'lng' not in geo_location:
            return jsonify({'message': 'Invalid location data'}), 400

        # Improved base64 handling
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

        # Cloudinary upload
        upload_result = cloudinary.uploader.upload(
            decoded_image,
            resource_type="image",
            public_id=filename,
            overwrite=True,
            folder="lost_items"
        )

        image_url = upload_result.get('secure_url')
        if not image_url:
            return jsonify({'message': 'Image upload failed'}), 500

        # Ensure current_user['_id'] is ObjectId
        uploaded_by_id = current_user['_id']
        if isinstance(uploaded_by_id, str):
            uploaded_by_id = ObjectId(uploaded_by_id)

        # Create GeoJSON object
        location_geojson = {
            "type": "Point",
            "coordinates": [geo_location['lng'], geo_location['lat']]
        }

        # Insert into MongoDB
        mongo.db.items.insert_one({
            "placeDesc": place_desc,
            "itemDesc": item_desc,
            "imageUrl": image_url,
            "contact": contact,
            "location": location_geojson,
            "timestamp": datetime.utcnow(),
            "status": "not claimed",
            "uploadedBy": uploaded_by_id,
            "username": current_user["username"]
        })

        return jsonify({"message": "Item uploaded successfully"}), 200

    except Exception as e:
        print("Full upload error:", traceback.format_exc())
        return jsonify({'message': str(e)}), 500

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
