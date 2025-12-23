from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

ROOMS = [
    {"id": 101, "type": "Deluxe", "price_per_night": 2500, "capacity": 2, "status": "available"},
    {"id": 102, "type": "Suite",  "price_per_night": 4200, "capacity": 3, "status": "available"},
    {"id": 201, "type": "Standard", "price_per_night": 1700, "capacity": 2, "status": "maintenance"},
]

RESERVATIONS = []

@app.get("/api/health")
def health():
    return {"ok": True, "time": datetime.utcnow().isoformat()}

@app.get("/api/rooms")
def list_rooms():
    return jsonify(ROOMS)

@app.get("/api/reservations")
def list_reservations():
    return jsonify(RESERVATIONS)

@app.post("/api/reservations")
def create_reservation():
    data = request.get_json(force=True)

    required = ["full_name", "room_id", "check_in", "check_out", "guests"]
    missing = [k for k in required if k not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    room = next((r for r in ROOMS if r["id"] == int(data["room_id"])), None)
    if not room:
        return jsonify({"error": "Room not found"}), 404
    if room["status"] != "available":
        return jsonify({"error": "Room not available"}), 409

    reservation = {
        "id": len(RESERVATIONS) + 1,
        "full_name": data["full_name"],
        "room_id": int(data["room_id"]),
        "check_in": data["check_in"],
        "check_out": data["check_out"],
        "guests": int(data["guests"]),
        "created_at": datetime.utcnow().isoformat()
    }
    RESERVATIONS.append(reservation)
    return jsonify(reservation), 201

if __name__ == "__main__":
    app.run(port=5000, debug=True)
