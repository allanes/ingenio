// Extend state with mock users
const users = {
    "operario1": "worker",
    "operario2": "worker",
    "operario3": "worker",
    "ayudante1": "worker",
    "ayudante2": "worker",
    "manager1": "manager"
  };
  
  let currentUser = null;
  let activeTimer = null;
  let timerStart = null;

  function renderHeader(title = "Mis Tareas") {
    return `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="mb-0">${title}</h1>
        <button class="btn btn-outline-secondary btn-sm" onclick="logout()">🔒 Cerrar sesión</button>
      </div>
    `;
  }

  function resetFlow(flowId) {
    const flow = state.flows.find(f => f.id === flowId);
    if (!flow) return;
  
    flow.steps.forEach((step, index) => {
      step.status = index === 0 ? "in_progress" : "locked";
    });
  
    localStorage.setItem("flows", JSON.stringify(state.flows));
    showManagerDashboard();
  }
  
  
  function showLogin() {
    const container = document.getElementById("app");
    container.innerHTML = renderHeader() +
    `
      <div class="card mx-auto" style="max-width: 400px;">
        <div class="card-body">
          <h2 class="card-title mb-4 text-center">Iniciar sesión</h2>
          <form onsubmit="login(event)">
            <div class="mb-3">
              <label for="username" class="form-label">Usuario</label>
              <input type="text" class="form-control" id="username" required>
              <div class="form-text">Ej: operario1, ayudante1, manager1</div>
            </div>
            <button type="submit" class="btn btn-primary w-100">Ingresar</button>
          </form>
        </div>
      </div>
    `;
  }
  
  function login(event) {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const role = users[username];
  
    if (!role) {
      alert("Usuario no encontrado.");
      return;
    }
  
    currentUser = { name: username, role };
    localStorage.setItem("user", JSON.stringify({ name: username, role }));
    if (role === "worker") {
      state.user = username;
      showDashboard();
    } else if (role === "manager") {
      showManagerDashboard();
    }
  }
  
const state = {
    user: "operario1",
    flows: [
      {
        id: 1,
        name: "Limpieza Diaria - Máquina A",
        steps: [
          { id: 101, name: "Verificar estado general", status: "done" },
          { id: 102, name: "Limpiar bandeja", status: "in_progress", instructions: "Usar guantes, retirar residuos, desinfectar superficie." },
          { id: 103, name: "Revisar filtros", status: "locked" }
        ]
      }
    ]
  };

  function startStepTimer(stepId) {
    stopTimer();  // Stop any previous timer
    timerStart = Date.now();
  
    activeTimer = setInterval(() => {
      const elapsedMs = Date.now() - timerStart;
      const mins = Math.floor(elapsedMs / 60000);
      const secs = Math.floor((elapsedMs % 60000) / 1000);
      const pad = n => n.toString().padStart(2, '0');
      const el = document.getElementById(`timer-${stepId}`);
      if (el) el.textContent = `${pad(mins)}:${pad(secs)}`;
    }, 1000);
  }
  
  function stopTimer() {
    clearInterval(activeTimer);
    activeTimer = null;
    timerStart = null;
  }
  
  
  function showDashboard() {
    const activeStep = state.flows
    .flatMap(f => f.steps)
    .find(s => s.status === "in_progress" && s.assignedTo === currentUser.name);

    if (activeStep) {
        startStepTimer(activeStep.id);
    }

    const container = document.getElementById("app");
    container.innerHTML = renderHeader("Mis Tareas") +     
      state.flows.map(flow => `
        <div class="card mb-3">
          <div class="card-header bg-primary text-white">${flow.name}</div>
          <ul class="list-group list-group-flush">
            ${flow.steps
                .filter(step => step.assignedTo === currentUser.name)
                .map(step => {
                    if (step.status === "done") {
                        return `<li class="list-group-item text-success">✅ ${step.name}</li>`;
                    } else if (step.status === "in_progress") {
                        let timerHTML = '';
                        if (step.assignedTo === currentUser.name) {
                            timerHTML = `<div class="text-muted">⏳ Tiempo: <span id="timer-${step.id}">00:00</span></div>`;
                        }

                        return `
                            <li class="list-group-item bg-warning-subtle">
                                <strong>🟡 ${step.name}</strong>
                                <p>${step.instructions}</p>
                                ${timerHTML}
                                <div class="d-flex gap-2 mt-2">
                                <button class="btn btn-success btn-sm" onclick="markDone(${flow.id}, ${step.id})">✅ Hecho</button>
                                <button class="btn btn-danger btn-sm" onclick="markProblem(${flow.id}, ${step.id})">⚠️ Problema</button>
                                <button class="btn btn-outline-secondary btn-sm" onclick="showStepDetail(${flow.id}, ${step.id})">👁️ Detalle</button>
                                </div>
                            </li>`;
                    } else {
                        return `<li class="list-group-item text-muted">🔒 ${step.name}</li>`;
                    }
               }).join("")}
          </ul>
        </div>
      `).join("");
  }
  
  function logout() {
    localStorage.removeItem("user");
    currentUser = null;
    showLogin();
  }
  
  
  function showStepDetail(flowId, stepId) {
    const container = document.getElementById("app");
    
    const flow = state.flows.find(f => f.id === flowId);
    const step = flow.steps.find(s => s.id === stepId);
    
    container.innerHTML = renderHeader(flow.name) +
    `
      <div class="card mb-3">
        <div class="card-body">
          <h5 class="card-title">${step.name}</h5>
          <p class="card-text">${step.instructions}</p>
          <div class="mb-3">
            <textarea class="form-control" placeholder="Notas o comentarios..."></textarea>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-success" onclick="markDone(${flowId}, ${stepId})">✅ Marcar como hecho</button>
            <button class="btn btn-danger" onclick="markProblem(${flowId}, ${stepId})">⚠️ Reportar problema</button>
            <button class="btn btn-outline-secondary" onclick="showDashboard()">🔙 Volver</button>
          </div>
        </div>
      </div>
    `;
  }
  
  function markDone(flowId, stepId) {
    stopTimer();  // Stop timer when done
  
    const flow = state.flows.find(f => f.id === flowId);
    const step = flow.steps.find(s => s.id === stepId);
    step.status = "done";
  
    const next = flow.steps.find(s => s.status === "locked");
    if (next) next.status = "in_progress";
  
    showDashboard();
  }
  
  function markProblem(flowId, stepId) {
    stopTimer();  // Stop timer when problem is reported
  
    const flow = state.flows.find(f => f.id === flowId);
    const step = flow.steps.find(s => s.id === stepId);
    step.status = "problem";
  
    alert("Problema registrado para: " + step.name);
    showDashboard();
  }
  
  
  
  function showManagerDashboard() {
    const container = document.getElementById("app");
    container.innerHTML = renderHeader("Panel de Administración") + 
    `
      <p>Bienvenido, ${currentUser.name}</p>
  
      <div class="mb-3 text-end">
        <button class="btn btn-success btn-sm" onclick="showFlowEditor()">➕ Crear nuevo flujo</button>
        <button class="btn btn-outline-secondary btn-sm ms-2" onclick="logout()">🔒 Cerrar sesión</button>
      </div>
  
      <table class="table table-bordered table-striped bg-white">
        <thead class="table-primary">
          <tr>
            <th>Nombre del Flujo</th>
            <th>Pasos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${state.flows.map(flow => `
            <tr>
              <td>${flow.name}</td>
              <td>${flow.steps.length}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary" onclick="showFlowEditor(${flow.id})">✏️ Editar</button>
                <button class="btn btn-sm btn-outline-secondary" onclick="showDashboard()">👁️ Vista previa</button>
                <button class="btn btn-sm btn-outline-warning" onclick="resetFlow(${flow.id})">↻ Reiniciar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
  
  window.addEventListener("DOMContentLoaded", () => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser && users[savedUser.name]) {
      currentUser = savedUser;
      if (savedUser.role === "worker") {
        state.user = savedUser.name;
        showDashboard();
      } else {
        showManagerDashboard();
      }
    } else {
      showLogin();
    }
  });