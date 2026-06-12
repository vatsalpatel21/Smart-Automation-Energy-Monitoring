import functools
import logging
from flask import Blueprint, request, jsonify
import jwt
import datetime
from werkzeug.security import check_password_hash, generate_password_hash
from models import get_db
from config import SECRET_KEY, TOKEN_EXPIRY_HOURS

auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger(__name__)


def token_required(f):
    """Decorator to protect routes with JWT authentication."""
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Authentication token is missing"}), 401

        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user = data
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid authentication token"}), 401

        return f(*args, **kwargs)

    return decorated


def role_required(role):
    """Decorator to restrict access to a specific role."""
    def decorator(f):
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            if request.user.get("role") != role:
                return jsonify({"error": "Access denied: insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


def log_login_attempt(username, role, status):
    """Log the login attempt to the database."""
    ip_address = request.remote_addr
    device = request.user_agent.string[:255] if request.user_agent else "Unknown"
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO login_history (username, role, ip_address, device, status) VALUES (?, ?, ?, ?, ?)",
            (username, role, ip_address, device, status)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to log login attempt: {e}")


@auth_bp.route("/api/login", methods=["POST"])
def login():
    """Login endpoint — validates credentials and returns JWT."""
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    email = (data.get("email") or "").strip()
    password = (data.get("password") or "").strip()

    if not email:
        return jsonify({"error": "Email is required"}), 400
    if not password:
        return jsonify({"error": "Password is required"}), 400

    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        conn.close()
    except Exception as e:
        logger.error(f"Database error during login: {e}")
        return jsonify({"error": "Server error. Please try again."}), 500

    # User not found
    if user is None:
        logger.warning(f"Login attempt with unknown email: {email}")
        log_login_attempt(email, None, "Failed")
        return jsonify({"error": "Invalid email or password"}), 401

    # Password mismatch
    if not check_password_hash(user["password_hash"], password):
        logger.warning(f"Failed login for user: {email}")
        log_login_attempt(email, user["role"], "Failed")
        return jsonify({"error": "Invalid email or password"}), 401

    try:
        token = jwt.encode(
            {
                "user_id": user["id"],
                "username": user["email"],
                "email": user["email"],
                "role": user["role"],
                "exp": datetime.datetime.utcnow()
                + datetime.timedelta(hours=TOKEN_EXPIRY_HOURS),
            },
            SECRET_KEY,
            algorithm="HS256",
        )
    except Exception as e:
        logger.error(f"JWT encoding error: {e}")
        return jsonify({"error": "Server error. Please try again."}), 500

    logger.info(f"Successful login: {email} ({user['role']})")
    log_login_attempt(email, user["role"], "Success")
    
    return jsonify({
        "token": token,
        "username": user["email"],
        "email": user["email"],
        "role": user["role"],
    })


@auth_bp.route("/api/register", methods=["POST"])
def register():
    """Simple one-step user registration endpoint."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400
        
    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip()
    mobile = (data.get("mobile_number") or "").strip()
    password = (data.get("password") or "").strip()
    
    if not full_name or not email or not mobile or not password:
        return jsonify({"error": "Name, email, mobile number, and password are required"}), 400
        
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
        
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Ensure user doesn't already exist
        cursor.execute("SELECT id FROM users WHERE email = ? OR mobile_number = ?", (email, mobile))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "User with this email or mobile already exists"}), 400
            
        pw_hash = generate_password_hash(password)
        
        # Insert new user
        cursor.execute(
            "INSERT INTO users (full_name, email, mobile_number, password_hash, role) VALUES (?, ?, ?, ?, 'user')",
            (full_name, email, mobile, pw_hash)
        )
        
        conn.commit()
        conn.close()
        
        logger.info(f"New user registered: {email}")
        return jsonify({"message": "Registration successful"}), 201
        
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return jsonify({"error": "Failed to create user. Please try again."}), 500
