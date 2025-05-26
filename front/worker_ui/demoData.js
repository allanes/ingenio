// Parse CSV data and create initial state
function initializeDemoData() {
    // Check if data is already initialized
    if (localStorage.getItem("sectors")) {
        return;
    }

    // Create sectors
    const sectors = [
        { id: 1, name: "Recepción" }
    ];
    localStorage.setItem("sectors", JSON.stringify(sectors));

    // Create resources with their subworkflows
    const resources = [
        {
            id: 1,
            name: "PLA-01 y PLA-02",
            sectorId: 1,
            problems: ["No hay acceso", "Plataforma dañada"],
            subworkflow: [
                {
                    id: 1,
                    name: "Subir Plataformas PLA-01 y pla-02",
                    expectedTime: 1,
                    isPassive: false,
                    dependsOn: []
                },
                {
                    id: 2,
                    name: "Colocar pie de Seguridad",
                    expectedTime: 5,
                    isPassive: false,
                    dependsOn: [1]
                },
                {
                    id: 3,
                    name: "Mover basura hacia el medio PLA-01 y PLA-02",
                    expectedTime: 20,
                    isPassive: false,
                    dependsOn: [2]
                },
                {
                    id: 4,
                    name: "Sacar PSE-01/02",
                    expectedTime: 5,
                    isPassive: false,
                    dependsOn: [3]
                },
                {
                    id: 5,
                    name: "Bajar PLA-01 Y PLA-02",
                    expectedTime: 2,
                    isPassive: false,
                    dependsOn: [4]
                }
            ]
        },
        {
            id: 2,
            name: "Tolvas TOL-01 y TOL-02",
            sectorId: 1,
            problems: ["Tolva bloqueada", "Falta de agua"],
            subworkflow: [
                {
                    id: 6,
                    name: "Barrido hacia Tolvas",
                    expectedTime: 5,
                    isPassive: false,
                    dependsOn: []
                },
                {
                    id: 7,
                    name: "Apertura de Tolvas TOL-01 y TOL-02",
                    expectedTime: 1,
                    isPassive: false,
                    dependsOn: [6]
                },
                {
                    id: 8,
                    name: "Limpieza CIN-01",
                    expectedTime: 7,
                    isPassive: false,
                    dependsOn: [7]
                },
                {
                    id: 9,
                    name: "Limpieza de Rejilla REJ-01",
                    expectedTime: 8,
                    isPassive: false,
                    dependsOn: [8]
                },
                {
                    id: 10,
                    name: "Barrido de Tolva-01",
                    expectedTime: 2,
                    isPassive: false,
                    dependsOn: [9]
                },
                {
                    id: 11,
                    name: "Limpieza de Elevador ELE-01",
                    expectedTime: 6,
                    isPassive: false,
                    dependsOn: [10]
                },
                {
                    id: 12,
                    name: "Barrido de Tolva-02 a Rejilla",
                    expectedTime: 2,
                    isPassive: false,
                    dependsOn: [11]
                },
                {
                    id: 13,
                    name: "Bajar puente de TOL-02",
                    expectedTime: 1,
                    isPassive: false,
                    dependsOn: [12]
                }
            ]
        }
    ];
    localStorage.setItem("resources", JSON.stringify(resources));

    // Create the main workflow
    const workflows = [
        {
            id: 1,
            name: "Limpieza Recepción",
            sectorId: 1,
            enabled: false,
            steps: [
                {
                    id: 1,
                    name: "Subir Plataformas PLA-01 y pla-02",
                    resourceId: 1,
                    resourceName: "PLA-01 y PLA-02",
                    assignedTo: "operario1",
                    expectedTime: 1
                },
                {
                    id: 2,
                    name: "Colocar pie de Seguridad",
                    resourceId: 1,
                    resourceName: "PLA-01 y PLA-02",
                    assignedTo: "operario1",
                    expectedTime: 5
                },
                {
                    id: 3,
                    name: "Mover basura hacia el medio PLA-01 y PLA-02",
                    resourceId: 1,
                    resourceName: "PLA-01 y PLA-02",
                    assignedTo: "operario1",
                    expectedTime: 20
                },
                {
                    id: 4,
                    name: "Sacar PSE-01/02",
                    resourceId: 1,
                    resourceName: "PLA-01 y PLA-02",
                    assignedTo: "operario1",
                    expectedTime: 5
                },
                {
                    id: 5,
                    name: "Bajar PLA-01 Y PLA-02",
                    resourceId: 1,
                    resourceName: "PLA-01 y PLA-02",
                    assignedTo: "operario1",
                    expectedTime: 2
                },
                {
                    id: 6,
                    name: "Barrido hacia Tolvas",
                    resourceId: 2,
                    resourceName: "Tolvas TOL-01 y TOL-02",
                    assignedTo: "operario2",
                    expectedTime: 5
                },
                {
                    id: 7,
                    name: "Apertura de Tolvas TOL-01 y TOL-02",
                    resourceId: 2,
                    resourceName: "Tolvas TOL-01 y TOL-02",
                    assignedTo: "operario2",
                    expectedTime: 1
                },
                {
                    id: 8,
                    name: "Limpieza CIN-01",
                    resourceId: 2,
                    resourceName: "Tolvas TOL-01 y TOL-02",
                    assignedTo: "operario2",
                    expectedTime: 7
                },
                {
                    id: 9,
                    name: "Limpieza de Rejilla REJ-01",
                    resourceId: 2,
                    resourceName: "Tolvas TOL-01 y TOL-02",
                    assignedTo: "operario2",
                    expectedTime: 8
                },
                {
                    id: 10,
                    name: "Barrido de Tolva-01",
                    resourceId: 2,
                    resourceName: "Tolvas TOL-01 y TOL-02",
                    assignedTo: "operario2",
                    expectedTime: 2
                },
                {
                    id: 11,
                    name: "Limpieza de Elevador ELE-01",
                    resourceId: 2,
                    resourceName: "Tolvas TOL-01 y TOL-02",
                    assignedTo: "operario2",
                    expectedTime: 6
                },
                {
                    id: 12,
                    name: "Barrido de Tolva-02 a Rejilla",
                    resourceId: 2,
                    resourceName: "Tolvas TOL-01 y TOL-02",
                    assignedTo: "operario2",
                    expectedTime: 2
                },
                {
                    id: 13,
                    name: "Bajar puente de TOL-02",
                    resourceId: 2,
                    resourceName: "Tolvas TOL-01 y TOL-02",
                    assignedTo: "operario2",
                    expectedTime: 1
                }
            ]
        }
    ];
    localStorage.setItem("workflows", JSON.stringify(workflows));
} 