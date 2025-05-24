let activeTimer = null;

function showWorkerDashboard() {
  const user = state.currentUser;
  if (!user) return;

  // Si hay paso activo persistido, continuar
  if (state.activeStep) {
    const flow = state.workflows.find(f => f.id === state.activeStep.flowId);
    const step = flow?.steps.find(s => s.id === state.activeStep.stepId);
    if (flow && step) {
      return showActiveStepView(flow, step, true);
    } else {
      state.activeStep = null;
      localStorage.removeItem("activeStep");
    }
  }

  // Get all enabled flows where user has assigned steps
  const flows = state.workflows.filter(f => 
    f.enabled && f.steps.some(s => s.assignedTo === user.name)
  );

  if (flows.length === 0) {
    document.getElementById("app").innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Mis Tareas</h2>
        <button class="btn btn-outline-danger" onclick="logout()">Cerrar sesión</button>
      </div>
      <p class="text-muted">No hay flujos disponibles.</p>
    `;
    return;
  }

  // Check for steps that should auto-start
  for (const flow of flows) {
    const steps = flow.steps;
    
    // Reset all steps if this is a new run (all steps are done)
    if (steps.every(s => s.status === "done")) {
      steps.forEach(s => {
        s.status = "pending";
        s.startedAt = null;
        s.problem = null;
      });
      saveState();
    }

    // Sync step configurations with their resources
    steps.forEach(step => {
      const resource = state.resources.find(r => r.id === step.fromResourceId);
      if (resource) {
        const resourceStep = resource.subworkflow.find(s => s.name === step.name);
        if (resourceStep) {
          step.expectedTime = resourceStep.expectedTime;
          step.isPassive = resourceStep.isPassive;
          step.dependsOn = resourceStep.dependsOn;
        }
      }
    });
    saveState();

    // Find the first pending step that should be started
    let foundPendingStep = false;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Skip if step is not pending
      if (step.status !== "pending") continue;
      
      foundPendingStep = true;
      
      // Check if all dependencies are met
      const ready = !step.dependsOn || step.dependsOn.every(id => 
        steps.find(s => s.id === id)?.status === "done"
      );
      
      if (!ready) break; // Stop if dependencies aren't met
      
      // Only auto-start if:
      // 1. It's a passive step
      // 2. OR it follows a passive step
      // 3. OR it's not the first step in the workflow
      if (step.isPassive || (i > 0 && steps[i-1].isPassive) || i > 0) {
        startStep(flow.id, step.id);
        return;
      }
      
      // If we get here, this is the first step and it's not passive
      // Don't auto-start it, just break the loop
      break;
    }
    
    // If we found no pending steps, the workflow might be complete
    if (!foundPendingStep) {
      const allDone = steps.every(s => s.status === "done");
      if (allDone) {
        flow.enabled = false;
        saveState();
      }
    }
  }

  // Build the dashboard content
  let content = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Mis Tareas</h2>
      <button class="btn btn-outline-danger" onclick="logout()">Cerrar sesión</button>
    </div>
  `;

  for (const flow of flows) {
    const steps = flow.steps;
    
    // Find the first available step for this user
    const firstUserStep = steps.findIndex(s => s.assignedTo === user.name && s.status !== "done");
    const previousStepsDone = firstUserStep === -1 ? false : 
      steps.slice(0, firstUserStep).every(s => s.status === "done");
    
    content += `
      <div class="card mb-4">
        <div class="card-header bg-primary text-white">${flow.name}</div>
        <div class="card-body">
          <div class="list-group">
    `;

    // Show all steps in order
    steps.forEach((step, index) => {
      const isUserStep = step.assignedTo === user.name;
      const isNextStep = isUserStep && index === firstUserStep && previousStepsDone;
      const isBlocked = !step.dependsOn || step.dependsOn.every(id => 
        steps.find(s => s.id === id)?.status === "done"
      );
      
      let statusIcon = "⏳"; // pending
      if (step.status === "done") statusIcon = "✅";
      else if (step.status === "in_progress") statusIcon = "▶️";
      
      let stepClass = "list-group-item";
      if (isUserStep) stepClass += " list-group-item-primary";
      if (step.status === "done") stepClass += " text-success";
      if (step.status === "in_progress") stepClass += " text-primary";
      if (!isBlocked && step.status !== "done") stepClass += " text-muted";
      
      content += `
        <div class="${stepClass}">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              ${statusIcon} ${step.name}
              <small class="text-muted ms-2">(${step.expectedTime} min)</small>
              ${isUserStep ? '<span class="badge bg-primary ms-2">Tu paso</span>' : ''}
            </div>
            <div>
              ${isNextStep ? `
                ${step.isPassive ? 
                  `<button class="btn btn-sm btn-success" onclick="startStep(${flow.id}, ${step.id})">▶️ Iniciar</button>` :
                  `<button class="btn btn-sm btn-success" onclick="startStep(${flow.id}, ${step.id})">▶️ Iniciar</button>`
                }
              ` : ''}
              ${step.status === "in_progress" && isUserStep ? `
                <button class="btn btn-sm btn-success" onclick="completeStep(${flow.id}, ${step.id})">✅ Finalizar</button>
                <button class="btn btn-sm btn-warning" onclick="showProblemForm(${flow.id}, ${step.id})">⚠️ Reportar problema</button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });

    content += `
          </div>
        </div>
      </div>
    `;
  }

  document.getElementById("app").innerHTML = content;
}

function showStartStepView(flow, step) {
  document.getElementById("app").innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Mis Tareas</h2>
      <button class="btn btn-outline-danger" onclick="logout()">Cerrar sesión</button>
    </div>
    <div class="card">
      <div class="card-header bg-primary text-white">${flow.name}</div>
      <div class="card-body">
        <h4>${step.name}</h4>
        <p>Tiempo estimado: ${step.expectedTime} min</p>
        <button class="btn btn-success" onclick="startStep(${flow.id}, ${step.id})">▶️ Iniciar</button>
      </div>
    </div>
  `;
}

function startStep(flowId, stepId) {
  const flow = state.workflows.find(f => f.id === flowId);
  const step = flow.steps.find(s => s.id === stepId);
  
  // Don't start if workflow is disabled or step is already done
  if (!flow.enabled || step.status === "done") {
    state.activeStep = null;
    localStorage.removeItem("activeStep");
    showWorkerDashboard();
    return;
  }
  
  // Check if this is the last step
  const currentStepIndex = flow.steps.findIndex(s => s.id === stepId);
  const isLastStep = currentStepIndex === flow.steps.length - 1;
  const allPreviousDone = flow.steps.slice(0, currentStepIndex).every(s => s.status === "done");
  
  // Only prevent auto-start of last step, not manual start
  if (isLastStep && allPreviousDone && step.isPassive) {
    state.activeStep = null;
    localStorage.removeItem("activeStep");
    showWorkerDashboard();
    return;
  }
  
  step.startedAt = Date.now();
  step.status = "in_progress";
  state.activeStep = { flowId: flow.id, stepId: step.id };
  localStorage.setItem("activeStep", JSON.stringify(state.activeStep));
  saveState();
  
  if (step.isPassive) {
    // Auto-complete after expected time
    setTimeout(() => {
      if (step.status === "in_progress") { // Only complete if still in progress
        completeStep(flowId, stepId, true);
      }
    }, step.expectedTime * 60 * 1000);
  }
  
  showWorkerDashboard();
}

function showActiveStepView(flow, step, resumed = false) {
  const app = document.getElementById("app");

  if (!resumed) {
    step.startedAt = Date.now();
    step.status = "in_progress";
    state.activeStep = { flowId: flow.id, stepId: step.id };
    localStorage.setItem("activeStep", JSON.stringify(state.activeStep));
    saveState();
  }

  const expectedMs = step.expectedTime * 60000;
  const start = step.startedAt;

  app.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Mis Tareas</h2>
      <button class="btn btn-outline-danger" onclick="logout()">Cerrar sesión</button>
    </div>
    <div class="card">
      <div class="card-header bg-primary text-white">${flow.name}</div>
      <div class="card-body">
        <h4>${step.name}</h4>
        <div id="gaugeContainer" class="my-3 text-center"></div>
        <p><strong>Tiempo esperado:</strong> ${step.expectedTime} minutos</p>
        <p><strong>Tiempo actual:</strong> <span id="elapsedTime">00:00</span></p>
        <div id="stepButtons" class="d-flex gap-2 justify-content-center mt-3"></div>
        <hr/>
        <h5>Pasos completados:</h5>
        <ul class="list-group">
          ${flow.steps.filter(s => s.status === "done").map(s =>
            `<li class="list-group-item text-success">✅ ${s.name}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;

  activeTimer = setInterval(() => {
    const now = Date.now();
    const elapsed = now - start;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    const pct = Math.min(150, Math.floor((elapsed / expectedMs) * 100));
    const gaugeColor = pct >= 100 ? "#dc3545" : pct >= 70 ? "#ffc107" : "#198754";

    document.getElementById("elapsedTime").textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    drawGauge(pct, gaugeColor);

    const buttons = [];
    // Only show finish button for non-passive steps
    if (!step.isPassive && pct < 100) {
      buttons.push(`<button class="btn btn-success" onclick="completeStep(${flow.id}, ${step.id})">✅ Finalizar</button>`);
    }
    buttons.push(`<button class="btn btn-warning" onclick="showProblemForm(${flow.id}, ${step.id})">⚠️ Reportar problema</button>`);
    document.getElementById("stepButtons").innerHTML = buttons.join(" ");
  }, 1000);
}

function drawGauge(percent, color) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(percent, 100);
  const dash = (progress / 100) * circumference;

  document.getElementById("gaugeContainer").innerHTML = `
    <svg width="150" height="150" viewBox="0 0 150 150">
      <circle cx="75" cy="75" r="${radius}" stroke="#e9ecef" stroke-width="12" fill="none"/>
      <circle cx="75" cy="75" r="${radius}" stroke="${color}" stroke-width="12"
        fill="none" stroke-dasharray="${dash} ${circumference - dash}" transform="rotate(-90 75 75)" />
      <text x="75" y="85" text-anchor="middle" font-size="20" fill="#212529">${percent}%</text>
    </svg>
  `;
}

function completeStep(flowId, stepId, auto = false) {
  clearInterval(activeTimer);
  const flow = state.workflows.find(f => f.id === flowId);
  const step = flow.steps.find(s => s.id === stepId);
  
  if (!flow || !step) return;
  
  // Record completion time and elapsed time
  step.completedAt = Date.now();
  step.elapsedTime = step.completedAt - step.startedAt;
  step.status = "done";
  
  // Check if all steps are completed
  const allStepsCompleted = flow.steps.every(s => s.status === "done");
  if (allStepsCompleted) {
    // Disable workflow and reset state for next run
    flow.enabled = false;
    flow.steps.forEach(s => {
      s.status = "pending";
      s.startedAt = null;
      s.problem = null;
      s.completedAt = null;
      s.elapsedTime = null;
    });
    saveState();
    state.activeStep = null;
    localStorage.removeItem("activeStep");
    showWorkerDashboard();
    return;
  }
  
  // Find the next step
  const currentStepIndex = flow.steps.findIndex(s => s.id === stepId);
  const nextStepIndex = currentStepIndex + 1;
  
  // Only proceed if there is a next step
  if (nextStepIndex < flow.steps.length) {
    const nextStep = flow.steps[nextStepIndex];
    
    // If next step is assigned to the same user and not passive, start it automatically
    if (nextStep.assignedTo === state.currentUser.name && !nextStep.isPassive) {
      startStep(flow.id, nextStep.id);
      return;
    }
    
    // If this was a passive step, start the next step automatically
    if (step.isPassive) {
      startStep(flow.id, nextStep.id);
      return;
    }
  }
  
  // Clear active step state
  state.activeStep = null;
  localStorage.removeItem("activeStep");
  saveState();
  
  showWorkerDashboard();
}

function showProblemForm(flowId, stepId) {
  clearInterval(activeTimer);
  const flow = state.workflows.find(f => f.id === flowId);
  const step = flow.steps.find(s => s.id === stepId);
  const resource = state.resources.find(r => r.id === step.fromResourceId);
  const options = (resource?.problems || []).map(p => `<option value="${p}">${p}</option>`).join("");

  document.getElementById("app").innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Mis Tareas</h2>
      <button class="btn btn-outline-danger" onclick="logout()">Cerrar sesión</button>
    </div>
    <div class="card">
      <div class="card-header bg-warning text-dark">Reportar Problema</div>
      <div class="card-body">
        <h4>${step.name}</h4>
        <div class="mb-3">
          <label class="form-label">Tipo de problema</label>
          <select id="problemType" class="form-select">${options}</select>
        </div>
        <div class="mb-3">
          <label class="form-label">Comentario (opcional)</label>
          <textarea class="form-control" id="problemNote"></textarea>
        </div>
        <button class="btn btn-danger" onclick="submitProblem(${flowId}, ${stepId})">📤 Enviar</button>
        <button class="btn btn-outline-secondary ms-2" onclick="showWorkerDashboard()">← Cancelar</button>
      </div>
    </div>
  `;
}

function submitProblem(flowId, stepId) {
  const type = document.getElementById("problemType").value;
  const note = document.getElementById("problemNote").value.trim();
  const flow = state.workflows.find(f => f.id === flowId);
  const step = flow.steps.find(s => s.id === stepId);
  step.status = "done";
  step.problem = { type, note };
  state.activeStep = null;
  localStorage.removeItem("activeStep");
  saveState();
//   alert("Problema registrado.");
  showWorkerDashboard();
}

function toggleWorkflowEnabled(id) {
  const flow = state.workflows.find(f => f.id === id);
  if (!flow) return alert("Flujo no encontrado.");
  
  // Si estamos habilitando el flujo, resetear todos los pasos
  if (!flow.enabled) {
    flow.steps.forEach(step => {
      step.status = "pending";
      step.startedAt = null;
      step.problem = null;
      step.completedAt = null;
      step.elapsedTime = null;
    });
  }
  
  flow.enabled = !flow.enabled;
  saveState();
  showWorkflowList();
}
