from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, date

app = Flask(__name__)
CORS(app)

# ✅ Only 1 room in the whole project
ROOM = {"id": 1, "type": "Deniz Manzaralı Standart Oda", "price_per_night": 2500, "capacity": 2, "status": "available"}

# ✅ Single reservation list (only 1 allowed)
RESERVATIONS = []

MIN_DATE = date(2026, 1, 1)

@app.get("/api/health")
def health():
    return {"ok": True, "time": datetime.utcnow().isoformat()}

@app.get("/api/rooms")
def list_rooms():
    return jsonify([ROOM])

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

    # ✅ Only one reservation allowed in the whole project
    if len(RESERVATIONS) > 0:
        return jsonify({"error": "This project has only one room. A reservation already exists."}), 409

    # ✅ Only the single room is valid
    if int(data["room_id"]) != int(ROOM["id"]):
        return jsonify({"error": "Room not found (single-room demo)."}), 404

    # ✅ Room must be available
    if ROOM["status"] != "available":
        return jsonify({"error": "Room not available"}), 409

    # ✅ Date validations
    try:
        check_in = date.fromisoformat(data["check_in"])
        check_out = date.fromisoformat(data["check_out"])
    except Exception:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    if check_in < MIN_DATE or check_out < MIN_DATE:
        return jsonify({"error": "Reservations start from January 1, 2026"}), 400

    if check_out <= check_in:
        return jsonify({"error": "Check-out must be after check-in"}), 400

    guests = int(data["guests"])
    if guests <= 0:
        return jsonify({"error": "Guests must be >= 1"}), 400
    if guests > int(ROOM["capacity"]):
        return jsonify({"error": "Guests exceed room capacity"}), 400

    reservation = {
        "id": 1,
        "full_name": data["full_name"].strip(),
        "room_id": int(ROOM["id"]),
        "check_in": data["check_in"],
        "check_out": data["check_out"],
        "guests": guests,
        "created_at": datetime.utcnow().isoformat()
    }
    RESERVATIONS.append(reservation)

    # ✅ After booking, mark room unavailable (nice demo detail)
    ROOM["status"] = "reserved"

    return jsonify(reservation), 201

if __name__ == "__main__":
    app.run(port=5000, debug=True)
