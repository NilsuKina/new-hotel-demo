from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, date

app = Flask(__name__)
CORS(app)


ROOM = {
    "id": 1,
    "type": "Deniz Manzaralı Standart Oda",
    "price_per_night": 2500,
    "capacity": 2,
    "status": "available",
}

RESERVATIONS = []
MIN_DATE = date(2026, 1, 1)

def parse_date(s: str) -> date:
    return date.fromisoformat(s)

def overlaps(a_start: date, a_end: date, b_start: date, b_end: date) -> bool:
    # [start, end) overlap rule: a_start < b_end and a_end > b_start
    return a_start < b_end and a_end > b_start

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

    # Only the single room is valid
    if int(data["room_id"]) != int(ROOM["id"]):
        return jsonify({"error": "Room not found (single-room demo)."}), 404

    # Date validations
    try:
        check_in = parse_date(data["check_in"])
        check_out = parse_date(data["check_out"])
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

    
    for r in RESERVATIONS:
        existing_in = parse_date(r["check_in"])
        existing_out = parse_date(r["check_out"])
        if overlaps(check_in, check_out, existing_in, existing_out):
            return jsonify({"error": "Room already booked for the selected dates"}), 409

    reservation = {
        "id": len(RESERVATIONS) + 1,
        "full_name": data["full_name"].strip(),
        "room_id": int(ROOM["id"]),
        "check_in": data["check_in"],
        "check_out": data["check_out"],
        "guests": guests,
        "created_at": datetime.utcnow().isoformat()
    }
    RESERVATIONS.append(reservation)
    return jsonify(reservation), 201

@app.delete("/api/reservations/<int:res_id>")
def delete_reservation(res_id: int):
    global RESERVATIONS
    before = len(RESERVATIONS)
    RESERVATIONS = [r for r in RESERVATIONS if r["id"] != res_id]
    if len(RESERVATIONS) == before:
        return jsonify({"error": "Reservation not found"}), 404
    return jsonify({"ok": True}), 200

if __name__ == "__main__":
    app.run(port=5000, debug=True)
