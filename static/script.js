// ==========================================
// CONFIGURACIÓN Y ESTADOS GLOBALES (SPLIT-SCREEN 2P)
// ==========================================
const ESTADOS = {
    MENU: 'MENU',
    SUPERMERCADO: 'SUPERMERCADO',
    CALLE_TIENDA: 'CALLE_TIENDA',
    ALCANTARILLAS: 'ALCANTARILLAS',
    ESTACION_METRO: 'ESTACION_METRO',
    TREN_BATALLA_FINAL: 'TREN_BATALLA_FINAL',
    VICTORIA: 'VICTORIA'
};

const NOMBRES_ZONAS = {
    SUPERMERCADO: 'SUPERMERCADO ABANDONADO (TOKIO)',
    CALLE_TIENDA: 'CALLE LLUVIOSA - PATRULLA DESTRUIDA',
    ALCANTARILLAS: 'ALCANTARILLAS INFECTADAS',
    ESTACION_METRO: 'ESTACIÓN DE METRO (EMERGENCIAS)',
    TREN_BATALLA_FINAL: 'TECHO DEL TREN EN MOVIMIENTO'
};

const ANCHO_MAPA = 1200;
const ALTO_MAPA = 650;

let estadoJuego = ESTADOS.MENU;
let canvasJ1, ctxJ1, canvasJ2, ctxJ2, canvasPreview, ctxPreview;
let gameLoopReq = null;

const teclas = {};

// JUGADOR 1 (WASD + Q + E + ESPACIO)
const jugador1 = {
    id: 1,
    nombre: 'Jugador 1',
    x: 60,
    y: 330,
    ancho: 36,
    alto: 48,
    velocidad: 3.2,
    salud: 100,
    armaEquipada: 'Navaja de bolsillo',
    municion: { pistola: 12, escopeta: 6, metralleta: 60, lanzagranadas: 4 },
    inventario: ['Navaja de bolsillo'],
    dir: 1,
    frameAnim: 0,
    contadorAnim: 0,
    disparando: 0,
    inventarioAbierto: false,
    slotSeleccionado: 0,
    mensajeFlotante: '',
    tiempoMensaje: 0,
    custom: { pelo: '#4a2e1b', piel: '#ffdbac', camisa: '#1e40af', pantalon: '#374151' }
};

// JUGADOR 2 (FLECHAS + I/NumpadEnter + Supr + Ins)
const jugador2 = {
    id: 2,
    nombre: 'Jugador 2',
    x: 60,
    y: 390,
    ancho: 36,
    alto: 48,
    velocidad: 3.2,
    salud: 100,
    armaEquipada: 'Navaja de bolsillo',
    municion: { pistola: 12, escopeta: 6, metralleta: 60, lanzagranadas: 4 },
    inventario: ['Navaja de bolsillo'],
    dir: 1,
    frameAnim: 0,
    contadorAnim: 0,
    disparando: 0,
    inventarioAbierto: false,
    slotSeleccionado: 0,
    mensajeFlotante: '',
    tiempoMensaje: 0,
    custom: { pelo: '#1e293b', piel: '#ffdbac', camisa: '#15803d', pantalon: '#1f2937' }
};

// TYRANT (MR. X / NEMESIS) - IMPONENTE
const tyrant = {
    x: 980,
    y: 200,
    ancho: 75,
    alto: 115,
    velocidad: 1.1,
    salud: 660,
    saludMax: 660,
    fase: 1,
    incapacitado: false,
    tiempoIncapacitado: 0,
    dir: -1,
    frameAnim: 0,
    contadorAnim: 0,
    cdAtaqueCarne: 0,
    cdShake: 0
};

let proyectilesTyrant = [];
let zombis = [];
let mueblesInteractivos = [];
let telefonoUsado = false;
let particulasLluvia = [];

window.onload = function () {
    canvasJ1 = document.getElementById('canvasJ1');
    if (canvasJ1) { ctxJ1 = canvasJ1.getContext('2d'); ctxJ1.imageSmoothingEnabled = false; }

    canvasJ2 = document.getElementById('canvasJ2');
    if (canvasJ2) { ctxJ2 = canvasJ2.getContext('2d'); ctxJ2.imageSmoothingEnabled = false; }

    canvasPreview = document.getElementById('canvasPreview');
    if (canvasPreview) { ctxPreview = canvasPreview.getContext('2d'); ctxPreview.imageSmoothingEnabled = false; }

    for (let i = 0; i < 60; i++) {
        particulasLluvia.push({
            x: Math.random() * ANCHO_MAPA,
            y: Math.random() * ALTO_MAPA,
            largo: 10 + Math.random() * 15,
            vel: 12 + Math.random() * 8
        });
    }
};

window.addEventListener('keydown', (e) => {
    let k = e.key.toLowerCase();
    let code = e.code;
    teclas[k] = true;
    teclas[code] = true;

    // --- CONTROLES JUGADOR 1 ---
    if (k === 'q') toggleInventario(1);

    if (jugador1.inventarioAbierto) {
        if (k === 'd' || code === 'KeyD') jugador1.slotSeleccionado = (jugador1.slotSeleccionado + 1) % 6;
        if (k === 'a' || code === 'KeyA') jugador1.slotSeleccionado = (jugador1.slotSeleccionado + 5) % 6;
        if (k === 's' || code === 'KeyS') jugador1.slotSeleccionado = (jugador1.slotSeleccionado + 3) % 6;
        if (k === 'w' || code === 'KeyW') jugador1.slotSeleccionado = (jugador1.slotSeleccionado + 3) % 6;
        if (k === 'e' || code === 'KeyE') accionUsar(1);
        renderizarSlotsInventario(jugador1);
    } else {
        if (e.key === ' ' || k === 'j') atacarJugador(jugador1);
        if (k === 'e') accionInteractuar(jugador1);
    }

    // --- CONTROLES JUGADOR 2 ---
    const esTeclaInventarioJ2 = (k === 'i' || code === 'NumpadEnter');
    const esTeclaAccionJ2 = (code === 'Delete' || k === 'delete' || code === 'NumpadDecimal');
    const esTeclaAtaqueJ2 = (code === 'Insert' || k === 'insert' || code === 'Numpad0');

    if (esTeclaInventarioJ2) toggleInventario(2);

    if (jugador2.inventarioAbierto) {
        if (code === 'ArrowRight') jugador2.slotSeleccionado = (jugador2.slotSeleccionado + 1) % 6;
        if (code === 'ArrowLeft') jugador2.slotSeleccionado = (jugador2.slotSeleccionado + 5) % 6;
        if (code === 'ArrowDown') jugador2.slotSeleccionado = (jugador2.slotSeleccionado + 3) % 6;
        if (code === 'ArrowUp') jugador2.slotSeleccionado = (jugador2.slotSeleccionado + 3) % 6;
        if (esTeclaAccionJ2) accionUsar(2);
        renderizarSlotsInventario(jugador2);
    } else {
        if (esTeclaAtaqueJ2) atacarJugador(jugador2);
        if (esTeclaAccionJ2) accionInteractuar(jugador2);
    }
});

window.addEventListener('keyup', (e) => {
    let k = e.key.toLowerCase();
    teclas[k] = false;
    teclas[e.code] = false;
});

function confirmarInicioJuego() {
    document.getElementById('pantallaCustom')?.classList.add('hidden');
    document.getElementById('pantallaMenu')?.classList.add('hidden');
    document.getElementById('pantallaGameOverGlobal')?.classList.add('hidden');

    // Reinicio completo del estado de la partida
    telefonoUsado = false;
    tyrant.salud = tyrant.saludMax;
    tyrant.fase = 1;
    tyrant.cdAtaqueCarne = 0;
    tyrant.cdShake = 0;
    jugador1.inventario = ['Navaja de bolsillo'];
    jugador2.inventario = ['Navaja de bolsillo'];
    jugador1.armaEquipada = 'Navaja de bolsillo';
    jugador2.armaEquipada = 'Navaja de bolsillo';
    jugador1.inventarioAbierto = false;
    jugador2.inventarioAbierto = false;
    document.getElementById('modalInventarioJ1')?.classList.add('hidden');
    document.getElementById('modalInventarioJ2')?.classList.add('hidden');

    cargarEscenario(ESTADOS.SUPERMERCADO);

    // Evita bucles duplicados
    if (gameLoopReq) cancelAnimationFrame(gameLoopReq);
    gameLoopReq = requestAnimationFrame(gameLoop);
}

function regresarAlMenu() {
    document.getElementById('pantallaGameOverGlobal')?.classList.add('hidden');
    document.getElementById('pantallaMenu')?.classList.remove('hidden');
    estadoJuego = ESTADOS.MENU;
    if (gameLoopReq) cancelAnimationFrame(gameLoopReq);
    gameLoopReq = null;
}

function cargarEscenario(nuevoEstado) {
    estadoJuego = nuevoEstado;
    jugador1.x = 60; jugador1.y = 330; jugador1.salud = 100;
    jugador2.x = 60; jugador2.y = 390; jugador2.salud = 100;

    const elZona = document.getElementById('txtZona');
    if (elZona) elZona.innerText = NOMBRES_ZONAS[estadoJuego] || estadoJuego;

    mueblesInteractivos = [];
    zombis = [];
    proyectilesTyrant = [];
    tyrant.cdAtaqueCarne = 0;

    document.getElementById('gameOverJ1')?.classList.add('hidden');
    document.getElementById('gameOverJ2')?.classList.add('hidden');

    if (estadoJuego === ESTADOS.SUPERMERCADO) {
        mueblesInteractivos = [
            { id: 'estante_1', x: 140, y: 150, ancho: 70, alto: 85, nombre: 'Estante Destruido', item: 'VACIO', buscado: false },
            { id: 'estante_2', x: 260, y: 150, ancho: 70, alto: 85, nombre: 'Estante Caído', item: 'Planta Verde', buscado: false },
            { id: 'estante_3', x: 380, y: 150, ancho: 70, alto: 85, nombre: 'Estante Vacío', item: 'VACIO', buscado: false },
            { id: 'heladera', x: 500, y: 140, ancho: 60, alto: 95, nombre: 'Heladera Oxidada', item: 'Planta Roja', buscado: false },
            { id: 'caja_super', x: 640, y: 160, ancho: 65, alto: 60, nombre: 'Caja Registradora', item: 'Pistola 9mm', buscado: false },
            { id: 'carrito_volcado', x: 780, y: 220, ancho: 55, alto: 50, nombre: 'Carrito Volcado', item: 'VACIO', buscado: false },
            { id: 'cajas_carton', x: 900, y: 150, ancho: 60, alto: 60, nombre: 'Cajas Abandonadas', item: 'Planta Verde', buscado: false }
        ];
        zombis = [
            { x: 320, y: 280, ancho: 36, alto: 48, salud: 35, dir: -1, vivo: true },
            { x: 520, y: 350, ancho: 36, alto: 48, salud: 35, dir: -1, vivo: true },
            { x: 740, y: 300, ancho: 36, alto: 48, salud: 35, dir: -1, vivo: true }
        ];
    } else if (estadoJuego === ESTADOS.CALLE_TIENDA) {
        mueblesInteractivos = [
            { id: 'patrulla', x: 340, y: 240, ancho: 180, alto: 80, nombre: 'Patrulla Policial', item: 'Balas de Pistola x8', buscado: false },
            { id: 'contenedor_basura', x: 580, y: 180, ancho: 65, alto: 65, nombre: 'Contenedor', item: 'Planta Verde', buscado: false },
            { id: 'auto_quemado', x: 760, y: 260, ancho: 130, alto: 70, nombre: 'Coche Quemado', item: 'Escopeta de Caza', buscado: false }
        ];
        zombis = [
            { x: 260, y: 360, ancho: 36, alto: 48, salud: 45, dir: 1, vivo: true },
            { x: 680, y: 320, ancho: 36, alto: 48, salud: 45, dir: 1, vivo: true }
        ];
    } else if (estadoJuego === ESTADOS.ALCANTARILLAS) {
        mueblesInteractivos = [
            { id: 'locker_alc', x: 300, y: 150, ancho: 60, alto: 90, nombre: 'Taquilla Metálica', item: 'Planta Roja', buscado: false },
            { id: 'telefono_emergencia', x: 920, y: 210, ancho: 45, alto: 65, nombre: 'Teléfono de Pared', item: 'TELEFONO', buscado: false }
        ];
        zombis = [
            { x: 240, y: 300, ancho: 36, alto: 48, salud: 50, dir: 1, vivo: true },
            { x: 550, y: 380, ancho: 36, alto: 48, salud: 50, dir: -1, vivo: true }
        ];
        tyrant.x = 980; tyrant.y = 200; tyrant.incapacitado = false;
    }

    actualizarHUD();
}

function gameLoop() {
    if (estadoJuego === ESTADOS.MENU || estadoJuego === ESTADOS.VICTORIA) {
        gameLoopReq = null;
        return;
    }

    // Se programa el siguiente frame PRIMERO: así un error puntual nunca congela el juego
    gameLoopReq = requestAnimationFrame(gameLoop);

    try {
        actualizarLogica();
        renderizarSplitScreen();
    } catch (err) {
        console.error('Error en el frame:', err);
    }
}

// ==========================================
// EFECTO DE TEMBLOR DE PANTALLA
// ==========================================
let shakeTimeout;
function triggerShake() {
    const el = document.getElementById('contenedorJuego');
    if (!el) return;
    el.classList.remove('screen-shake');
    void el.offsetWidth; // fuerza el reinicio de la animación
    el.classList.add('screen-shake');
    clearTimeout(shakeTimeout);
    shakeTimeout = setTimeout(() => el.classList.remove('screen-shake'), 300);
}

// ==========================================
// LÓGICA DE JUEGO
// ==========================================
function actualizarLogica() {
    if (jugador1.tiempoMensaje > 0) jugador1.tiempoMensaje--;
    if (jugador2.tiempoMensaje > 0) jugador2.tiempoMensaje--;

    [jugador1, jugador2].forEach(p => { if (p.disparando > 0) p.disparando--; });

    if (!jugador1.inventarioAbierto) actualizarMovimientoJugador(jugador1, 'w', 's', 'a', 'd');
    if (!jugador2.inventarioAbierto) actualizarMovimientoJugador(jugador2, 'arrowup', 'arrowdown', 'arrowleft', 'arrowright');

    if ((jugador1.x > ANCHO_MAPA - 60 || jugador2.x > ANCHO_MAPA - 60) && estadoJuego !== ESTADOS.TREN_BATALLA_FINAL) {
        avanzarSiguienteSala();
    }

    // IA ZOMBIS
    zombis.forEach(z => {
        if (z.vivo) {
            let j1V = jugador1.salud > 0 && !jugador1.inventarioAbierto;
            let j2V = jugador2.salud > 0 && !jugador2.inventarioAbierto;
            let jObj = j1V && j2V ? (Math.hypot(jugador1.x - z.x, jugador1.y - z.y) < Math.hypot(jugador2.x - z.x, jugador2.y - z.y) ? jugador1 : jugador2) : (j1V ? jugador1 : (j2V ? jugador2 : null));

            if (jObj) {
                let dx = jObj.x - z.x, dy = jObj.y - z.y, dist = Math.hypot(dx, dy);
                if (dist > 0 && dist < 260) { z.x += (dx / dist) * 0.9; z.y += (dy / dist) * 0.9; z.dir = dx > 0 ? 1 : -1; }
                if (dist < 28) recibirDano(jObj, 0.4);
            }
        }
    });

    // PROYECTILES DEL TYRANT: recorrido inverso seguro
    for (let idx = proyectilesTyrant.length - 1; idx >= 0; idx--) {
        let p = proyectilesTyrant[idx];
        if (!p) continue;

        p.x += p.vx;
        p.y += p.vy;

        let colision = false;
        [jugador1, jugador2].forEach(j => {
            if (!colision && j.salud > 0 && !j.inventarioAbierto && Math.hypot(p.x - (j.x + 18), p.y - (j.y + 24)) < 24) {
                recibirDano(j, 18);
                triggerShake();
                colision = true;
            }
        });

        if (colision || p.x < 0 || p.x > ANCHO_MAPA || p.y < 0 || p.y > ALTO_MAPA) {
            proyectilesTyrant.splice(idx, 1);
        }
    }

    // IA TYRANT NEMESIS
    if (tyrant.cdShake > 0) tyrant.cdShake--;

    if (estadoJuego === ESTADOS.ALCANTARILLAS || estadoJuego === ESTADOS.ESTACION_METRO || estadoJuego === ESTADOS.TREN_BATALLA_FINAL) {
        if (tyrant.incapacitado) {
            tyrant.tiempoIncapacitado--;
            if (tyrant.tiempoIncapacitado <= 0) tyrant.incapacitado = false;
        } else {
            let j1V = jugador1.salud > 0 && !jugador1.inventarioAbierto;
            let j2V = jugador2.salud > 0 && !jugador2.inventarioAbierto;
            let jObj = j1V && j2V ? (Math.hypot(jugador1.x - tyrant.x, jugador1.y - tyrant.y) < Math.hypot(jugador2.x - tyrant.x, jugador2.y - tyrant.y) ? jugador1 : jugador2) : (j1V ? jugador1 : (j2V ? jugador2 : null));

            if (jObj) {
                let dx = jObj.x - tyrant.x, dy = jObj.y - tyrant.y, dist = Math.hypot(dx, dy);
                tyrant.dir = dx > 0 ? 1 : -1;
                let velTyrant = tyrant.fase === 2 ? 1.4 : tyrant.velocidad;

                if (dist > 50) {
                    tyrant.x += (dx / dist) * velTyrant;
                    tyrant.y += (dy / dist) * velTyrant;
                } else {
                    // Temblor con cooldown para que no tiemble sin parar
                    if (tyrant.cdShake <= 0) {
                        triggerShake();
                        tyrant.cdShake = 45;
                    }
                    recibirDano(jObj, tyrant.fase === 2 ? 1.4 : 1.1);
                }

                tyrant.cdAtaqueCarne++;
                if (tyrant.cdAtaqueCarne > (tyrant.fase === 2 ? 140 : 200)) {
                    tyrant.cdAtaqueCarne = 0;
                    let angle = Math.atan2((jObj.y + 24) - (tyrant.y + 50), (jObj.x + 18) - (tyrant.x + 35));
                    if (Number.isFinite(angle)) {
                        proyectilesTyrant.push({
                            x: tyrant.x + 35, y: tyrant.y + 50,
                            vx: Math.cos(angle) * 5.5, vy: Math.sin(angle) * 5.5
                        });
                    }
                }
            }
        }
    }
}

function actualizarMovimientoJugador(j, arriba, abajo, izq, der) {
    if (j.salud <= 0) return;
    let vel = j.velocidad;
    if (j.salud <= 30) vel *= 0.55;
    let seMovio = false;

    if (teclas[izq] && j.x > 10) { j.x -= vel; j.dir = -1; seMovio = true; }
    if (teclas[der] && j.x < ANCHO_MAPA - j.ancho - 10) { j.x += vel; j.dir = 1; seMovio = true; }
    if (teclas[arriba] && j.y > 175) { j.y -= vel; seMovio = true; }
    if (teclas[abajo] && j.y < ALTO_MAPA - j.alto - 20) { j.y += vel; seMovio = true; }

    if (seMovio) {
        j.contadorAnim++;
        if (j.contadorAnim > 7) { j.frameAnim = (j.frameAnim + 1) % 4; j.contadorAnim = 0; }
    } else j.frameAnim = 0;
}

function recibirDano(j, cant) {
    if (j.inventarioAbierto) return;
    j.salud = Math.max(0, j.salud - cant);
    actualizarHUD();

    if (j.id === 1 && j.salud <= 0) document.getElementById('gameOverJ1')?.classList.remove('hidden');
    if (j.id === 2 && j.salud <= 0) document.getElementById('gameOverJ2')?.classList.remove('hidden');

    if (jugador1.salud <= 0 && jugador2.salud <= 0) {
        document.getElementById('pantallaGameOverGlobal')?.classList.remove('hidden');
    }
}

function curarEquipo(cantidad) {
    if (jugador1.salud > 0) jugador1.salud = Math.min(100, jugador1.salud + cantidad);
    if (jugador2.salud > 0) jugador2.salud = Math.min(100, jugador2.salud + cantidad);
    actualizarHUD();
}

function toggleInventario(idJugador) {
    const p = idJugador === 1 ? jugador1 : jugador2;
    const modal = document.getElementById(idJugador === 1 ? 'modalInventarioJ1' : 'modalInventarioJ2');

    if (modal) {
        p.inventarioAbierto = !p.inventarioAbierto;
        modal.classList.toggle('hidden', !p.inventarioAbierto);
        if (p.inventarioAbierto) renderizarSlotsInventario(p);
    }
}

function renderizarSlotsInventario(p) {
    const grid = document.getElementById(p.id === 1 ? 'gridSlotsJ1' : 'gridSlotsJ2');
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 0; i < 6; i++) {
        const item = p.inventario[i] || 'VACÍO';
        const div = document.createElement('div');
        const esSeleccionado = p.slotSeleccionado === i;

        div.className = `slot-item p-2 text-[10px] text-center font-mono rounded ${esSeleccionado ? 'seleccionado border-2 border-red-500 bg-red-950/80 font-bold text-white' : 'bg-zinc-900 text-gray-400'}`;
        div.innerText = item;
        grid.appendChild(div);
    }
}

function accionUsar(idJugador) {
    const p = idJugador === 1 ? jugador1 : jugador2;
    if (!p.inventarioAbierto) return;

    const item = p.inventario[p.slotSeleccionado];
    if (!item || item === 'VACÍO') return;

    if (item.includes('Planta')) {
        curarEquipo(item.includes('Roja') ? 100 : 40);
        p.inventario.splice(p.slotSeleccionado, 1);
        mostrarTextoFlotante(p, "¡EQUIPO CURADO!");
    } else {
        p.armaEquipada = item;
        mostrarTextoFlotante(p, `EQUIPADO: ${item}`);
    }

    toggleInventario(idJugador);
    actualizarHUD();
}

function accionInteractuar(j) {
    if (j.salud <= 0 || j.inventarioAbierto) return;

    for (let m of mueblesInteractivos) {
        if (Math.hypot((j.x + 18) - (m.x + m.ancho / 2), (j.y + 24) - (m.y + m.alto / 2)) < 70) {
            if (m.item === 'TELEFONO') {
                telefonoUsado = true;
                mostrarTextoFlotante(j, "TELÉFONO USADO");
                return;
            }
            if (!m.buscado) {
                m.buscado = true;
                if (m.item !== 'VACIO') {
                    j.inventario.push(m.item);
                    mostrarTextoFlotante(j, `+1 ${m.item.toUpperCase()}`);
                } else mostrarTextoFlotante(j, "VACÍO");
            } else mostrarTextoFlotante(j, "REVISADO");
            break;
        }
    }
}

function mostrarTextoFlotante(j, texto) {
    j.mensajeFlotante = texto;
    j.tiempoMensaje = 90;
}

function avanzarSiguienteSala() {
    if (estadoJuego === ESTADOS.SUPERMERCADO) cargarEscenario(ESTADOS.CALLE_TIENDA);
    else if (estadoJuego === ESTADOS.CALLE_TIENDA) cargarEscenario(ESTADOS.ALCANTARILLAS);
    else if (estadoJuego === ESTADOS.ALCANTARILLAS) {
        if (!telefonoUsado) {
            mostrarTextoFlotante(jugador1, "USA EL TELÉFONO");
            mostrarTextoFlotante(jugador2, "USA EL TELÉFONO");
            jugador1.x = ANCHO_MAPA - 100; jugador2.x = ANCHO_MAPA - 100;
            return;
        }
        cargarEscenario(ESTADOS.ESTACION_METRO);
    }
}

// ==========================================
// RENDERIZADO VISUAL
// ==========================================
function renderizarSplitScreen() {
    if (!ctxJ1 || !ctxJ2) return;

    let camX1 = Math.max(0, Math.min(ANCHO_MAPA - 500, jugador1.x - 250));
    ctxJ1.save(); ctxJ1.translate(-camX1, 0);
    dibujarEscenaCompleta(ctxJ1, jugador1); ctxJ1.restore();

    let camX2 = Math.max(0, Math.min(ANCHO_MAPA - 500, jugador2.x - 250));
    ctxJ2.save(); ctxJ2.translate(-camX2, 0);
    dibujarEscenaCompleta(ctxJ2, jugador2); ctxJ2.restore();
}

function dibujarEscenaCompleta(context, jugadorEnfocado) {
    context.clearRect(0, 0, ANCHO_MAPA, ALTO_MAPA);

    dibujarFondoYSalas(context);
    mueblesInteractivos.forEach(m => dibujarMueblePixel(context, m));

    zombis.forEach(z => { if (z.vivo) dibujarSpriteZombi(context, z.x, z.y, z.dir); });

    proyectilesTyrant.forEach(p => {
        if (!p) return;
        context.fillStyle = '#8b0000'; context.beginPath(); context.arc(p.x, p.y, 8, 0, Math.PI * 2); context.fill();
        context.fillStyle = '#ff0000'; context.beginPath(); context.arc(p.x, p.y, 4, 0, Math.PI * 2); context.fill();
    });

    if (estadoJuego === ESTADOS.ALCANTARILLAS || estadoJuego === ESTADOS.ESTACION_METRO || estadoJuego === ESTADOS.TREN_BATALLA_FINAL) {
        dibujarSpriteTyrantNemesis(context, tyrant.x, tyrant.y, tyrant.dir, tyrant.frameAnim, tyrant.incapacitado, tyrant.fase);
    }

    if (jugador1.salud > 0) dibujarSpriteJugador(context, jugador1.x, jugador1.y, jugador1.dir, jugador1.frameAnim, jugador1.custom, jugador1);
    if (jugador2.salud > 0) dibujarSpriteJugador(context, jugador2.x, jugador2.y, jugador2.dir, jugador2.frameAnim, jugador2.custom, jugador2);

    dibujarEfectoNieblaYLinterna(context, jugadorEnfocado);
}

function dibujarFondoYSalas(context) {
    if (estadoJuego === ESTADOS.SUPERMERCADO) {
        context.fillStyle = '#1c1512'; context.fillRect(0, 0, ANCHO_MAPA, 180);
        context.fillStyle = '#443c35'; context.fillRect(0, 180, ANCHO_MAPA, ALTO_MAPA - 180);
    } else if (estadoJuego === ESTADOS.CALLE_TIENDA) {
        context.fillStyle = '#030712'; context.fillRect(0, 0, ANCHO_MAPA, ALTO_MAPA);
        context.fillStyle = '#111827'; context.fillRect(0, 220, ANCHO_MAPA, 430);
    } else if (estadoJuego === ESTADOS.ALCANTARILLAS) {
        context.fillStyle = '#022c22'; context.fillRect(0, 0, ANCHO_MAPA, ALTO_MAPA);
        context.fillStyle = '#064e3b'; context.fillRect(0, 400, ANCHO_MAPA, 120);
    } else {
        context.fillStyle = '#09090b'; context.fillRect(0, 0, ANCHO_MAPA, ALTO_MAPA);
        context.fillStyle = '#27272a'; context.fillRect(0, 200, ANCHO_MAPA, 450);
    }
}

function dibujarEfectoNieblaYLinterna(context, p) {
    let xCentro = p.x + 18;
    let yCentro = p.y + 24;

    if (!Number.isFinite(xCentro) || !Number.isFinite(yCentro)) return;

    let grad = context.createRadialGradient(
        xCentro, yCentro, 30,
        xCentro, yCentro, 280
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.85, 'rgba(0,0,0,0.88)');
    grad.addColorStop(1, 'rgba(0,0,0,0.98)');
    context.fillStyle = grad;
    context.fillRect(0, 0, ANCHO_MAPA, ALTO_MAPA);
}

function dibujarMueblePixel(context, m) {
    context.save();
    if (m.id.includes('estante')) {
        context.fillStyle = m.buscado ? '#27272a' : '#451a03';
        context.fillRect(m.x, m.y, m.ancho, m.alto);
        context.fillStyle = '#78350f';
        context.fillRect(m.x + 5, m.y + 12, m.ancho - 10, 7);
        context.fillRect(m.x + 5, m.y + 42, m.ancho - 10, 7);
    } else {
        context.fillStyle = m.buscado ? '#18181b' : '#3f3f46';
        context.fillRect(m.x, m.y, m.ancho, m.alto);
    }
    context.restore();
}

function dibujarSpriteJugador(context, x, y, dir, frame, custom, playerObj) {
    context.save();
    if (dir === -1) {
        context.translate(x + 36, y);
        context.scale(-1, 1);
        x = 0; y = 0;
    }

    context.fillStyle = custom.pelo; context.fillRect(x + 10, y + 2, 16, 10);
    context.fillStyle = custom.piel; context.fillRect(x + 10, y + 10, 14, 10);
    context.fillStyle = '#000'; context.fillRect(x + 20, y + 13, 3, 3);
    context.fillStyle = custom.camisa; context.fillRect(x + 8, y + 20, 18, 16);
    context.fillStyle = custom.pantalon;
    let offsetLeg = (frame % 2 === 0) ? 0 : 3;
    context.fillRect(x + 8, y + 36, 8, 12 - offsetLeg);
    context.fillRect(x + 18, y + 36, 8, 12 + offsetLeg);

    if (playerObj && playerObj.inventarioAbierto) {
        context.strokeStyle = '#38bdf8'; context.lineWidth = 2;
        context.strokeRect(x - 4, y - 4, 44, 56);
    }

    if (playerObj && playerObj.disparando > 0) {
        context.fillStyle = '#f59e0b';
        context.beginPath(); context.arc(x + 38, y + 22, 12, 0, Math.PI * 2); context.fill();
    }

    if (playerObj && playerObj.tiempoMensaje > 0) {
        context.fillStyle = '#f59e0b';
        context.font = 'bold 11px Press Start 2P';
        context.fillText(playerObj.mensajeFlotante, x - 20, y - 10);
    }

    context.restore();
}

function dibujarSpriteZombi(context, x, y, dir) {
    context.save();
    if (dir === -1) {
        context.translate(x + 36, y); context.scale(-1, 1); x = 0; y = 0;
    }
    context.fillStyle = '#4d7c0f'; context.fillRect(x + 10, y + 2, 16, 14);
    context.fillStyle = '#dc2626'; context.fillRect(x + 20, y + 6, 4, 4);
    context.fillStyle = '#3f3f46'; context.fillRect(x + 6, y + 16, 20, 18);
    context.fillStyle = '#18181b';
    context.fillRect(x + 8, y + 34, 7, 14);
    context.fillRect(x + 18, y + 34, 7, 14);
    context.restore();
}

// ==========================================
// SPRITE DEL TYRANT (MR. X / NEMESIS)
// ==========================================
function dibujarSpriteTyrantNemesis(context, x, y, dir, frame, incapacitado, fase) {
    context.save();
    if (dir === -1) {
        context.translate(x + 75, y);
        context.scale(-1, 1);
        x = 0; y = 0;
    }

    // Sombra proyectada en el suelo
    context.fillStyle = 'rgba(0,0,0,0.5)';
    context.beginPath();
    context.ellipse(x + 35, y + 110, 35, 10, 0, 0, Math.PI * 2);
    context.fill();

    // Gabardina de cuero (torso)
    context.fillStyle = incapacitado ? '#334155' : (fase === 2 ? '#450a0a' : '#0f172a');
    context.fillRect(x + 10, y + 26, 55, 75);

    // Hombreras
    context.fillStyle = '#020617';
    context.fillRect(x + 4, y + 24, 20, 16);
    context.fillRect(x + 51, y + 24, 20, 16);

    // Cinturones y hebillas
    context.fillStyle = '#475569';
    context.fillRect(x + 12, y + 45, 51, 6);
    context.fillRect(x + 12, y + 68, 51, 6);
    context.fillStyle = '#94a3b8';
    context.fillRect(x + 33, y + 43, 10, 10);
    context.fillRect(x + 33, y + 66, 10, 10);

    // Cabeza
    context.fillStyle = incapacitado ? '#64748b' : '#cbd5e1';
    context.fillRect(x + 22, y + 2, 30, 24);

    // Ojos rojos
    context.fillStyle = '#dc2626';
    context.fillRect(x + 26, y + 10, 6, 4);
    context.fillRect(x + 40, y + 10, 6, 4);

    // Grapas / cicatriz
    context.fillStyle = '#000';
    context.fillRect(x + 28, y + 18, 18, 3);

    // Piernas y botas
    context.fillStyle = '#020617';
    context.fillRect(x + 16, y + 100, 16, 15);
    context.fillRect(x + 43, y + 100, 16, 15);

    context.restore();
}

function atacarJugador(j) {
    if (j.salud <= 0 || j.inventarioAbierto) return;
    j.disparando = 8;

    if (j.armaEquipada.includes('Navaja')) {
        zombis.forEach(z => {
            if (z.vivo && Math.hypot(j.x - z.x, j.y - z.y) < 55) {
                z.salud -= 18;
                if (z.salud <= 0) z.vivo = false;
            }
        });
    } else {
        zombis.forEach(z => {
            if (z.vivo && Math.hypot(j.x - z.x, j.y - z.y) < 220) {
                z.salud -= 35;
                if (z.salud <= 0) z.vivo = false;
            }
        });
    }
}

function actualizarHUD() {
    actualizarHUDSombra(jugador1, 'txtSalud1', 'txtArma1', 'txtMunicion1');
    actualizarHUDSombra(jugador2, 'txtSalud2', 'txtArma2', 'txtMunicion2');
}

function actualizarHUDSombra(j, idSalud, idArma, idMun) {
    const elSalud = document.getElementById(idSalud);
    if (elSalud) {
        elSalud.innerText = `${j.salud > 50 ? 'FINE' : j.salud > 20 ? 'CAUTION' : 'DANGER'} (${Math.ceil(j.salud)}%)`;
        elSalud.className = `font-pixel text-[10px] ${j.salud > 50 ? 'salud-fine' : j.salud > 20 ? 'salud-caution' : 'salud-danger'}`;
    }

    const elArma = document.getElementById(idArma);
    if (elArma) elArma.innerText = j.armaEquipada;

    const elMun = document.getElementById(idMun);
    if (elMun) elMun.innerText = j.armaEquipada.includes('Navaja') ? '∞' : (j.municion.pistola || 0);
}