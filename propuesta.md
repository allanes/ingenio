# Sistema de Gestión de Rutinas para Planta Industrial

**Autor:** \[Tu Nombre]
**Fecha:** \[Insertar Fecha]
**Estado:** Propuesta preliminar – Sujeta a evaluación

---

## 1. Resumen

### 1.1 Introducción

Esta propuesta plantea el desarrollo de un sistema para organizar y supervisar las tareas de mantenimiento preventivo en planta. El objetivo principal es modernizar y sistematizar las rutinas actuales —como limpieza de sectores y equipos— sin depender de formularios impresos, hojas de cálculo o comunicaciones informales.

### 1.2 Objetivo General

Desarrollar un sistema que permita a los responsables de cada sector planificar, asignar y controlar tareas de mantenimiento de forma digital, mientras los operarios y asistentes registran avance en sus dispositivos de seguimiento.

### 1.3 Motivación

Actualmente, las tareas de mantenimiento dependen de rutinas poco estructuradas o de seguimientos manuales. Esto genera:

* Inconsistencias entre sectores
* Dificultades para verificar cumplimiento
* Pérdida de trazabilidad en reportes de problemas

La solución permitirá digitalizar, agilizar, y medir estos flujos, brindando herramientas para una mejora continua.

---

## 2. Situación Actual y Objetivos

### 2.1 Situación Actual

Las rutinas de mantenimiento son llevadas a cabo por operarios y asistentes, bajo la coordinación de un responsable de planta. Sin embargo, no existe un sistema que permita documentar de forma sistemática el cumplimiento de cada paso o recibir alertas ante problemas operativos.

### 2.2 Objetivos Específicos

1. Facilitar la planificación digital de rutinas por sector.
2. Permitir pre-asignar tareas a diferentes usuarios.
3. Brindar a los trabajadores un sistema de seguimiento, para confirmar pasos realizados y reportar problemas.
4. Generar trazabilidad y reportes automáticos para los responsables.

---

## 3. Camino Propuesto

### 3.1 Arquitectura General y Componentes del Sistema

El sistema estará compuesto por:

* **Panel web de planificación:** Utilizado por los responsables de cada sector para definir rutinas, asignar tareas y visualizar el estado general de cumplimiento. Los flujos deberán ser importados desde Microsoft Project.
* **Aplicación accesible desde navegador en celulares Android:** Los operarios y asistentes utilizarán celulares como dispositivos de seguimiento, registrando tareas completadas y reportes de problemas. 
* **Servidor Central:** PC dedicada a centralizar toda la información del sistema, desde las rutinas planificadas hasta los reportes de ejecución e incidencias.

---

### 3.2 Fases de Desarrollo

| Fase | Título                       | Objetivo principal                                                                   | Duración estimada    |   |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------ | -------------------- | - |
| 1    | Análisis y diseño funcional  | Definir estructura general, flujos de uso y validación del esquema de rutinas        | 2 semanas            |   |
| 2    | Desarrollo del backend       | Implementar la base de datos, API de tareas, usuarios y rutinas                      | 3 semanas            |   |
| 3    | Desarrollo de la vista móvil | Crear la interfaz adaptada para celulares donde los operarios registran actividades  | 4 semanas            |   |
| 4    | Desarrollo del panel web     | Construir la interfaz de planificación y seguimiento para supervisores               | 3 semanas            |   |
| 5    | Integración y validaciones   | Unir componentes, validar flujos de punta a punta y revisar importador de rutinas    | 2 semanas            |   |
| 6    | Despliegue piloto            | Instalación en planta de prueba, recolección de feedback y ajustes finales iniciales | 2 semanas            |   |
| 7    | Ajustes post-piloto          | Correcciones finales y preparación para expansión progresiva                         | 2 semanas            |   |
|      | **Total estimado**           |                                                                                      | **4.5 meses aprox.** |   |

---

## 4. Impacto de la Propuesta

### 4.1 Cambios Operativos

* Se reemplaza el control informal por una plataforma digital.
* Cada paso de mantenimiento queda registrado.
* Los operarios interactúan directamente desde su teléfono.

### 4.2 Beneficios Esperados

1. Mayor trazabilidad en tareas de limpieza y mantenimiento.
2. Detección temprana de problemas en máquinas o sectores.
3. Mejora en la supervisión y auditoría de los procesos.
4. Posibilidad de implementar estándares de calidad o certificación.
5. Ahorro de tiempo administrativo y reducción de errores.

---

## 5. Consideraciones Técnicas y Alcances

### 5.1 Requisitos de Infraestructura

* Se requiere un **servidor dedicado** (puede ser físico o contratado en la nube) para alojar el backend y la base de datos.
* Los responsables de planificación deben contar con acceso a una PC para operar el panel web.
* Cada sector donde se utilicen celulares deberá contar con equipamiento WiFi que brinde **acceso a la red local**.

### 5.2 Cuestiones Fuera de Alcance (Exclusiones)

Para esta primera etapa del proyecto **no se considera**:

* Una aplicación instalable (se usará como una página web en vez de ser instalada).
* Sincronización en ausencia de red (no está previso el uso de Internet).
* Soporte para dispositivos alternativos como relojes o pulseras.

Estos aspectos podrán contemplarse en futuras fases del proyecto si se considera necesario.

### 5.3 Aspectos a Definir y Previsiones

* Se deberá consensuar si el **reporte de problemas** estará incluido en esta primera etapa. En caso afirmativo, se definirá el formato del mismo: texto, mensaje de voz o imagen.
* Se deja abierta la posibilidad de incorporar:

  * Notificaciones visuales o sonoras desde el celular (por ejemplo, vibración o sonidos estándar).
  * Uso de funcionalidades del hardware del teléfono como micrófono para registrar voz.
  * Cámara para fotos en reportes (no prioritaria en esta etapa).

### 5.4 Tecnologías Propuestas

* **Backend:** Python (FastAPI)
* **Base de datos:** PostgreSQL
* **Frontend:** React
* **Infraestructura:** Servidor dedicado y Access Points WiFi

---

## 6. Estimación de Costos

| Elemento                                   | Costo estimado unitario  | Observaciones                          |
| ------------------------------------------ | ------------------------ | -------------------------------------- |
| Servidor                                   | USD 600                  | PC exclusiva para el sistema           |
| Desarrollo                                 | USD 8000                 | 4–6 meses                              |
| Networking                                 | USD 300 por sector       | Cada sector debe tener acceso a red    |
| **Total (aprox)**                          | **USD 10.000**           |                                        |

---

## 7. Conclusión y Próximos Pasos

Se plantea un enfoque modular y escalable, adaptable al presupuesto disponible y al entorno de trabajo real.

Se propone:

1. Realizar una prueba de concepto en un sector limitado.
2. Ajustar el diseño en base al feedback recibido.
3. Avanzar progresivamente hacia una solución integral.

**Contacto:** \[Tu nombre] – \[Tu correo / teléfono]
