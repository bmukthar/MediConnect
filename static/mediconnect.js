// Generate unique ID (can be replaced with server logic)
function generateId() {
    return "PID-" + Date.now().toString(36) + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// --- Patient Registration ---
document.getElementById("registerForm").onsubmit = async (e) => {
    e.preventDefault();
    const id = generateId();
    const payload = {
        id,
        name: document.getElementById("regName").value,
        age: document.getElementById("regAge").value,
        gender: document.getElementById("regGender").value,
        visit_date: document.getElementById("regDate").value,
        diagnosis: document.getElementById("regDiagnosis").value,
        treatment: document.getElementById("regTreatment").value,
        notes: document.getElementById("regNotes").value,
    };
    const res = await fetch("/api/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === "success") {
        document.getElementById("regResult").innerHTML = `
          <div class="alert alert-success">
            Registered! <br><b>Patient ID: <span class="text-primary">${id}</span></b><br>
            <small>Use this ID to access records across any hospital using MediConnect.</small>
          </div>
        `;
        document.getElementById("registerForm").reset();
    }
};

// --- Patient Search ---
document.getElementById("searchForm").onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById("searchId").value.trim();
    const resultDiv = document.getElementById("searchResult");
    resultDiv.innerHTML = '<div class="text-muted">Loading...</div>';
    const res = await fetch(`/api/patient/${id}`);
    const data = await res.json();
    if (data.status === "not_found") {
        resultDiv.innerHTML = '<div class="alert alert-danger">No patient found with this ID.</div>';
    } else {
        // Render patient info and history
        let html = `
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">${data.patient.name} (ID: <span class="text-primary">${data.patient.id}</span>)</h5>
              <div class="mb-2"><b>Age:</b> ${data.patient.age} | <b>Gender:</b> ${data.patient.gender}</div>
              <button class="btn btn-sm btn-outline-success" onclick="showAddHistoryModal('${data.patient.id}')">Add Visit/History</button>
            </div>
          </div>
        `;
        if (data.history.length === 0) {
            html += `<div class="alert alert-warning">No medical history found.</div>`;
        } else {
            html += `
              <h6>Medical History:</h6>
              <ul class="list-group">
                ${data.history.map(h => `
                  <li class="list-group-item">
                    <b>Date:</b> ${h.visit_date} <br>
                    <b>Diagnosis:</b> ${h.diagnosis}<br>
                    <b>Treatment:</b> ${h.treatment}<br>
                    <b>Notes:</b> ${h.notes || '-'}
                  </li>
                `).join('')}
              </ul>
            `;
        }
        resultDiv.innerHTML = html;
    }
};

// --- Add History Modal ---
window.showAddHistoryModal = (patientId) => {
    document.getElementById("historyPatientId").value = patientId;
    document.getElementById("historyForm").reset();
    const modal = new bootstrap.Modal(document.getElementById("historyModal"));
    modal.show();
};

document.getElementById("historyForm").onsubmit = async (e) => {
    e.preventDefault();
    const patientId = document.getElementById("historyPatientId").value;
    const payload = {
        visit_date: document.getElementById("historyDate").value,
        diagnosis: document.getElementById("historyDiagnosis").value,
        treatment: document.getElementById("historyTreatment").value,
        notes: document.getElementById("historyNotes").value,
    };
    const res = await fetch(`/api/patient/history/${patientId}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === "success") {
        const modal = bootstrap.Modal.getInstance(document.getElementById("historyModal"));
        modal.hide();
        document.getElementById("searchForm").dispatchEvent(new Event('submit'));
    }
};