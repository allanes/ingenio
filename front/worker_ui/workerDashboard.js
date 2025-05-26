let activeTimer = null;

function showWorkerDashboard() {
  const user = state.currentUser;
  if (!user) return;

  // Clear any existing timer when switching views
  if (activeTimer) {
    clearInterval(activeTimer);
    activeTimer = null;
  }

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
        <h2 class="h3 mb-0">Rutinas</h2>
        <button class="btn btn-outline-danger btn-sm" onclick="logout()">Cerrar sesión</button>
      </div>
      <p class="text-muted">No hay flujos disponibles.</p>
    `;
    return;
  }

  // Check for steps that should auto-start
  for (const flow of flows) {
    const steps = flow.steps;
    
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
      // 4. AND it's not the first step for this user
      // 5. AND it's assigned to the current user
      const isFirstStepForUser = !steps.slice(0, i).some(s => s.assignedTo === user.name);
      const isAssignedToCurrentUser = step.assignedTo === user.name;
      
      if ((step.isPassive || (i > 0 && steps[i-1].isPassive) || i > 0) && 
          !isFirstStepForUser && 
          isAssignedToCurrentUser) {
        startStep(flow.id, step.id);
        return;
      }
      
      // If we get here, this is either:
      // - the first step of the workflow
      // - the first step for this user
      // - a step assigned to a different user
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
      <h2 class="h3 mb-0">Rutinas</h2>
      <button class="btn btn-outline-danger btn-sm" onclick="logout()">Cerrar sesión</button>
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
        <div class="card-header bg-primary text-white py-2">${flow.name}</div>
        <div class="card-body p-2">
          <div class="list-group list-group-flush">
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
      
      let stepClass = "list-group-item px-2 py-2";
      if (isUserStep) stepClass += " list-group-item-primary";
      if (step.status === "done") stepClass += " text-success";
      if (step.status === "in_progress") stepClass += " text-primary";
      if (!isBlocked && step.status !== "done") stepClass += " text-muted";
      
      content += `
        <div class="${stepClass}">
          <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
            <div class="d-flex align-items-center flex-wrap gap-1">
              <span class="me-1">${statusIcon}</span>
              <span>${step.name}</span>
              <small class="text-muted">(${step.expectedTime} min)</small>
              ${isUserStep ? '<span class="badge bg-primary ms-1">Tu paso</span>' : ''}
              ${step.status === "done" ? '<span class="badge bg-success ms-1">Realizado</span>' : ''}
            </div>
            <div class="d-flex gap-1 flex-wrap">
              ${isNextStep ? `
                ${step.isPassive ? 
                  `<button class="btn btn-sm btn-success" onclick="startStep(${flow.id}, ${step.id})">▶️ Iniciar</button>` :
                  `<button class="btn btn-sm btn-success" onclick="startStep(${flow.id}, ${step.id})">▶️ Iniciar</button>`
                }
              ` : ''}
              ${step.status === "in_progress" && isUserStep ? `
                <button class="btn btn-sm btn-success" onclick="completeStep(${flow.id}, ${step.id})">✅ Finalizar</button>
                <button class="btn btn-sm btn-warning" onclick="showProblemForm(${flow.id}, ${step.id})">⚠️ Reportar</button>
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
      <h2>Rutinas</h2>
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
  const currentStepIndex = flow.steps.findIndex(s => s.id === step.id) + 1;
  
  // Count only steps assigned to current user
  const userSteps = flow.steps.filter(s => s.assignedTo === state.currentUser.name);
  const userStepIndex = userSteps.findIndex(s => s.id === step.id) + 1;
  const totalUserSteps = userSteps.length;

  // Clear any existing timer before starting a new one
  if (activeTimer) {
    clearInterval(activeTimer);
    activeTimer = null;
  }

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
      <h2 class="h3 mb-0">Rutinas</h2>
      <button class="btn btn-outline-danger btn-sm" onclick="logout()">Cerrar sesión</button>
    </div>
    <div class="card">
      <div class="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
        <span>${flow.name}</span>
        <span class="badge bg-light text-dark">Paso ${userStepIndex} de ${totalUserSteps}</span>
      </div>
      <div class="card-body p-3">
        <h4 class="h5 mb-3">${step.name}</h4>
        <div id="gaugeContainer" class="my-3 text-center" style="max-width: 200px; margin: 0 auto;"></div>
        <div class="row text-center mb-3 g-2">
          <div class="col-6">
            <p class="mb-1"><strong>Tiempo esperado:</strong></p>
            <p class="mb-0">${step.expectedTime} minutos</p>
          </div>
          <div class="col-6">
            <p class="mb-1"><strong>Tiempo actual:</strong></p>
            <p class="mb-0" id="elapsedTime">00:00</p>
          </div>
        </div>
        <div id="stepButtons" class="d-flex gap-2 justify-content-center mt-3 flex-wrap"></div>
        <hr class="my-3"/>
        <h5 class="h6 mb-2">Pasos completados:</h5>
        <ul class="list-group list-group-flush">
          ${userSteps.filter(s => s.status === "done").map(s =>
            `<li class="list-group-item text-success py-2">✅ ${s.name}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;

  // Only start timer if this step is in progress and assigned to current user
  if (step.status === "in_progress" && step.assignedTo === state.currentUser.name) {
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - start;
      const mins = Math.floor(elapsed / 60000);
      const secs = Math.floor((elapsed % 60000) / 1000);
      const pct = Math.min(150, Math.floor((elapsed / expectedMs) * 100));
      const gaugeColor = pct >= 100 ? "#dc3545" : pct >= 70 ? "#ffc107" : "#198754";

      document.getElementById("elapsedTime").textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      drawGauge(pct, gaugeColor, elapsed);

      const buttons = [];
      // Only show finish button for non-passive steps and if user is assigned to this step
      if (!step.isPassive && pct < 100 && step.assignedTo === state.currentUser.name) {
        buttons.push(`<button class="btn btn-success" onclick="completeStep(${flow.id}, ${step.id})">✅ Finalizar</button>`);
      }
      if (step.assignedTo === state.currentUser.name) {
        buttons.push(`<button class="btn btn-warning" onclick="showProblemForm(${flow.id}, ${step.id})">⚠️ Reportar</button>`);
      }
      document.getElementById("stepButtons").innerHTML = buttons.join(" ");
    };

    // Initial update
    updateTimer();
    // Start interval
    activeTimer = setInterval(updateTimer, 1000);
  } else {
    // If step is not assigned to current user or not in progress, show static time
    const elapsed = step.completedAt ? step.completedAt - start : 0;
    const mins = Math.floor(elapsed / 60000);
    const secs = Math.floor((elapsed % 60000) / 1000);
    const pct = Math.min(150, Math.floor((elapsed / expectedMs) * 100));
    const gaugeColor = pct >= 100 ? "#dc3545" : pct >= 70 ? "#ffc107" : "#198754";

    document.getElementById("elapsedTime").textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    drawGauge(pct, gaugeColor, elapsed);
  }
}

function drawGauge(percent, color, elapsedMs) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(percent, 100);
  const dash = (progress / 100) * circumference;

  // Calculate elapsed time in minutes and seconds
  const mins = Math.floor(elapsedMs / 60000);
  const secs = Math.floor((elapsedMs % 60000) / 1000);
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  document.getElementById("gaugeContainer").innerHTML = `
    <svg width="150" height="150" viewBox="0 0 150 150">
      <circle cx="75" cy="75" r="${radius}" stroke="#e9ecef" stroke-width="12" fill="none"/>
      <circle cx="75" cy="75" r="${radius}" stroke="${color}" stroke-width="12"
        fill="none" stroke-dasharray="${dash} ${circumference - dash}" transform="rotate(-90 75 75)" />
      <text x="75" y="85" text-anchor="middle" font-size="20" fill="#212529">${timeStr}</text>
    </svg>
  `;
}

function completeStep(flowId, stepId, auto = false) {
  clearInterval(activeTimer);
  const flow = state.workflows.find(f => f.id === flowId);
  const step = flow.steps.find(s => s.id === stepId);
  
  // Check if user is assigned to this step
  if (!auto && step.assignedTo !== state.currentUser.name) {
    alert("No tienes permiso para completar este paso.");
    return;
  }
  
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
    
    // Only auto-start if the next step is assigned to the same user
    if (nextStep.assignedTo === state.currentUser.name) {
      // If next step is assigned to the same user and not passive, start it automatically
      if (!nextStep.isPassive) {
        startStep(flow.id, nextStep.id);
        return;
      }
      
      // If this was a passive step, start the next step automatically
      if (step.isPassive) {
        startStep(flow.id, nextStep.id);
        return;
      }
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
  
  // Check if user is assigned to this step
  if (step.assignedTo !== state.currentUser.name) {
    alert("No tienes permiso para reportar problemas en este paso.");
    return;
  }
  
  const resource = state.resources.find(r => r.name === step.resourceName);
  const options = (resource?.problems || []).map(p => `<option value="${p}">${p}</option>`).join("");

  document.getElementById("app").innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="h3 mb-0">Rutinas</h2>
      <button class="btn btn-outline-danger btn-sm" onclick="logout()">Cerrar sesión</button>
    </div>
    <div class="card">
      <div class="card-header bg-warning text-dark py-2">Reportar Problema</div>
      <div class="card-body">
        <h4 class="h5 mb-3">${step.name}</h4>
        <div class="mb-3">
          <label class="form-label">Tipo de problema</label>
          <select id="problemType" class="form-select">${options}</select>
        </div>
        <div class="mb-3">
          <label class="form-label">Comentario (opcional)</label>
          <textarea class="form-control" id="problemNote" rows="3"></textarea>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-danger" onclick="submitProblem(${flowId}, ${stepId})">📤 Enviar</button>
          <button class="btn btn-outline-secondary" onclick="showWorkerDashboard()">← Cancelar</button>
        </div>
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

function logout() {
  // Clear any active timer before logging out
  if (activeTimer) {
    clearInterval(activeTimer);
    activeTimer = null;
  }
  localStorage.removeItem("currentUser");
  state.currentUser = null;
  showLogin();
}
