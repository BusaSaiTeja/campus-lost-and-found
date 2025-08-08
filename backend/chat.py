from flask import Blueprint, request, jsonify
from flask_socketio import emit, join_room
from bson import ObjectId
from bson.errors import InvalidId

chat_bp = Blueprint("chat", __name__)

# Globals for DB collections and socketio
users_col = None
chats_col = None
userchats_col = None
socketio = None

def init_socketio(sio):
    global socketio
    socketio = sio

    @socketio.on("join")
    def handle_join(data):
        chat_id = data.get("chatId")
        join_room(chat_id)
        print(f"✅ User joined chat room {chat_id}")

    @socketio.on("send_message")
    def handle_send_message(data):
        chat_id = data.get("chatId")
        sender = data.get("sender")
        text = data.get("text")

        message = {"sender": sender, "text": text}

        # Save to DB
        chats_col.update_one(
            {"_id": ObjectId(chat_id)},
            {"$push": {"messages": message}}
        )

        # Broadcast to room
        emit("receive_message", message, to=chat_id)

def init_chat(db, sio):
    global users_col, chats_col, userchats_col, socketio
    users_col = db["users"]
    chats_col = db["chats"]
    userchats_col = db["userchats"]
    socketio = sio

@chat_bp.route("/chat/start", methods=["POST"])
def start_chat():
    data = request.json
    user1_id = str(data.get("user1"))
    user2_id = str(data.get("user2"))

    # Validate ObjectId format
    try:
        user1_obj = ObjectId(user1_id)
        user2_obj = ObjectId(user2_id)
    except InvalidId:
        return jsonify({"error": "Invalid user ID format"}), 400

    # Fetch usernames
    user1_data = users_col.find_one({"_id": user1_obj}, {"username": 1})
    user2_data = users_col.find_one({"_id": user2_obj}, {"username": 1})

    if not user1_data or not user2_data:
        return jsonify({"error": "One or both users not found"}), 404

    users_info = [
        (user1_id, user1_data["username"]),
        (user2_id, user2_data["username"])
    ]
    users_info.sort(key=lambda x: x[0])  # sort by user ID string

    # Check for existing chat
    existing_chat = chats_col.find_one({
        "user1": users_info[0][0],
        "user2": users_info[1][0]
    })

    if existing_chat:
        return jsonify({
            "chatId": str(existing_chat["_id"]),
            "user1_name": users_info[0][1],
            "user2_name": users_info[1][1]
        })

    # Create new chat
    new_chat = {
        "user1": users_info[0][0],
        "user2": users_info[1][0],
        "user1_name": users_info[0][1],
        "user2_name": users_info[1][1],
        "messages": []
    }
    chat_id = chats_col.insert_one(new_chat).inserted_id

    # Update user chats collections
    userchats_col.update_one(
        {"userId": users_info[0][0]}, 
        {"$addToSet": {"chats": str(chat_id)}}, upsert=True
    )
    userchats_col.update_one(
        {"userId": users_info[1][0]}, 
        {"$addToSet": {"chats": str(chat_id)}}, upsert=True
    )

    return jsonify({
        "chatId": str(chat_id),
        "user1_name": users_info[0][1],
        "user2_name": users_info[1][1]
    })

@chat_bp.route("/chat/<chat_id>/messages", methods=["GET"])
def get_messages(chat_id):
    try:
        chat = chats_col.find_one({"_id": ObjectId(chat_id)})
    except InvalidId:
        return jsonify({"messages": []})

    if not chat:
        return jsonify({"messages": []})

    return jsonify({"messages": chat.get("messages", [])})
