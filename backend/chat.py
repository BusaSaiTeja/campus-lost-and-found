# chat.py
from flask import Blueprint, request, jsonify, current_app
from flask_socketio import emit, join_room, leave_room
from bson import ObjectId
from bson.errors import InvalidId
import datetime, jwt

from auth import token_required   # uses your existing decorator
# Expect a User model similar to your auth code that can find_by_username
from models import User

chat_bp = Blueprint("chat", __name__)

# Globals for DB collections and socketio
users_col = None
chats_col = None
socketio = None

# -------------------- Helpers --------------------

def _get_user_from_access_cookie():
    """
    Resolve current user from access_token cookie (JWT with {'username': ...}).
    Returns user dict or None.
    """
    token = request.cookies.get("access_token")
    if not token:
        return None
    try:
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
        username = payload.get("username")
        if not username:
            return None
        user = User.find_by_username(username)
        return user
    except Exception:
        return None

def _ensure_participant(chat_doc, user_id_str):
    return any(p["userId"] == user_id_str for p in chat_doc.get("participants", []))

# -------------------- Socket.IO --------------------

def init_socketio(sio):
    global socketio
    socketio = sio

    @socketio.on("join")
    def handle_join(data):
        chat_id = data.get("chatId")
        if not chat_id:
            return
        user = _get_user_from_access_cookie()
        if not user:
            return  # silently drop unauthenticated joins

        try:
            chat_obj_id = ObjectId(chat_id)
        except InvalidId:
            return

        chat = chats_col.find_one({"_id": chat_obj_id}, {"participants": 1})
        if not chat:
            return

        user_id = str(user["_id"])
        if not _ensure_participant(chat, user_id):
            return  # not allowed to join rooms you don't belong to

        join_room(chat_id)
        emit("joined", {"chatId": chat_id})

    @socketio.on("leave")
    def handle_leave(data):
        chat_id = data.get("chatId")
        if not chat_id:
            return
        leave_room(chat_id)

    @socketio.on("typing")
    def handle_typing(data):
        # { chatId, isTyping: bool }
        chat_id = data.get("chatId")
        is_typing = bool(data.get("isTyping"))
        user = _get_user_from_access_cookie()
        if not chat_id or not user:
            return
        emit("typing", {
            "chatId": chat_id,
            "userId": str(user["_id"]),
            "username": user["username"],
            "isTyping": is_typing
        }, to=chat_id, include_self=False)

    @socketio.on("send_message")
    def handle_send_message(data):
        """
        Client emits: { chatId, text }
        Sender is taken from cookie token (no trusting client-sent senderId).
        """
        chat_id = data.get("chatId")
        text = (data.get("text") or "").strip()
        if not chat_id or not text:
            return

        sender = _get_user_from_access_cookie()
        if not sender:
            return

        try:
            chat_obj_id = ObjectId(chat_id)
        except InvalidId:
            return

        chat = chats_col.find_one({"_id": chat_obj_id}, {"participants": 1})
        if not chat:
            return

        sender_id = str(sender["_id"])
        if not _ensure_participant(chat, sender_id):
            return

        now = datetime.datetime.utcnow()
        msg = {
            "_id": ObjectId(),
            "senderId": sender_id,
            "text": text,
            "timestamp": now,
            "readBy": [sender_id],  # sender has "read" their own message
        }

        # Persist message and lastMessage
        chats_col.update_one(
            {"_id": chat_obj_id},
            {
                "$push": {"messages": msg},
                "$set": {"lastMessage": {"text": text, "senderId": sender_id, "timestamp": now}}
            }
        )

        # Broadcast to room
        socketio.emit("receive_message", {
            "_id": str(msg["_id"]),
            "senderId": sender_id,
            "senderName": sender["username"],
            "text": text,
            "timestamp": now.isoformat() + "Z"
        }, to=chat_id)

def init_chat(db, sio):
    global users_col, chats_col, socketio
    users_col = db["users"]
    chats_col = db["chats"]
    socketio = sio

# -------------------- REST APIs --------------------

@chat_bp.route("/chat/start", methods=["POST"])
@token_required
def start_chat(current_user):
    """
    Start (or get) a 1:1 chat with another user by their MongoDB _id.
    Body: { partnerId: string }  # MongoDB ObjectId
    """
    data = request.get_json(force=True)
    partner_id_str = (data.get("partnerId") or "").strip()

    if not partner_id_str:
        return jsonify({"error": "partnerId is required"}), 400

    if partner_id_str == str(current_user["_id"]):
        return jsonify({"error": "Cannot start chat with yourself"}), 400

    try:
        partner_obj_id = ObjectId(partner_id_str)
    except Exception:
        return jsonify({"error": "Invalid partner ID"}), 400

    partner = users_col.find_one({"_id": partner_obj_id})
    if not partner:
        return jsonify({"error": "User not found"}), 404

    user_id = str(current_user["_id"])
    partner_id = str(partner["_id"])

    # Check if chat exists
    existing = chats_col.find_one({
        "participants.userId": {"$all": [user_id, partner_id]},
        "$expr": {"$eq": [{"$size": "$participants"}, 2]}
    }, {"_id": 1})

    if existing:
        return jsonify({"chatId": str(existing["_id"])})

    # Create new chat
    chat_doc = {
        "participants": [
            {"userId": user_id, "username": current_user["username"]},
            {"userId": partner_id, "username": partner["username"]},
        ],
        "messages": [],
        "lastMessage": None
    }
    inserted = chats_col.insert_one(chat_doc)
    return jsonify({"chatId": str(inserted.inserted_id)})


@chat_bp.route("/chat/user", methods=["GET"])
@token_required
def get_user_chats(current_user):
    """
    List chats for the logged-in user.
    Returns: [{ chatId, withUser, withUserId, lastMessage, unreadCount }]
    """
    user_id = str(current_user["_id"])

    chats = chats_col.find({"participants.userId": user_id})
    result = []
    for c in chats:
        # find partner
        partner = next((p for p in c.get("participants", []) if p["userId"] != user_id), None)
        if not partner:
            continue

        # compute unread
        unread = 0
        for m in c.get("messages", []):
            if user_id not in (m.get("readBy") or []):
                unread += 1

        result.append({
            "chatId": str(c["_id"]),
            "withUser": partner["username"],
            "withUserId": partner["userId"],
            "lastMessage": c.get("lastMessage"),
            "unreadCount": unread
        })

    # sort by lastMessage timestamp desc
    result.sort(key=lambda x: x["lastMessage"]["timestamp"] if x.get("lastMessage") else datetime.datetime.min, reverse=True)
    # jsonify timestamps
    for r in result:
        if r.get("lastMessage") and isinstance(r["lastMessage"].get("timestamp"), datetime.datetime):
            r["lastMessage"]["timestamp"] = r["lastMessage"]["timestamp"].isoformat() + "Z"

    return jsonify({"chats": result})

@chat_bp.route("/chat/<chat_id>/info", methods=["GET"])
@token_required
def chat_info(current_user, chat_id):
    try:
        chat_obj = ObjectId(chat_id)
    except InvalidId:
        return jsonify({"error": "Invalid chat ID"}), 400

    chat = chats_col.find_one({"_id": chat_obj})
    if not chat:
        return jsonify({"error": "Chat not found"}), 404

    user_id = str(current_user["_id"])
    if not _ensure_participant(chat, user_id):
        return jsonify({"error": "Forbidden"}), 403

    # find partner for convenience
    partner = next((p for p in chat["participants"] if p["userId"] != user_id), None)
    return jsonify({
        "chatId": chat_id,
        "participants": chat["participants"],
        "partner": partner
    })

@chat_bp.route("/chat/<chat_id>/messages", methods=["GET"])
@token_required
def get_messages(current_user, chat_id):
    """
    Return all messages sorted by timestamp asc.
    Also mark all messages as read by the current user.
    """
    try:
        chat_obj = ObjectId(chat_id)
    except InvalidId:
        return jsonify({"messages": []})

    chat = chats_col.find_one({"_id": chat_obj})
    if not chat:
        return jsonify({"messages": []})

    user_id = str(current_user["_id"])
    if not _ensure_participant(chat, user_id):
        return jsonify({"error": "Forbidden"}), 403

    messages = chat.get("messages", [])
    # sort safely
    messages.sort(key=lambda m: m.get("timestamp") or datetime.datetime.min)

    # mark as read
    chats_col.update_one(
        {"_id": chat_obj},
        {"$addToSet": {"messages.$[].readBy": user_id}}
    )

    # serialize ObjectIds and datetimes
    out = []
    for m in messages:
        out.append({
            "_id": str(m["_id"]) if isinstance(m.get("_id"), ObjectId) else m.get("_id"),
            "senderId": m.get("senderId"),
            "text": m.get("text", ""),
            "timestamp": (m.get("timestamp").isoformat() + "Z") if isinstance(m.get("timestamp"), datetime.datetime) else m.get("timestamp"),
            "readBy": m.get("readBy", [])
        })

    return jsonify({"messages": out})

@chat_bp.route("/chat/<chat_id>/read", methods=["POST"])
@token_required
def mark_read(current_user, chat_id):
    try:
        chat_obj = ObjectId(chat_id)
    except InvalidId:
        return jsonify({"error": "Invalid chat ID"}), 400

    user_id = str(current_user["_id"])
    chat = chats_col.find_one({"_id": chat_obj})
    if not chat:
        return jsonify({"error": "Not found"}), 404
    if not _ensure_participant(chat, user_id):
        return jsonify({"error": "Forbidden"}), 403

    chats_col.update_one(
        {"_id": chat_obj},
        {"$addToSet": {"messages.$[].readBy": user_id}}
    )
    return jsonify({"ok": True})
