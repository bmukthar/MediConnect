from flask import Flask, request, render_template, jsonify
import sqlite3
import os

app = Flask(__name__)

def init_db():
    if not os.path.exists("patients.db"):
        conn = sqlite3.connect("patients.db")
        c = conn.cursor()
        c.execute('''
            CREATE TABLE patients (
                id TEXT PRIMARY KEY,
                name TEXT,
                age INTEGER,
                gender TEXT
            )
        ''')
        c.execute('''
            CREATE TABLE history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id TEXT,
                visit_date TEXT,
                diagnosis TEXT,
                treatment TEXT,
                notes TEXT,
                FOREIGN KEY(patient_id) REFERENCES patients(id)
            )
        ''')
        conn.commit()
        conn.close()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/patient", methods=["POST"])
def add_patient():
    data = request.json
    conn = sqlite3.connect("patients.db")
    c = conn.cursor()
    # Insert patient
    c.execute("INSERT INTO patients (id, name, age, gender) VALUES (?, ?, ?, ?)",
              (data["id"], data["name"], data["age"], data["gender"]))
    # Insert first history entry
    c.execute('''
        INSERT INTO history (patient_id, visit_date, diagnosis, treatment, notes)
        VALUES (?, ?, ?, ?, ?)
    ''', (data["id"], data["visit_date"], data["diagnosis"], data["treatment"], data["notes"]))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

@app.route("/api/patient/<patient_id>", methods=["GET"])
def get_patient(patient_id):
    conn = sqlite3.connect("patients.db")
    c = conn.cursor()
    c.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
    patient = c.fetchone()
    if not patient:
        conn.close()
        return jsonify({"status": "not_found"})
    c.execute("SELECT visit_date, diagnosis, treatment, notes FROM history WHERE patient_id = ? ORDER BY visit_date DESC", (patient_id,))
    history = c.fetchall()
    conn.close()
    return jsonify({
        "status": "found",
        "patient": {"id": patient[0], "name": patient[1], "age": patient[2], "gender": patient[3]},
        "history": [
            {"visit_date": h[0], "diagnosis": h[1], "treatment": h[2], "notes": h[3]}
            for h in history
        ]
    })

@app.route("/api/patient/history/<patient_id>", methods=["POST"])
def add_history(patient_id):
    data = request.json
    conn = sqlite3.connect("patients.db")
    c = conn.cursor()
    c.execute('''
        INSERT INTO history (patient_id, visit_date, diagnosis, treatment, notes)
        VALUES (?, ?, ?, ?, ?)
    ''', (patient_id, data["visit_date"], data["diagnosis"], data["treatment"], data["notes"]))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

if __name__ == "__main__":
    init_db()
    app.run(debug=True)