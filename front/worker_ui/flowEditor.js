function showFlowEditor(flowId = null) {
    let flow = flowId
      ? state.flows.find(f => f.id === flowId)
      : { id: Date.now(), name: "", steps: [] };
    const isNew = !flowId;
  
    const nameInput = document.getElementById("flow-name");
    if (nameInput) {
      flow.name = nameInput.value;
      flow.steps.forEach((step, i) => {
        const nameEl = document.getElementById(`step-name-${i}`);
        const userEl = document.getElementById(`step-user-${i}`);
        const dependsEl = document.getElementById(`step-depends-${i}`);
        if (nameEl) step.name = nameEl.value;
        if (userEl) step.assignedTo = userEl.value;
        if (dependsEl) step.dependsOn = Array.from(dependsEl.selectedOptions).map(o => parseInt(o.value));
      });
    }
  
    const container = document.getElementById("app");
    container.innerHTML = renderHeader(isNew ? "Crear Flujo" : "Editar Flujo");
  
    let stepHTML = flow.steps.map((step, i) => {
      const userOptions = Object.keys(users)
        .filter(u => users[u] === "worker")
        .map(u => `<option value="${u}" ${step.assignedTo === u ? "selected" : ""}>${u}</option>`)
        .join("");
  
      const dependsOptions = flow.steps
        .filter((_, j) => j !== i)
        .map(other => {
          const selected = (step.dependsOn || []).includes(other.id) ? "selected" : "";
          return `<option value="${other.id}" ${selected}>${other.name || "(sin nombre)"}</option>`;
        })
        .join("");
  
      return `
        <li class="list-group-item bg-light mb-2 p-3 rounded">
          <div class="mb-2">
            <label>Nombre del Paso</label>
            <input type="text" class="form-control" id="step-name-${i}" value="${step.name || ""}">
          </div>
          <div class="mb-2">
            <label>Asignado a</label>
            <select class="form-select" id="step-user-${i}">
              <option disabled selected>Seleccionar usuario</option>
              ${userOptions}
            </select>
          </div>
          <div class="mb-2">
            <label>Tiempo estimado (minutos)</label>
            <input type="number" class="form-control" id="step-time-${i}" value="${step.expectedMinutes || ''}" min="1">
          </div>
          <div class="mb-2">
            <label>No puede comenzar hasta completar:</label>
            <select class="form-select" id="step-depends-${i}" multiple>
              ${dependsOptions}
            </select>
          </div>
          <button class="btn btn-sm btn-outline-danger mt-2" onclick="removeStep(${i})">🗑️ Eliminar Paso</button>
        </li>
      `;
    }).join("");
  
    container.innerHTML += `
      <div class="mb-3">
        <label class="form-label">Nombre del Flujo</label>
        <input id="flow-name" type="text" class="form-control" value="${flow.name}">
      </div>
  
      <h5>Pasos</h5>
      <ul id="step-editor-list" class="list-group mb-3">
        ${stepHTML}
      </ul>
  
      <button class="btn btn-outline-secondary btn-sm mb-3" onclick="addStep()">➕ Agregar Paso</button><br>
      <button class="btn btn-primary" onclick="saveFlow(${flow.id})">💾 Guardar</button>
      <button class="btn btn-outline-secondary ms-2" onclick="showManagerDashboard()">🔙 Cancelar</button>
    `;
  
    state.editingFlow = flow;
  }
  
  function addStep() {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    state.editingFlow.steps.push({
      id,
      name: "",
      assignedTo: "",
      dependsOn: [],
      status: "locked"
    });
    showFlowEditor(state.editingFlow.id);
  }
  
  function removeStep(index) {
    state.editingFlow.steps.splice(index, 1);
    showFlowEditor(state.editingFlow.id);
  }
  
  function saveFlow(flowId) {
    const flow = state.editingFlow;
    flow.name = document.getElementById("flow-name").value;
  
    const steps = flow.steps.map((step, i) => ({
      id: step.id,
      name: document.getElementById(`step-name-${i}`).value,
      assignedTo: document.getElementById(`step-user-${i}`).value,
      dependsOn: Array.from(document.getElementById(`step-depends-${i}`).selectedOptions).map(o => parseInt(o.value)),
      expectedMinutes: parseInt(document.getElementById(`step-time-${i}`).value) || 0,
      status: i === 0 ? "in_progress" : "locked"
    }));
  
    const existing = state.flows.find(f => f.id === flowId);
    if (existing) {
      existing.name = flow.name;
      existing.steps = steps;
    } else {
      state.flows.push({ id: flowId, name: flow.name, steps });
    }
  
    localStorage.setItem("flows", JSON.stringify(state.flows));
    showManagerDashboard();
  }