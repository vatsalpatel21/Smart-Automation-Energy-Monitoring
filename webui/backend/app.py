import os
from flask import Flask, jsonify
from flask_cors import CORS
from models import init_db, seed_users
from auth import auth_bp
from routes import api_bp
from google_sheets import start_google_sheets_sync


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp)

    # Convenience root route: return a small JSON so visiting the backend root doesn't 404
    @app.route("/")
    def index():
        return jsonify({"message": "Backend running. Open the frontend at http://localhost:5173"}), 200

    # Initialize database and seed users
    with app.app_context():
        init_db()
        seed_users()
        print("Database initialized and users seeded")

    return app


if __name__ == "__main__":
    app = create_app()
    
    # Enable simulator for live demo data
    from simulator import start_simulator
    start_simulator()
    
    start_google_sheets_sync()
    port = int(os.environ.get("PORT", 5000))
    print(f"Flask server starting on http://127.0.0.1:{port}")
    app.run(debug=False, host="0.0.0.0", port=port, threaded=True)
