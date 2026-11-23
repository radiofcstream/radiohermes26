// ==================== CONFIGURACIÓN ====================
const CONTRASEÑA_ADMIN = "monaco2026";
const CLAVES_STORAGE = {
    noticias: "radio_monaco_noticias",
    programacion: "radio_monaco_programacion",
    sesion: "radio_monaco_admin_sesion"
};
const RSS_FEED_URL = "https://www.rccargentina.com.ar/rss/";

// Variables para guardar las imágenes cargadas
let imagenNoticiaBase64 = "";
let imagenProgramaBase64 = "";

// ==================== INICIO — DOMContentLoaded ====================
document.addEventListener("DOMContentLoaded", () => {
    cargarNoticiasRSS();      // Noticias de RCC
    cargarNoticias();         // ✅ TUS noticias
    cargarProgramacion();     // Programación
    configurarReproductor();  // Reproductor de audio
    configurarInstalacionApp();
    verificarSesion();        // Login del administrador
});

// ==================== VISTA PREVIA DE IMÁGENES ====================
function vistaPreviaNoticia(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function(e) {
        imagenNoticiaBase64 = e.target.result;
        const vistaDiv = document.getElementById("vista-previa-noticia");
        const img = document.getElementById("img-previa-noticia");
        img.src = imagenNoticiaBase64;
        vistaDiv.style.display = "block";
    };
    lector.readAsDataURL(archivo);
}

function vistaPreviaPrograma(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function(e) {
        imagenProgramaBase64 = e.target.result;
        const vistaDiv = document.getElementById("vista-previa-programa");
        const img = document.getElementById("img-previa-programa");
        img.src = imagenProgramaBase64;
        vistaDiv.style.display = "block";
    };
    lector.readAsDataURL(archivo);
}

// ==================== REPRODUCTOR ====================
function configurarReproductor() {
    const audio = document.getElementById("audioPlayer");
    const btnPlayPause = document.getElementById("btnPlayPause");
    const btnStop = document.getElementById("btnStop");

    if (!audio || !btnPlayPause || !btnStop) return;

    btnPlayPause.addEventListener("click", () => {
        if (audio.paused) {
            audio.play().catch(e => console.log("Reproducción bloqueada por el navegador"));
            btnPlayPause.textContent = "⏸️ Pausar";
        } else {
            audio.pause();
            btnPlayPause.textContent = "▶️ Reproducir";
        }
    });

    btnStop.addEventListener("click", () => {
        audio.pause();
        audio.currentTime = 0;
        btnPlayPause.textContent = "▶️ Reproducir";
    });

    audio.addEventListener("ended", () => {
        btnPlayPause.textContent = "▶️ Reproducir";
    });
}

// ==================== NOTICIAS RSS ====================
async function cargarNoticiasRSS() {
    const contenedor = document.getElementById("contenedor-noticias-rss");
    if (!contenedor) return;

    try {
        const proxyURL = `https://api.allorigins.win/raw?url=${encodeURIComponent(RSS_FEED_URL)}`;
        const respuesta = await fetch(proxyURL);
        
        if (!respuesta.ok) throw new Error("Error al cargar el feed");
        
        const textoXML = await respuesta.text();
        const parser = new DOMParser();
        const docXML = parser.parseFromString(textoXML, "text/xml");
        const items = docXML.querySelectorAll("item");

        if (items.length === 0) {
            contenedor.innerHTML = `<p class="mensaje-vacio">No se encontraron noticias.</p>`;
            return;
        }

        const noticiasHTML = Array.from(items).slice(0, 8).map(item => {
            const titulo = item.querySelector("title")?.textContent || "Sin título";
            const enlace = item.querySelector("link")?.textContent || "#";
            let descripcion = item.querySelector("description")?.textContent || "";
            const fecha = item.querySelector("pubDate")?.textContent || "";
            
            let imagen = "";
            const enclosure = item.querySelector("enclosure");
            if (enclosure && enclosure.getAttribute("type")?.startsWith("image/")) {
                imagen = enclosure.getAttribute("url");
            } else {
                const match = descripcion.match(/<img[^>]+src="([^"]+)"/i);
                if (match) imagen = match[1];
            }

            descripcion = descripcion.replace(/<[^>]*>/g, "").substring(0, 120) + "...";
            const fechaFormateada = fecha ? new Date(fecha).toLocaleDateString("es-AR", {
                day: "numeric", month: "long", year: "numeric"
            }) : "";

            return `
                <div class="tarjeta-noticia">
                    ${imagen ? `<img src="${imagen}" alt="${escapeHtml(titulo)}" loading="lazy">` : ""}
                    <div class="tarjeta-contenido">
                        ${fechaFormateada ? `<small style="color:#888">📅 ${fechaFormateada}</small>` : ""}
                        <h3>${escapeHtml(titulo)}</h3>
                        <p>${escapeHtml(descripcion)}</p>
                        <a href="${enlace}" target="_blank" rel="noopener" 
                           style="color:#00a800; font-weight:bold; display:inline-block; margin-top:8px;">
                            Leer más →
                        </a>
                    </div>
                </div>
            `;
        }).join("");

        contenedor.innerHTML = noticiasHTML;

    } catch (error) {
        console.error("Error RSS:", error);
        contenedor.innerHTML = `<p class="mensaje-vacio">⚠️ No se pudieron cargar las noticias RSS.</p>`;
    }
}

// ==================== TUS NOTICIAS — PUBLICADAS DESDE EL ADMINISTRADOR ====================
function obtenerNoticias() {
    const datos = localStorage.getItem(CLAVES_STORAGE.noticias);
    return datos ? JSON.parse(datos) : [];
}

function guardarNoticias(lista) {
    localStorage.setItem(CLAVES_STORAGE.noticias, JSON.stringify(lista));
}

function cargarNoticias() {
    const contenedor = document.getElementById("contenedor-noticias");
    const listaAdmin = document.getElementById("lista-noticias-admin");
    const noticias = obtenerNoticias();

    // Mostrar en la página principal
    if (contenedor) {
        if (noticias.length === 0) {
            contenedor.innerHTML = `<p class="mensaje-vacio">No hay noticias publicadas aún.</p>`;
        } else {
            contenedor.innerHTML = noticias.map(noticia => `
                <div class="tarjeta-noticia">
                    ${noticia.imagen ? `<img src="${noticia.imagen}" alt="${escapeHtml(noticia.titulo)}">` : ""}
                    <div class="tarjeta-contenido">
                        <h3>${escapeHtml(noticia.titulo)}</h3>
                        <p>${escapeHtml(noticia.detalle)}</p>
                    </div>
                </div>
            `).join("");
        }
    }

    // Mostrar en el administrador
    if (listaAdmin) {
        if (noticias.length === 0) {
            listaAdmin.innerHTML = `<p class="mensaje-vacio">Sin noticias publicadas.</p>`;
        } else {
            listaAdmin.innerHTML = noticias.map((noticia, indice) => `
                <div class="item-admin">
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                        ${noticia.imagen ? `<img src="${noticia.imagen}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;">` : ""}
                        <span><strong>${escapeHtml(noticia.titulo)}</strong></span>
                    </div>
                    <button class="boton-eliminar" onclick="eliminarNoticia(${indice})">🗑️ Eliminar</button>
                </div>
            `).join("");
        }
    }
}

function agregarNoticia() {
    const titulo = document.getElementById("noticia-titulo").value.trim();
    const detalle = document.getElementById("noticia-detalle").value.trim();

    if (!titulo || !detalle) {
        alert("⚠️ Completa el título y el detalle");
        return;
    }

    const noticias = obtenerNoticias();
    noticias.unshift({ 
        titulo, 
        detalle, 
        imagen: imagenNoticiaBase64 || ""
    });
    guardarNoticias(noticias);

    // Limpiar formulario
    document.getElementById("noticia-titulo").value = "";
    document.getElementById("noticia-detalle").value = "";
    document.getElementById("noticia-archivo").value = "";
    document.getElementById("vista-previa-noticia").style.display = "none";
    imagenNoticiaBase64 = "";

    cargarNoticias();
    alert("✅ Noticia guardada correctamente");
}

function eliminarNoticia(indice) {
    if (!confirm("¿Eliminar esta noticia?")) return;
    const noticias = obtenerNoticias();
    noticias.splice(indice, 1);
    guardarNoticias(noticias);
    cargarNoticias();
}

// ==================== PROGRAMACIÓN ====================
function obtenerProgramacion() {
    const datos = localStorage.getItem(CLAVES_STORAGE.programacion);
    return datos ? JSON.parse(datos) : [];
}

function guardarProgramacion(lista) {
    localStorage.setItem(CLAVES_STORAGE.programacion, JSON.stringify(lista));
}

function cargarProgramacion() {
    const contenedor = document.getElementById("contenedor-programacion");
    const listaAdmin = document.getElementById("lista-programacion-admin");
    const programas = obtenerProgramacion();

    if (contenedor) {
        if (programas.length === 0) {
            contenedor.innerHTML = `<p class="mensaje-vacio">No hay programas publicados aún.</p>`;
        } else {
            contenedor.innerHTML = programas.map(prog => `
                <div class="tarjeta-programa">
                    <img src="${prog.imagen || 'logo.png'}" alt="${escapeHtml(prog.titulo)}">
                    <div class="tarjeta-contenido">
                        <div class="hora-programa">⏰ ${escapeHtml(prog.hora)}</div>
                        <h3>${escapeHtml(prog.titulo)}</h3>
                    </div>
                </div>
            `).join("");
        }
    }

    if (listaAdmin) {
        if (programas.length === 0) {
            listaAdmin.innerHTML = `<p class="mensaje-vacio">Sin programas publicados.</p>`;
        } else {
            listaAdmin.innerHTML = programas.map((prog, indice) => `
                <div class="item-admin">
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                        ${prog.imagen ? `<img src="${prog.imagen}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;">` : ""}
                        <span><strong>${escapeHtml(prog.titulo)}</strong> — ${escapeHtml(prog.hora)}</span>
                    </div>
                    <button class="boton-eliminar" onclick="eliminarPrograma(${indice})">🗑️ Eliminar</button>
                </div>
            `).join("");
        }
    }
}

function agregarPrograma() {
    const titulo = document.getElementById("programa-titulo").value.trim();
    const hora = document.getElementById("programa-hora").value.trim();

    if (!titulo || !hora) {
        alert("⚠️ Completa el nombre y la hora del programa");
        return;
    }

    const programas = obtenerProgramacion();
    programas.push({ 
        titulo, 
        hora, 
        imagen: imagenProgramaBase64 || ""
    });
    guardarProgramacion(programas);

    // Limpiar formulario
    document.getElementById("programa-titulo").value = "";
    document.getElementById("programa-hora").value = "";
    document.getElementById("programa-archivo").value = "";
    document.getElementById("vista-previa-programa").style.display = "none";
    imagenProgramaBase64 = "";

    cargarProgramacion();
    alert("✅ Programa guardado correctamente");
}

function eliminarPrograma(indice) {
    if (!confirm("¿Eliminar este programa?")) return;
    const programas = obtenerProgramacion();
    programas.splice(indice, 1);
    guardarProgramacion(programas);
    cargarProgramacion();
}

// ==================== ADMINISTRADOR — LOGIN ====================
function verificarSesion() {
    const sesionActiva = sessionStorage.getItem(CLAVES_STORAGE.sesion);
    const cajaLogin = document.getElementById("caja-login");
    const panelAdmin = document.getElementById("panel-admin");

    if (!cajaLogin || !panelAdmin) return;

    if (sesionActiva === "ok") {
        cajaLogin.style.display = "none";
        panelAdmin.style.display = "block";
    } else {
        cajaLogin.style.display = "block";
        panelAdmin.style.display = "none";
    }
}

function verificarContraseña() {
    const input = document.getElementById("campo-contraseña");
    const error = document.getElementById("mensaje-error");
    const cajaLogin = document.getElementById("caja-login");
    const panelAdmin = document.getElementById("panel-admin");

    if (input.value === CONTRASEÑA_ADMIN) {
        sessionStorage.setItem(CLAVES_STORAGE.sesion, "ok");
        cajaLogin.style.display = "none";
        panelAdmin.style.display = "block";
        input.value = "";
        if (error) error.textContent = "";
    } else {
        if (error) error.textContent = "❌ Contraseña incorrecta";
        input.value = "";
    }
}

function cerrarSesion() {
    sessionStorage.removeItem(CLAVES_STORAGE.sesion);
    verificarSesion();
}

// ==================== INSTALAR APP (PWA) ====================
let deferredPrompt;
function configurarInstalacionApp() {
    const boton = document.getElementById("instalarApp");
    if (!boton) return;

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        boton.style.display = "inline-block";
    });

    boton.addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") console.log("App instalada");
        deferredPrompt = null;
    });
}

// ==================== UTILIDADES ====================
function escapeHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto;
    return div.innerHTML;
}
