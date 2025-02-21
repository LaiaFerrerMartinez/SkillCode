const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "skillcode.ch6x44uoob9k.us-east-1.rds.amazonaws.com",
  database: "postgres",
  password: "12345678", // Considera usar variables de entorno para gestionar contraseñas
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/usuarios", async (req, res)=>{
  const {rows} = await pool.query(
      "SELECT * FROM USUARIOS;"
  );
  res.json(rows);
});

// Middleware común
app.use(express.json());
app.use(cors());

// Obtener lista de películas con trailer_archivo
app.get("/cursos", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id_cursos AS id_cursos, 
             c.titulo AS titulo, 
             c.descripcion AS descripcion, 
             c.precio AS precio, 
             t.nombre_tipos AS nombre_tipos,  
             c.portada AS portada
      FROM cursos c
      INNER JOIN tipos t ON c.id_tipos = t.id_tipos;
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para agregar o actualizar el archivo del trailer de una película
app.post("/peliculas/trailer", async (req, res) => {
  const { pelicula_id, trailer_archivo } = req.body;

  if (!pelicula_id || !trailer_archivo) {
    return res.status(400).json({ message: 'Faltan datos para agregar el trailer' });
  }

  try {
    await pool.query(`
      UPDATE peliculas
      SET trailer_archivo = $1
      WHERE id = $2;
    `, [trailer_archivo, pelicula_id]);

    res.status(200).json({ message: 'Trailer actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el trailer:', error);
    res.status(500).send('Error interno del servidor');
  }
});


// Ruta para login (POST)
app.post("/api/login", async (req, res) => { // Asegúrate de usar "/api/login"
  const { usuario, contrasenia } = req.body;

  if (!usuario || !contrasenia) {
      return res.status(400).json({ message: 'Faltan datos de login' });
  }

  try {
      // Buscamos en la base de datos si el usuario y la contraseña coinciden
      const { rows } = await pool.query(
          "SELECT * FROM USUARIOS WHERE nombre_usuario = $1 AND password = $2",  // Verifica las columnas correctamente
          [usuario, contrasenia]
      );

      if (rows.length > 0) {
          const user = rows[0];

          // Si se encuentran los datos, pasamos el id del usuario junto con el nombre
          res.json({
              success: true,
              userId: user.id,            // El id del usuario
              nombre_usuario: user.nombre_usuario, // El nombre de usuario
          });
      } else {
          res.json({ success: false, message: "Usuario o contraseña incorrectos" });
      }
  } catch (error) {
      console.error("Error durante el login:", error);
      res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});
// Ruta para obtener favoritos de un usuario
app.get("/favoritos/:usuario_id", async (req, res) => {
  let { usuario_id } = req.params;

  // Convertir el usuario_id a un número entero
  usuario_id = parseInt(usuario_id, 10);

  // Validar que el usuario_id es un número válido
  if (isNaN(usuario_id)) {
    return res.status(400).json({ message: 'El ID de usuario no es válido.' });
  }

  try {
    const { rows } = await pool.query(`
      SELECT p.id AS pelicula_id, 
             p.titulo AS pelicula_titulo, 
             p.descripcion AS pelicula_descripcion, 
             p.anio AS pelicula_anio, 
             g.titulo AS genero_titulo, 
             s.nombre AS saga_nombre, 
             p.imagen_url AS pelicula_imagen_url
      FROM favoritos f
      INNER JOIN peliculas p ON f.pelicula_id = p.id
      LEFT JOIN generos g ON p.genero_id = g.id
      LEFT JOIN sagas s ON p.saga_id = s.id
      WHERE f.usuario_id = $1;
    `, [usuario_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron favoritos' });
    }

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para añadir película a favoritos
app.post("/favoritos", async (req, res) => {
  let { usuario_id, pelicula_id } = req.body;

  // Convertir el usuario_id a un número entero
  usuario_id = parseInt(usuario_id, 10);

  // Validar que el usuario_id es un número válido
  if (isNaN(usuario_id)) {
    return res.status(400).json({ message: 'El ID de usuario no es válido.' });
  }

  if (!pelicula_id) {
    return res.status(400).json({ message: 'Faltan datos para agregar a favoritos' });
  }

  try {
    const checkExistenceQuery = `
      SELECT 1 FROM favoritos WHERE usuario_id = $1 AND pelicula_id = $2
    `;
    const checkResult = await pool.query(checkExistenceQuery, [usuario_id, pelicula_id]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ message: 'La película ya está en favoritos' });
    }

    await pool.query(
      `INSERT INTO favoritos (usuario_id, pelicula_id) VALUES ($1, $2)`,
      [usuario_id, pelicula_id]
    );
    res.status(200).json({ message: 'Película añadida a favoritos' });
  } catch (error) {
    console.error('Error al añadir a favoritos:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para eliminar película de favoritos
app.delete("/favoritos", async (req, res) => {
  let { usuario_id, pelicula_id } = req.body;

  // Convertir el usuario_id a un número entero
  usuario_id = parseInt(usuario_id, 10);

  // Validar que el usuario_id es un número válido
  if (isNaN(usuario_id)) {
    return res.status(400).json({ message: 'El ID de usuario no es válido.' });
  }

  if (!pelicula_id) {
    return res.status(400).json({ message: 'Faltan datos para eliminar de favoritos' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM favoritos WHERE usuario_id = $1 AND pelicula_id = $2`,
      [usuario_id, pelicula_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No se encontró la película en favoritos' });
    }

    res.status(200).json({ message: 'Película eliminada de favoritos' });
  } catch (error) {
    console.error('Error al eliminar de favoritos:', error);
    res.status(500).send('Error interno del servidor');
  }
});


// Iniciar el servidor
const server = app.listen(3000, () => {
  console.log(`Servidor corriendo en http://localhost:3000`);
});