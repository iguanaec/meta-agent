# Plan de Producto: Agente de Trafficker Digital para Meta Ads

> Documento de planeación. No contiene código. Objetivo: dejar clara la visión, el alcance, la arquitectura y el orden de construcción antes de escribir la primera línea del agente.

---

## 1. Resumen del producto

Un agente de IA que actúa como **asistente de trafficker digital** para cuentas de Facebook e Instagram Ads. Se conecta a Meta (vía MCP oficial o Marketing API), lee el desempeño de campañas, conjuntos de anuncios y anuncios, detecta problemas y oportunidades, explica sus hallazgos en lenguaje simple, y propone (y eventualmente ejecuta, con límites y aprobación humana) cambios de presupuesto y pausas.

El diferenciador central no es "leer datos de Meta" — eso ya lo hacen decenas de dashboards. El diferenciador es que **el agente nunca confunde una métrica de plataforma con un resultado real de negocio**, y que **cada decisión de dinero pasa por un proceso de seguridad explícito** (límites, aprobación, registro, reversa).

**Analogía simple:** es como contratar a un trafficker junior muy disciplinado, que revisa las cuentas todos los días, te avisa cuando algo va mal, te explica por qué, te propone qué hacer — pero que solo puede mover dinero por su cuenta dentro de reglas muy estrechas, y que apunta en una bitácora cada cosa que hace o sugiere.

---

## 2. Qué hará y qué no hará

### Sí hará
- Leer campañas, conjuntos de anuncios y anuncios (estructura + métricas).
- Calcular y monitorear CPA, CPL, CTR, CPM, frecuencia, conversiones, ROAS reportado por Meta.
- Detectar anomalías y bajo rendimiento (comparando contra el histórico de la propia cuenta, no contra benchmarks genéricos de internet).
- Explicar cada hallazgo en lenguaje llano, con el "por qué" y no solo el "qué".
- Generar reportes periódicos y alertas en tiempo real ante eventos importantes.
- Proponer cambios de presupuesto, pausas y reasignaciones, con una ficha completa de justificación.
- Ejecutar **solo** un conjunto pequeño y predefinido de acciones de bajo riesgo, dentro de límites configurados, y solo tras aprobación humana (o de forma automática en Nivel 3, dentro de reglas muy estrechas).
- Registrar todo: qué vio, qué recomendó, quién aprobó, qué hizo, qué resultado tuvo.
- Medir si sus propias decisiones mejoraron o empeoraron el resultado, y aprender de eso con el tiempo (de forma supervisada, no autónoma).

### No hará (al menos no en las primeras versiones)
- No creará campañas nuevas de forma autónoma.
- No cambiará objetivos de campaña, estrategias de puja, audiencias ni creatividades sin aprobación explícita.
- No tratará ninguna conversión de Meta como "venta confirmada" — siempre la marcará como *reportada por la plataforma* hasta que se cruce con una fuente de verdad del negocio.
- No tomará decisiones grandes de presupuesto (encima de un umbral) sin humano.
- No operará campañas de categorías sensibles (salud, temas financieros regulados, política, etc.) en modo automático.
- No sustituye a un trafficker humano: es un copiloto, no un reemplazo. La estrategia de cuenta la sigue definiendo una persona.

---

## 3. MVP recomendado

El error más común en este tipo de proyecto es querer construir "el sistema completo" desde el día uno. El MVP debe responder una sola pregunta de negocio de forma confiable: **"¿qué está pasando en mis campañas y qué debería revisar hoy?"**

**MVP = Nivel 1 (solo lectura) + reportes + alertas + primeras recomendaciones en texto, sin ejecución de ninguna acción.**

Incluye:
1. Conexión de solo lectura a una cuenta publicitaria de Meta.
2. Ingesta diaria de campañas / conjuntos / anuncios + métricas básicas.
3. Un reporte diario o semanal en lenguaje simple (qué subió, qué bajó, qué destaca).
4. Un motor de reglas simple para detectar 4-6 problemas típicos (gasto sin resultados, CPA disparado, frecuencia alta, anuncio fatigado, presupuesto no gastado, etc.).
5. Recomendaciones en texto (Nivel 2) que el humano lee y aplica manualmente en Meta Ads Manager — el agente **todavía no toca nada**.
6. Registro simple de cada recomendación generada (para poder medir después cuántas se hicieron caso).

**Explícitamente fuera del MVP:** ejecución automática de cambios, integración con CRM, atribución multi-fuente sofisticada, modelos predictivos de ROAS, multi-cuenta, multi-usuario con roles, o cualquier acción sobre creatividades/audiencias.

El MVP se considera exitoso si, durante 2-4 semanas, un trafficker humano dice que el reporte y las recomendaciones son útiles y confiables — no si el sistema es técnicamente sofisticado.

---

## 4. Arquitectura simple

Piensa en el sistema como 8 piezas que se pasan la posta unas a otras. Ninguna es "el agente" completo por sí sola.

| Pieza | Qué hace | Analogía |
|---|---|---|
| **Interfaz para el usuario** | Donde el trafficker/dueño ve reportes, recibe alertas y aprueba o rechaza recomendaciones (puede ser un chat, un dashboard web, o incluso Slack/WhatsApp al inicio). | La pantalla de mando |
| **Agente de IA** | El "cerebro": interpreta los datos, redacta explicaciones, genera recomendaciones, decide si algo entra en Nivel 3 (auto-ejecutable) o debe escalar. | El analista |
| **MCP / Marketing API de Meta** | El conector que trae datos de Meta y, más adelante, envía instrucciones (pausar, cambiar presupuesto). | El teléfono directo con Meta |
| **Base de datos propia** | Guarda el histórico de métricas, recomendaciones, aprobaciones y acciones — **no depende de que Meta guarde el historial**, porque Meta solo te da bien los últimos ~37 meses y con particularidades de atribución que cambian con el tiempo. | El archivo/bitácora |
| **Sistema de métricas** | Calcula CPA, CPL, CTR, ROAS, tendencias, comparaciones período contra período, a partir de los datos crudos guardados. | La calculadora |
| **Sistema de aprobaciones** | Gestiona el flujo: agente propone → humano aprueba/rechaza/edita → queda registrado quién y cuándo. | El buzón de firmas |
| **Sistema de alertas** | Vigila condiciones (gasto disparado, cuenta pausada por Meta, CPA fuera de rango) y notifica proactivamente, sin esperar el reporte periódico. | La alarma |
| **Registro de acciones (audit log)** | Historial inmutable de todo: qué se vio, qué se propuso, qué se aprobó, qué se ejecutó, qué resultado tuvo, y cómo revertirlo. | La caja negra |
| **Conexión con CRM / fuente de verdad de negocio** *(fase posterior)* | Trae datos de ventas reales, leads calificados, margen — para que el agente no se guíe solo por lo que Meta reporta. | El contador de la empresa |

**Flujo típico:**
1. El sistema de métricas jala datos de Meta (vía MCP/API) todos los días y los guarda en la base de datos.
2. El agente de IA analiza esos datos, cruza con reglas y (cuando exista) con datos reales de negocio.
3. Genera insights → si hay algo urgente, dispara una alerta; si hay algo optimizable, genera una recomendación.
4. La recomendación pasa por el sistema de aprobaciones y se muestra en la interfaz.
5. Si el humano aprueba (o si es una acción Nivel 3 dentro de límites), el agente ejecuta vía API/MCP.
6. Todo queda en el registro de acciones, y el sistema de métricas vuelve a medir el resultado unos días después para cerrar el ciclo (¿mejoró o no?).

---

## 5. Fases de construcción

Cada fase tiene un objetivo cerrado y una forma clara de saber si terminó. No se avanza a la siguiente fase sin cerrar la anterior.

### Fase 1 — Definición del producto
- **Objetivo:** dejar por escrito qué cuentas se van a gestionar, qué métricas de negocio existen realmente disponibles, quién aprueba cambios, y qué nivel de autonomía se autoriza desde el día uno.
- **Funciones necesarias:** ninguna técnica todavía; es documento y acuerdo.
- **Qué debe construirse:** este mismo tipo de documento (alcance, límites, roles).
- **Qué datos se necesitan:** acceso a al menos una cuenta de prueba de Meta Ads, y claridad sobre qué fuente de negocio existe (CRM, hoja de cálculo, ninguna todavía).
- **Riesgos:** arrancar sin definir quién aprueba qué genera fricción y desconfianza después.
- **Criterio de "terminado":** hay un documento aprobado por el dueño del negocio con alcance, niveles de autonomía iniciales y límites de gasto.

### Fase 2 — Conexión con Meta Ads
- **Objetivo:** poder leer datos reales de una cuenta, de forma segura y estable.
- **Funciones necesarias:** autenticación (token de acceso, permisos correctos), manejo de errores de API, respeto a límites de tasa (rate limits).
- **Qué debe construirse:** un módulo de conexión (vía MCP oficial de Meta Ads o la Marketing API directa) que pueda listar cuentas, campañas, conjuntos y anuncios.
- **Qué datos se necesitan:** Business Manager, cuenta publicitaria de prueba, permisos de solo lectura primero.
- **Riesgos:** usar credenciales con permisos de escritura antes de tiempo; tokens que expiran sin aviso.
- **Criterio de "terminado":** se puede listar la estructura completa de una cuenta real sin errores, de forma repetible.

### Fase 3 — Lectura y almacenamiento de datos
- **Objetivo:** guardar el historial de métricas propio, para no depender de la ventana de tiempo que ofrece Meta ni de que Meta reescriba datos de atribución retroactivamente.
- **Funciones necesarias:** ingesta programada (diaria), normalización de métricas, detección de cambios en la estructura (anuncio nuevo, pausado, etc.).
- **Qué debe construirse:** un proceso que corre todos los días, trae gasto/resultados/CPA/CPM/CTR/conversiones por campaña-conjunto-anuncio, y los guarda con fecha.
- **Qué datos se necesitan:** los mismos de Fase 2, ahora de forma recurrente.
- **Riesgos:** duplicar datos, no manejar bien las actualizaciones retroactivas de Meta (Meta puede "corregir" conversiones de días pasados).
- **Criterio de "terminado":** hay al menos 2-3 semanas de historial propio guardado y verificable, y una segunda ejecución del mismo día no duplica ni corrompe datos.

### Fase 4 — Generación de reportes
- **Objetivo:** convertir datos crudos en algo que un humano entienda en menos de 2 minutos.
- **Funciones necesarias:** resumen ejecutivo, comparación período contra período, resaltado de lo más relevante (no todo, solo lo importante).
- **Qué debe construirse:** un reporte diario/semanal en lenguaje simple, entregado por el canal que se decida (chat, email, dashboard).
- **Qué datos se necesitan:** el histórico de Fase 3.
- **Riesgos:** reportes con demasiado ruido (todo parece "importante") que el humano deja de leer.
- **Criterio de "terminado":** el trafficker/dueño confirma que el reporte le ahorra tiempo y que confía en los números.

### Fase 5 — Motor de insights
- **Objetivo:** que el sistema detecte solo, sin que nadie tenga que preguntarle, qué merece atención.
- **Funciones necesarias:** reglas de detección (umbrales, tendencias, comparaciones), priorización de hallazgos por impacto.
- **Qué debe construirse:** un conjunto de reglas claras (ej. "CPA subió más de 40% en 3 días con gasto estable", "frecuencia > 4 con CTR cayendo", "presupuesto sin gastar completo 3 días seguidos").
- **Qué datos se necesitan:** histórico suficiente para calcular tendencias (mínimo 1-2 semanas por campaña).
- **Riesgos:** falsos positivos (alertar por ruido estadístico normal, sobre todo con poco volumen de datos).
- **Criterio de "terminado":** los insights generados coinciden, en la mayoría de los casos, con lo que un trafficker humano habría notado por su cuenta.

### Fase 6 — Recomendaciones de presupuesto
- **Objetivo:** pasar de "esto está mal" a "esto sugiero hacer, y por qué".
- **Funciones necesarias:** lógica de recomendación (subir, bajar, pausar, redistribuir), redacción de la ficha completa de justificación (ver Sección 6).
- **Qué debe construirse:** el generador de recomendaciones estructuradas, siempre en Nivel 2 (propone, no ejecuta) en esta fase.
- **Qué datos se necesitan:** los insights de Fase 5 + reglas de negocio (presupuesto máximo, mínimo de conversiones para decidir, etc. — ver Sección 7).
- **Riesgos:** recomendar cambios agresivos con poco dato (sobreajuste a ruido de corto plazo).
- **Criterio de "terminado":** un trafficker humano revisa 10-20 recomendaciones y las considera razonables (aunque no siempre las apruebe).

### Fase 7 — Aprobación humana
- **Objetivo:** construir el flujo formal de "propuesta → decisión humana → registro".
- **Funciones necesarias:** bandeja de recomendaciones pendientes, botones/comandos de aprobar-rechazar-editar, notificación de nuevas propuestas.
- **Qué debe construirse:** el sistema de aprobaciones descrito en la arquitectura, con historial de quién decidió qué.
- **Qué datos se necesitan:** identidad de los usuarios que aprueban (mínimo: nombre/rol).
- **Riesgos:** flujo tan lento o incómodo que el humano deja de revisar y aprueba todo sin leer ("fatiga de aprobación").
- **Criterio de "terminado":** existe un registro completo y consultable de aprobaciones/rechazos con fecha y responsable.

### Fase 8 — Ejecución controlada
- **Objetivo:** que el agente pueda, por fin, tocar la cuenta real — pero solo dentro de lo aprobado y con reversa disponible.
- **Funciones necesarias:** ejecución de la acción vía API/MCP, verificación post-ejecución (¿se aplicó correctamente?), sistema de rollback.
- **Qué debe construirse:** el ejecutor de acciones (pausar, cambiar presupuesto dentro de límites) + el mecanismo de reversa.
- **Qué datos se necesitan:** las reglas de seguridad de la Sección 7 ya implementadas y probadas.
- **Riesgos:** ejecutar sobre la cuenta equivocada, ejecutar dos veces la misma acción, no poder revertir a tiempo.
- **Criterio de "terminado":** se ejecutan con éxito 10-20 acciones pequeñas reales (en cuenta de prueba primero, luego real con presupuesto bajo) sin incidentes, y al menos una reversa funciona correctamente en un ensayo.

### Fase 9 — Medición de resultados
- **Objetivo:** saber si las decisiones del agente realmente ayudan, no solo si "se ejecutaron bien".
- **Funciones necesarias:** comparación antes/después de cada acción, ventana de espera antes de medir, vínculo con resultados reales de negocio si ya existen.
- **Qué debe construirse:** un panel de seguimiento por recomendación: qué se esperaba vs. qué pasó.
- **Qué datos se necesitan:** el registro de acciones + métricas posteriores a cada cambio.
- **Riesgos:** medir demasiado pronto (antes de que el cambio muestre efecto real) y sacar conclusiones equivocadas.
- **Criterio de "terminado":** existe un reporte de "efectividad de recomendaciones" con datos de al menos 20-30 decisiones.

### Fase 10 — Pruebas y mejora continua
- **Objetivo:** consolidar el sistema, ajustar reglas según lo aprendido, y decidir si se amplía la autonomía (Nivel 3) o el alcance.
- **Funciones necesarias:** revisión periódica de reglas, ajuste de umbrales, incorporación de feedback humano.
- **Qué debe construirse:** un proceso recurrente (mensual, por ejemplo) de revisión del desempeño del propio agente.
- **Qué datos se necesitan:** todo lo acumulado en fases anteriores.
- **Riesgos:** dejar el sistema "en piloto automático" sin revisión humana periódica.
- **Criterio de "terminado":** esta fase no termina — es el modo de operación permanente del proyecto.

---

## 6. Niveles de autonomía

| Nivel | Nombre | Qué puede hacer | Aprobación requerida |
|---|---|---|---|
| **1** | Solo lectura | Analiza y reporta. No cambia nada. | No aplica |
| **2** | Recomendación | Propone una acción con ficha completa. | Sí, siempre, antes de ejecutar |
| **3** | Automatización limitada | Ejecuta acciones pequeñas y de bajo riesgo predefinidas (pausar anuncio claramente malo, mover presupuesto dentro de un % límite, enviar alertas). | No previa, pero con límites duros + notificación inmediata + reversa disponible |
| **4** | Siempre con aprobación | Crear campañas, cambiar objetivo/puja/audiencia/creatividad, subidas grandes de presupuesto, categorías sensibles, cualquier decisión de alto gasto. | Sí, siempre, sin excepción |

**Recomendación de secuencia:** el proyecto debe vivir en Nivel 1 durante todo el MVP, pasar a Nivel 2 cuando el motor de insights sea confiable (Fase 6-7), y solo considerar Nivel 3 después de tener semanas de historial de recomendaciones aceptadas y sin errores graves. El Nivel 4 nunca deja de requerir humano — no es una fase a "superar", es una categoría permanente.

### Ficha obligatoria de cada recomendación (Nivel 2 en adelante)
1. Qué campaña, conjunto o anuncio afecta.
2. Qué problema detectó (con los números que lo sustentan).
3. Qué acción recomienda.
4. Cuánto presupuesto cambiaría (monto y %).
5. Por qué recomienda ese cambio (la lógica, no solo "la IA lo sugiere").
6. Qué resultado espera obtener (y en qué plazo).
7. Qué riesgos existen si se aplica.
8. Cuándo debería revisarse (fecha o condición).
9. Cuándo debería revertirse (condición de reversa automática o sugerida).

---

## 7. Reglas de seguridad

| Regla | Propuesta inicial (ajustable) |
|---|---|
| Límite diario de gasto por cuenta | No exceder el presupuesto diario ya definido por el humano; el agente nunca lo incrementa por sí solo más allá del % permitido en Nivel 3. |
| Límite semanal de gasto | Techo acumulado, revisado cada 7 días; si se alcanza, el agente deja de proponer subidas y solo puede recomendar (no ejecutar) hasta revisión humana. |
| % máximo de cambio de presupuesto por acción | Ej. máximo ±20% por movimiento en Nivel 3; cualquier cambio mayor pasa automáticamente a Nivel 4 (requiere aprobación). |
| Mínimo de conversiones antes de decidir | No tomar decisiones de pausa/optimización con menos de un umbral definido de conversiones (ej. 10-15), para evitar decidir sobre ruido estadístico. |
| Tiempo mínimo de espera antes de reaccionar | No actuar sobre un anuncio/campaña con menos de X días de vida (ej. 3-4 días) salvo señales muy claras de gasto sin ningún resultado. |
| Condiciones para NO actuar | Datos insuficientes, cuenta con cambios estructurales recientes (nueva campaña, cambio de objetivo reciente), período de aprendizaje de Meta en curso, fin de semana/feriado con comportamiento atípico conocido. |
| Condiciones para pausar un anuncio | Gasto significativo sin ningún resultado en X días, CPA muy por encima del histórico con volumen suficiente para ser confiable, frecuencia excesiva con caída sostenida de CTR. |
| Condiciones para revertir un cambio | El resultado esperado no se cumple en el plazo indicado, o el cambio produjo un efecto negativo claro (CPA se disparó tras la acción). |
| Registro de recomendaciones y acciones | Toda recomendación (aceptada, rechazada o ignorada) y toda acción ejecutada queda guardada con fecha, datos que la motivaron y resultado posterior. |
| Historial de aprobaciones | Cada acción de Nivel 2+ guarda quién aprobó, cuándo, y si hubo edición sobre la propuesta original. |
| Sistema de rollback | Toda acción ejecutable debe tener una forma de deshacerse (volver al presupuesto anterior, reactivar un anuncio pausado) documentada antes de ejecutar, no improvisada después. |
| Protección contra cambios repetidos | No permitir múltiples cambios sobre el mismo objeto en una ventana corta de tiempo (ej. no tocar el mismo conjunto de anuncios más de 1 vez cada 48-72h) para evitar oscilaciones ("flip-flopping") que dañan el aprendizaje del algoritmo de Meta. |
| Modo de emergencia | Un interruptor único, accesible en un clic/comando, que detiene toda ejecución automática (Nivel 3) de inmediato, sin afectar la lectura ni los reportes. |

---

## 8. Métricas de éxito

Es importante separar dos preguntas distintas: **¿el agente funciona técnicamente bien?** y **¿el agente mejora el negocio?**

### Métricas técnicas (¿el agente es correcto y confiable?)
- Precisión de los insights (¿lo que detecta realmente pasó y era relevante?).
- % de recomendaciones aceptadas vs. rechazadas.
- % de acciones ejecutadas que tuvieron que revertirse.
- Errores cometidos (ejecuciones fallidas, datos mal calculados, alertas falsas).
- Tiempo ahorrado al trafficker/dueño (horas de revisión manual evitadas).

### Métricas de negocio (¿el agente realmente ayuda?)
- Cambios en CPA / CPL a lo largo del tiempo.
- Cambios en ROAS (reportado por Meta y, cuando exista, ROAS real).
- Calidad de los leads (tasa de conversión de lead a cliente, no solo cantidad de leads).
- Ventas reales y margen (cuando haya conexión con CRM/negocio).
- Resultado incremental: comparar el desempeño de cuentas/campañas gestionadas con ayuda del agente contra un grupo de control gestionado solo manualmente (o contra el propio historial antes del agente).

**Regla práctica:** las métricas técnicas dicen si el agente "hace bien su trabajo interno"; las métricas de negocio dicen si vale la pena seguir usándolo. Ambas deben reportarse juntas — un agente con 95% de recomendaciones aceptadas pero que no mueve el CPA real es una alerta, no un éxito.

---

## 9. Plan de pruebas

**Principio general: nunca se prueba por primera vez con dinero real ni en la cuenta principal.** Usar una cuenta publicitaria de prueba (sandbox o una cuenta secundaria de bajo presupuesto) para todas las pruebas de ejecución.

| Tipo de prueba | Qué valida | Cómo hacerla sin riesgo |
|---|---|---|
| Conexión | Que la autenticación y permisos funcionan de forma estable | Cuenta de prueba, revisar manejo de expiración de tokens |
| Lectura de datos | Que los datos traídos coinciden con lo que se ve en Meta Ads Manager | Comparar manualmente 5-10 campañas contra el Ads Manager |
| Análisis | Que los cálculos (CPA, ROAS, etc.) son correctos | Recalcular a mano una muestra y comparar |
| Recomendaciones | Que las sugerencias tienen sentido y siguen las reglas de negocio | Revisión humana de 20-30 recomendaciones antes de activar ejecución |
| Aprobación humana | Que el flujo de aprobar/rechazar registra todo correctamente | Simular aprobaciones y rechazos, verificar el registro |
| Ejecución | Que la acción se aplica correctamente en Meta | Ejecutar en cuenta de prueba primero, verificar en Ads Manager |
| Límites de gasto | Que el sistema realmente bloquea cambios fuera de rango | Intentar forzar un cambio que exceda el límite y confirmar que se rechaza |
| Rollback | Que revertir un cambio funciona | Ejecutar un cambio de prueba y revertirlo, confirmar que vuelve al estado original |
| Datos históricos | Que el sistema no se rompe con datos reales acumulados | Cargar semanas/meses de historial real (solo lectura) y revisar consistencia |
| Modo solo lectura | Que en Nivel 1 no se ejecuta nada bajo ninguna circunstancia | Auditoría de código/configuración + prueba de "intentar" ejecutar y confirmar bloqueo |
| Comparación vs. reglas fijas y gestión manual | Que el agente aporta valor real, no solo actividad | Correr en paralelo (modo sombra) contra decisiones manuales del trafficker durante varias semanas antes de dar autonomía real |

**Orden recomendado:** conexión → lectura → análisis → (modo sombra: el agente recomienda pero un humano decide todo, en paralelo a la operación normal) → aprobación → ejecución en cuenta de prueba → ejecución en cuenta real con presupuesto bajo → ampliación gradual.

---

## 10. Riesgos principales

1. **Confundir datos de plataforma con resultados reales del negocio.** Es el riesgo más importante de todo el proyecto — mitigado con la regla explícita de nunca tratar una conversión de Meta como venta confirmada sin cruce de datos.
2. **Sobreactuar con poco dato.** Tomar decisiones sobre campañas nuevas o con bajo volumen genera ruido, no señal.
3. **Oscilación de cambios ("flip-flopping").** Ajustar presupuesto muy seguido daña el aprendizaje del algoritmo de Meta y empeora resultados.
4. **Fatiga de aprobación.** Si el humano recibe demasiadas recomendaciones, empieza a aprobar sin leer, anulando el propósito del control humano.
5. **Dependencia de una sola fuente de verdad (Meta).** Sin cruce con CRM/ventas reales, el agente optimiza lo que es fácil de medir, no lo que importa.
6. **Cambios en la API/MCP de Meta.** Meta actualiza permisos, límites y estructura de datos con frecuencia; el conector necesita mantenimiento.
7. **Ejecución accidental o duplicada.** Errores técnicos que apliquen una acción dos veces o sobre el objeto equivocado.
8. **Falsa sensación de seguridad por tener "modo de emergencia".** El botón de emergencia solo sirve si alguien lo revisa y lo usa a tiempo — no es garantía por sí solo.
9. **Categorías sensibles.** Ciertas industrias tienen restricciones de Meta y de reputación (salud, finanzas, política) — un error ahí es más costoso que en una cuenta genérica.

---

## 11. Próximos pasos concretos

### Orden recomendado de construcción
1. Definir alcance y reglas de negocio (Fase 1) — sin esto, nada de lo demás tiene bordes claros.
2. Conectar en solo lectura a una cuenta de prueba (Fase 2).
3. Construir la base de datos propia + ingesta diaria (Fase 3).
4. Construir reportes simples y validarlos con un humano real (Fase 4).
5. Construir el motor de reglas/insights (Fase 5) y correrlo en paralelo sin tocar nada (modo sombra).
6. Construir el generador de recomendaciones con su ficha completa (Fase 6).
7. Construir el flujo de aprobación humana (Fase 7) y operar en Nivel 2 varias semanas.
8. Solo entonces construir la ejecución controlada (Fase 8), primero en cuenta de prueba.
9. Construir medición de resultados (Fase 9) para saber si de verdad ayuda.
10. Entrar en modo de mejora continua (Fase 10) y recién ahí evaluar ampliar a Nivel 3.

### Qué NO construir todavía
- Ejecución automática sin aprobación (Nivel 3) — hasta tener semanas de Nivel 2 validado.
- Integración con CRM — hasta que el MVP de lectura/reportes esté validado (se puede planear desde antes, pero no construir).
- Multi-cuenta / multi-cliente — valida con una cuenta antes de escalar a varias.
- Modelos predictivos sofisticados (forecasting de ROAS, machine learning propio) — las reglas simples y explicables deben demostrar valor primero.
- Cambios de creatividad, audiencia, objetivo o puja de forma asistida por IA — quedan en Nivel 4 indefinidamente hasta nueva decisión de producto.

### División de responsabilidades: MCP / Marketing API / lógica propia / modelo de IA

| Tarea | Con qué se resuelve |
|---|---|
| Leer estructura y métricas de campañas | MCP oficial de Meta Ads (más simple de integrar con un agente conversacional) o Marketing API directa si se necesita más control fino o volumen alto |
| Ejecutar acciones (pausar, cambiar presupuesto) | Igual: MCP si cubre las acciones necesarias; Marketing API directa si se necesita mayor control sobre errores, reintentos y validaciones antes de enviar el cambio |
| Cálculo de métricas (CPA, ROAS, tendencias) | Lógica propia (determinística, no el modelo de IA) — deben ser cálculos exactos y auditables, no "interpretados" por un LLM |
| Aplicación de reglas de seguridad (límites, mínimos, tiempos de espera) | Lógica propia, nunca delegada al modelo de IA — deben ser reglas duras e innegociables en código |
| Detección de patrones y generación de insights | Combinación: reglas propias para lo cuantificable (umbrales, tendencias) + el modelo de IA para redactar la explicación y priorizar en lenguaje natural |
| Redacción de recomendaciones y explicaciones | Modelo de IA — es donde aporta más valor: traducir números en lenguaje claro y justificado |
| Decisión final de ejecutar una acción de alto impacto | Nunca el modelo de IA solo — siempre humano, o en Nivel 3 una regla dura ya validada, no un "criterio" del modelo en el momento |

### Decisiones que el modelo de IA nunca debería tomar solo
- Cualquier acción de Nivel 4 (crear campaña, cambiar objetivo/puja/audiencia/creatividad, subir presupuesto significativamente).
- Determinar si una "conversión" de Meta equivale a una venta real — eso lo define una regla de negocio explícita, no una inferencia del modelo.
- Decidir si un cambio se revierte o no sin que quede registrado el criterio objetivo usado.
- Operar sobre cuentas o campañas de categorías sensibles sin marca explícita de "requiere revisión humana siempre".

### Información que hay que pedirle al usuario antes de recomendar cambios
1. ¿Cuál es el presupuesto total disponible y sus límites diarios/semanales reales (no solo lo que dice Meta)?
2. ¿Cuál es el objetivo de negocio real de cada campaña (ventas, leads, tráfico, reconocimiento) y su meta de costo aceptable (CPA/CPL objetivo)?
3. ¿Existe una fuente de verdad de negocio (CRM, hoja de ventas, Google Analytics) y se puede conectar, aunque sea manualmente al inicio?
4. ¿Qué campañas/cuentas son "sensibles" y requieren siempre aprobación, sin excepción?
5. ¿Quién tiene autoridad para aprobar cambios, y hay más de una persona (para definir el flujo de aprobación)?
6. ¿Cuál es el apetito de riesgo del negocio (qué tan agresivo puede ser el agente al recomendar)?
7. ¿Cuánto tiempo de vida mínimo debe tener una campaña/anuncio antes de que se considere "con datos suficientes" para decidir?

---

## 12. Lista de preguntas que necesito responder antes de comenzar

1. ¿Qué cuenta(s) publicitaria(s) específica(s) vamos a usar para el MVP, y hay una cuenta de prueba separada para no arriesgar la cuenta principal?
2. ¿Cuál es el presupuesto mensual/diario actual real de esas campañas?
3. ¿Ya existe acceso administrador al Business Manager y permisos para generar tokens/credenciales de API?
4. ¿Qué tan urgente es llegar a ejecución automática (Nivel 3), o hay comodidad en quedarse en Nivel 1-2 varias semanas?
5. ¿Existe hoy algún sistema de CRM, hoja de cálculo de ventas, o Google Analytics conectado que pueda usarse como fuente de verdad de negocio? ¿Quién tiene acceso a esos datos?
6. ¿Cuáles son las metas de costo aceptables (CPA/CPL objetivo) por campaña o por tipo de campaña?
7. ¿Hay campañas o industrias sensibles que deban quedar siempre en Nivel 4 (aprobación obligatoria)?
8. ¿Quién(es) van a aprobar las recomendaciones del agente en el día a día? ¿Una sola persona o varias con distintos niveles?
9. ¿Por qué canal se prefiere recibir reportes y alertas (chat/WhatsApp, email, dashboard web, Slack)?
10. ¿Prefieres iniciar la conexión con el MCP oficial de Meta Ads (más rápido de integrar) o ir directo a la Marketing API (más control, más trabajo de construcción)?
11. ¿Hay restricciones legales o de compliance de la industria del negocio que deban incorporarse desde el diseño (ej. salud, finanzas)?
12. ¿Cuál es el horizonte de tiempo esperado para tener el MVP funcionando en modo solo lectura?
