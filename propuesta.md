# 🏭 Propuesta de Sistema de Gestión de Mantenimiento para Planta Industrial

**Autor:** [Tu Nombre]  
**Fecha:** [Insertar Fecha]  
**Estado:** Propuesta preliminar – Sujeta a evaluación

---

## 1. Resumen

### 1.1 Introducción
Esta propuesta plantea el desarrollo de un sistema para organizar y supervisar las tareas de mantenimiento preventivo en planta. El objetivo principal es modernizar y sistematizar las rutinas actuales —como limpieza de sectores y equipos— sin depender de formularios impresos, hojas de cálculo o comunicaciones informales.

### 1.2 Objetivo General
Desarrollar un sistema que permita a los responsables de cada sector planificar, asignar y controlar tareas de mantenimiento de forma digital, mientras los operarios y asistentes registran avance en sus dispositivos de seguimiento.

### 1.3 Motivación
Actualmente, las tareas de mantenimiento dependen de rutinas poco estructuradas o de seguimientos manuales. Esto genera:
- Inconsistencias entre sectores
- Dificultades para verificar cumplimiento
- Pérdida de trazabilidad en reportes de problemas

La solución permitirá digitalizar, agilizar, y medir estos flujos, brindando herramientas para una mejora continua.

---

## 2. Situación Actual y Objetivos

### 2.1 Situación Actual
Las rutinas de mantenimiento son llevadas a cabo por operarios y asistentes, bajo la coordinación de un responsable de planta. Sin embargo, no existe un sistema que permita documentar de forma sistemática el cumplimiento de cada paso o recibir alertas ante problemas operativos.

### 2.2 Objetivos Específicos
1. Facilitar la planificación digital de rutinas por sector.
2. Permitir pre-asignar tareas a diferentes usuarios.
3. Brindar a los trabajadores un dispositivo de seguimiento, para confirmar pasos realizados y reportar problemas.
4. Generar trazabilidad y reportes automáticos para los responsables.

---

## 3. Camino Propuesto

### 3.1 Arquitectura General y Componentes del Sistema
El sistema estará compuesto por:

- **Panel web de planificación:** Utilizado por los responsables de cada sector para definir rutinas, asignar tareas y visualizar el estado general de cumplimiento.
- **Dispositivos de seguimiento:** Utilizados por operarios y asistentes para registrar los pasos de las tareas asignadas y reportar incidencias. Estos dispositivos pueden adoptar distintas formas, según se detalla en la tabla de abajo.
- **Nodos sectoriales (gateways):** Dispositivos fijos ubicados en cada sector. Reciben mensajes desde los dispositivos móviles mediante y los reenvían al servidor central.
- **Servidor Central:** PC dedicada a centralizar toda la información del sistema, desde las rutinas planificadas hasta los reportes de ejecución e incidencias.

| Opción                        | Descripción                             | Pantalla          | Controles           | Costo estimado (USD) |
|------------------------------|-----------------------------------------|-------------------|---------------------|-----------------------|
| Dispositivo personalizado    | Dispositivo tipo pulsera                | 2'' - 3''         | Botones físicos     | 100-120               |
| Smartwatch Android           | Reloj comercial con Wear OS             | 1'' - 2''         | Pantalla táctil     | 80–200               |
| Celular Android              | Teléfono inteligente con Android        | 4'' - 6''         | Pantalla táctil     | 300-500              |

La opción preferida es la primera, por su bajo costo, facilidad de personalización y robustez.

---

### 3.2 Fases de Desarrollo

| Fase | Título                                 | Contenido principal                                     | Duración estimada |
|------|----------------------------------------|---------------------------------------------------------|-------------------|
| 1    | Prototipado del dispositivo           | Diseño del dispositivo, validación de conectividad      | 1 mes             |
| 2    | Desarrollo de software                | Desarrollo del backend, dashboard y firmware            | 2 meses           |
| 3    | Prueba piloto por sector              | Implementación en 1–2 sectores, ajustes según feedback  | 1 mes             |
| 4    | Expansión y mejoras                   | Escalado, reportes, importación de rutinas complejas    | 1 mes             |
|      | **Total**                             |                                                         | **5 meses**       |

---

## 4. Impacto de la Propuesta

### 4.1 Cambios Operativos
- Se reemplaza el control informal por una plataforma digital.
- Cada paso de mantenimiento queda registrado.
- Los operarios interactúan directamente desde su dispositivo.

### 4.2 Beneficios Esperados
1. Mayor trazabilidad en tareas de limpieza y mantenimiento.
2. Detección temprana de problemas en máquinas o sectores.
3. Mejora en la supervisión y auditoría de los procesos.
4. Posibilidad de implementar estándares de calidad o certificación.
5. Ahorro de tiempo administrativo y reducción de errores.

---

## 5. Consideraciones Técnicas y Alcances

### 5.1 Requisitos de Infraestructura
- Se requiere un **servidor dedicado** (puede ser físico o contratado en la nube) para alojar el backend y la base de datos. 
- Para interactuar con la aplicación, el encargados debe disponer de una PC.
- Cada sector donde se utilicen dispositivos deberá contar con **acceso a red local**, idealmente con conectividad a Internet.
- La red podrá ser cableada o inalámbrica, pero debe permitir que los nodos sectoriales accedan al servidor dentro de la misma LAN o VPN.

### 5.2 Cuestiones Fuera de Alcance (Exclusiones)
Para esta primera etapa del proyecto **no se considera**:
- Una versión funcional para teléfonos. Sólo se considera su uso en PC.

Estos aspectos podrán contemplarse en futuras fases del proyecto si se considera necesario.

### 5.3 Aspectos a Definir y Previsiones
- Se deberá consensuar si el **reporte de problemas** estará incluido en esta primera etapa. En caso afirmativo, se definirá el formato del mismo: texto, mensaje de voz o imagen.
- Se prevé que el dispositivo de seguimiento pueda incluir:
  - Un **buzzer o zumbador piezoeléctrico** para emitir alertas simples (por ejemplo, tareas vencidas o confirmaciones).
  - Un **micrófono** básico para permitir el registro de mensajes de voz (opcional según alcance).
  - **Cámara**: no ha sido considerada inicialmente, pero puede explorarse si hay interés en reportes visuales.

### 5.3 Tecnologías Propuestas
- **Backend:** Python (FastAPI)
- **Base de datos:** PostgreSQL
- **Frontend:** React para la interfaz web
- **Firmware:** ESP32 con PlatformIO o Arduino SDK
- **Comunicación:** ESP-NOW para dispositivos móviles; Wi-Fi/MQTT para nodos fijos

---

## 6. Estimación de Costos

| Categoría          | Elemento                         | Costo estimado unitario | Observaciones                       |
|--------------------|----------------------------------|--------------------------|-------------------------------------|
| **Costos Únicos**  | Servidor                         | 500 USD                  | PC exclusiva para el sistema        |
|                    | Desarrollo                       | A definir                | 4–6 meses                           |
|                    | Networking                       | A definir según el sitio | Cada sector debe tener acceso a internet |
|                    | **Sub-Total**                    | **500USD - XXXXUSD**     |                                     |
| **Costos por Sector** | Dispositivos de seguimiento   | 100-120 USD              | Uno para cada trabajador del sector |
|                    | Gateways sectoriales             | 80–120 USD               | Uno o dos nodos por sector          |
|                    | **Sub-Total**                    | **180USD - 250USD**      | Considerando 1 trabajador por sector |

---

## 7. Conclusión y Próximos Pasos
Se plantea un enfoque modular y escalable, adaptable al presupuesto disponible y al entorno de trabajo real.

Se propone:
1. Realizar una prueba de concepto en un sector limitado.
2. Ajustar el diseño en base al feedback recibido.
3. Avanzar progresivamente hacia una solución integral.

**Contacto:** [Tu nombre] – [Tu correo / teléfono]

