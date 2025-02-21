// Referencias al DOM
const listadoCursos = document.getElementById("cursos");
const tiposSelect = document.getElementById("tipos");
const accesosRapidos = document.getElementById("accesos-rapidos");
const buscarInput = document.getElementById("buscar");
const buscarBtn = document.getElementById("buscar-button");
const ordenarAscBtn = document.getElementById("ordenar-ascendente");
const ordenarDescBtn = document.getElementById("ordenar-descendente");
const cursosFavoritos = document.getElementById("cursos-favoritos");
const filtrarFavoritosBtn = document.getElementById("filtrar-favoritos");
const videoContainer = document.getElementById('seccion-video'); // Contenedor del video
const cursoTitle = document.getElementById('curso-title'); // Título del curso
const cursoPrecio = document.getElementById('curso-precio'); // Precio del curso
const cursoSynopsis = document.getElementById('curso-synopsis'); // Sinopsis del curso
const reproductorVideo = document.getElementById('reproductor-video'); // Reproductor de video

let cursos = [];
let cursosFiltrados = [];
let cursosFavoritosFiltrados = []; // Guardar los cursos filtrados

// Recuperar el userId desde localStorage y asegurarse de que es un número entero
const userId = localStorage.getItem('userId');

if (isNaN(userId)) {
    console.error('El userId no es un número válido');
} else {
    console.log('Usuario autenticado con ID:', userId);
}

function inicializar() {
    fetch('http://localhost:3000/cursos')
    .then(response => response.json())
    .then(data => {
        cursos = data;
        cursosFiltrados = [...cursos];
        mostrarCursos(cursosFiltrados);
        generarBotonesAcceso();
    })
    .catch(error => console.error('Error:', error));

    cargarFavoritos();
}

function generarBotonesAcceso() {
    accesosRapidos.innerHTML = "";
    const tipos = [...new Set(cursos.map(c => c.id_tipos))];

    tipos.forEach(tipo => {
        if (tipo !== null && tipo !== undefined) {
            const button = document.createElement("button");
            button.textContent = tipo;
            button.addEventListener("click", () => filtrarCursos(tipo));
            accesosRapidos.appendChild(button);
        }
    });
}

function mostrarCursos(lista) {
    listadoCursos.innerHTML = "";
    if (lista.length === 0) {
        listadoCursos.innerHTML = "<li>No se encontraron cursos.</li>";
        return;
    }

    lista.forEach(curso => {
        const li = document.createElement("li");
        const esFavorito = cursosFavoritosFiltrados.some(c => c.id_cursos === curso.id_cursos);
        const corazonClass = esFavorito ? "fas fa-heart" : "far fa-heart";
        const corazonStyle = esFavorito 
            ? "background-color:rgb(255, 255, 255); color: #1c1c2c; font-size:24px" 
            : "background-color:rgb(255, 255, 255); color: #1c1c2c; font-size:24px";

        li.innerHTML = `
            <div class="curso-contenedor">
                <div class="curso-imagen">
                    <img src="${curso.portada}" alt="${curso.titulo}">
                </div>
                <div class="curso-detalles">
                    <h2>${curso.titulo}</h2>
                    <p>Tipo: ${curso.id_tipos}</p>
                    <p>Descripción: ${curso.descripcion}</p>
                    <p>Precio: ${curso.precio}</p>
                    <div class="ver-video-container"><a href="#seccion-video">
                        <button class="ver-video" data-curso-id="${curso.id_cursos}">Ver Vídeo</button>
                        </a>
                    </div>
                    <div class="favoritos-container">
                        <button class="favorito-btn" data-video-id="${curso.id_cursos}">
                            <i class="${corazonClass}" style="${corazonStyle}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        listadoCursos.appendChild(li);
    });

    document.querySelectorAll('.favorito-btn').forEach(boton => {
        boton.addEventListener('click', (event) => {
            const cursoId = event.target.closest('button').getAttribute('data-curso-id');
            const esFavorito = cursosFavoritosFiltrados.some(c => c.id_cursos == cursoId);

            if (esFavorito) {
                eliminarDeFavoritos(cursoId);
            } else {
                agregarAFavoritos(cursoId);
            }
        });
    });

    document.querySelectorAll('.ver-video').forEach(boton => {
        boton.addEventListener('click', (event) => {
            const cursoId = event.target.getAttribute('data-video-id');
            mostrarVideo(cursoId);
        });
    });
}

function mostrarVideo(cursoId) {
    const curso = cursos.find(c => c.id_cursos == cursoId);
    if (curso) {
        reproductorVideo.url = curso.video; // Cargar desde archivo local
        cursoTitle.textContent = curso.titulo;
        cursoPrecio.textContent = curso.precio;
        cursoSynopsis.textContent = curso.descripcion;
        videoContainer.style.display = 'block'; // Hacer visible el contenedor del trailer
    } else {
        videoContainer.style.display = 'none'; // Ocultar el trailer si no se encuentra la película
        console.error('Curso no encontrado');
    }
}

function agregarAFavoritos(cursoId) {
    fetch('http://localhost:3000/favoritos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario_id: userId, id_cursos: cursoId })
    })
    .then(response => response.json())
    .then(() => {
        cargarFavoritos();
    })
    .catch(error => {
        console.error('Error al añadir a favoritos:', error);
        alert("Hubo un error al añadir a favoritos.");
    });
}

function cargarFavoritos() {
    fetch(`http://localhost:3000/favoritos/${userId}`)
        .then(response => response.json())
        .then(data => {
            console.log("Favoritos cargados:", data); // 🔍 Debugging
            cursosFavoritosFiltrados = Array.isArray(data) ? data : [];

            if (filtrarFavoritosBtn.classList.contains("activo")) {
                mostrarCursos(cursosFavoritosFiltrados);
            } else {
                mostrarCursoss(cursosFiltrados.length > 0 ? cursosFiltrados : cursos);
            }
        })
        .catch(error => {
            console.error('Error al cargar favoritos:', error);
            mostrarCursos(cursosFiltrados.length > 0 ? cursosFiltrados : cursos);
        });
}

function eliminarDeFavoritos(cursoId) {
    fetch('http://localhost:3000/favoritos', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ usuario_id: userId, id_cursos: cursoId })
    })
    .then(response => response.json())
    .then(() => {
        cargarFavoritos();  // Recargar la lista de favoritos inmediatamente
    })
    .catch(error => {
        console.error('Error al eliminar de favoritos:', error);
        alert("Hubo un error al eliminar de favoritos.");
    });
}


function filtrarCursos(tipo) {
    const cursosFiltradosPorTipos = cursos.filter(curso => curso.tipo === tipo);
    mostrarCursos(cursosFiltradosPorTipos);
}

function buscarPorTitulo() {
    const query = buscarInput.value.toLowerCase();
    const cursosEncontrados = cursos.filter(curso =>
        curso.titulo.toLowerCase().includes(query)
    );
    mostrarCursos(cursosEncontrados);
}

// Ordenar películas por año

document.getElementById('volverLogin').addEventListener('click', function(event) {
    window.location.href = 'login.html'; // Redirigir al perfil
});

filtrarFavoritosBtn.addEventListener("click", () => {
    filtrarFavoritosBtn.classList.toggle("activo");
    cargarFavoritos();
});

buscarBtn.addEventListener("click", buscarPorTitulo);


inicializar();