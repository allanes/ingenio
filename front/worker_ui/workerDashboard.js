function showWorkerDashboard() {
    const user = state.currentUser;
    if (!user) return showLogin();
  
    const flows = state.workflows.filter(f =>
      f.enabled &&
      f.steps.some(s => s.assignedTo === user.name)
    );
  
    const html = `
      <h2>Mis Tareas</h2>
      ${flows.map(flow => renderFlowCard(flow, user.name)).join("")}
      <button class="btn btn-outline-secondary mt-3" onclick="logout()">Cerrar sesión</button>
    `;
  
    document.getElementById("app").innerHTML = html;
  }
  
  function renderFlowCard(flow, username) {
    const currentStep = flow.steps.find(s =>
      s.assignedTo === username &&
      (!s.dependsOn || s.dependsOn.every(id => flow.steps.find(fs => fs.id === id)?.status === "done")) &&
      s.status !== "done"
    );
  
    const flowProgress = flow.steps.filter(s => s.status === "done").length / flow.steps.length;
  
    return `
      <div class="card mb-3">
        <div class="card-header bg-primary text-white">
          ${flow.name}
        </div>
        <div class="card-body">
          ${flow.steps.map(step => renderStepStatus(step, username)).join("")}
          ${currentStep ? `
            <button class="btn btn-success mt-3" onclick="startStep(${flow.id}, ${currentStep.id})">Iniciar: ${currentStep.name}</button>
          ` : "<div class='text-muted mt-2'>No hay pasos disponibles aún.</div>"}
          <div class="progress mt-3" style="height: 20px;">
            <div class="progress-bar" role="progressbar" style="width: ${Math.round(flowProgress * 100)}%">
              ${Math.round(flowProgress * 100)}%
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  function renderStepStatus(step, username) {
    const label = step.name + (step.isPassive ? " ⏱️" : "");
    if (step.status === "done") {
      return `<div class="text-success">✅ ${label}</div>`;
    } else if (step.assignedTo === username) {
      return `<div class="text-warning">🟡 ${label}</div>`;
    } else if (step.isPassive) {
      return `<div class="text-info">⏳ ${label} (esperando)</div>`;
    } else {
      return `<div class="text-muted">🔒 ${label}</div>`;
    }
  }
  
  function startStep(flowId, stepId) {
    const flow = state.workflows.find(f => f.id === flowId);
    const step = flow.steps.find(s => s.id === stepId);
  
    step.status = "in_progress";
    step.startedAt = Date.now();
    saveState();
  
    showStepInProgress(flow, step);
  }
  
  let stepTimer = null;
  
  function showStepInProgress(flow, step) {
    clearInterval(stepTimer);
  
    const expected = step.expectedTime;
    const start = step.startedAt;
    const container = document.getElementById("app");
  
    container.innerHTML = `
      <div class="card">
        <div class="card-header bg-success text-white">${step.name}</div>
        <div class="card-body">
          <p><strong>Tiempo esperado:</strong> ${expected} minutos</p>
          <p><strong>Tiempo actual:</strong> <span id="stepTimer">00:00</span></p>
          <div class="progress mb-3" style="height: 20px;">
            <div id="progressBar" class="progress-bar bg-info" role="progressbar" style="width: 0%">0%</div>
          </div>
          <button class="btn btn-success" onclick="finishStep(${flow.id}, ${step.id})">✅ Terminar</button>
          <button class="btn btn-outline-secondary" onclick="showWorkerDashboard()">← Volver</button>
        </div>
      </div>
    `;
  
    stepTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      document.getElementById("stepTimer").textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
      const pct = Math.min(100, Math.round((elapsed / (expected * 60)) * 100));
      document.getElementById("progressBar").style.width = `${pct}%`;
      document.getElementById("progressBar").textContent = `${pct}%`;
    }, 1000);
  }
  
  function finishStep(flowId, stepId) {
    clearInterval(stepTimer);
    const flow = state.workflows.find(f => f.id === flowId);
    const step = flow.steps.find(s => s.id === stepId);
    const elapsed = Date.now() - step.startedAt;
    const expectedMs = step.expectedTime * 60 * 1000;
  
    if (elapsed > expectedMs) {
      alert("Tiempo excedido. Se debe registrar un problema (pendiente de implementar).");
      return;
    }
  
    step.status = "done";
    saveState();
    showWorkerDashboard();
  }
  