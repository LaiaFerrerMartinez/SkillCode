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
app.post("/cursos/video", async (req, res) => {
  const { id_cursos, video } = req.body;

  if (!id_cursos || !video) {
    return res.status(400).json({ message: 'Faltan datos para agregar el video' });
  }

  try {
    await pool.query(`
      UPDATE cursos
      SET video = $1
      WHERE id_cursos = $2;
    `, [video, id_cursos]);

    res.status(200).json({ message: 'Video actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el video:', error);
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
        SELECT c.id_cursos AS id_cursos, 
             c.titulo AS titulo, 
             c.descripcion AS descripcion, 
             c.precio AS precio, 
             t.nombre_tipos AS nombre_tipos,  
             c.portada AS portada
      FROM favoritos f
      INNER JOIN cursos c ON f.cursos_id = c.id_cursos
      LEFT JOIN tipos t ON c.id_tipos = t.id_tipos
      WHERE f.id_usuarios = $1;
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
  let { usuario_id, id_cursos } = req.body;

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
      SELECT 1 FROM favoritos WHERE id_usuarios = $1 AND cursos_id = $2
    `;
    const checkResult = await pool.query(checkExistenceQuery, [usuario_id, id_cursos]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ message: 'El curso ya está en favoritos' });
    }

    await pool.query(
      `INSERT INTO favoritos (id_usuarios, cursos_id) VALUES ($1, $2)`,
      [usuario_id, pelicula_id]
    );
    res.status(200).json({ message: 'Curso añadido a favoritos' });
  } catch (error) {
    console.error('Error al añadir a favoritos:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para eliminar película de favoritos
app.delete("/favoritos", async (req, res) => {
  let { usuario_id, id_cursos } = req.body;

  // Convertir el usuario_id a un número entero
  usuario_id = parseInt(usuario_id, 10);

  // Validar que el usuario_id es un número válido
  if (isNaN(usuario_id)) {
    return res.status(400).json({ message: 'El ID de usuario no es válido.' });
  }

  if (!id_cursos) {
    return res.status(400).json({ message: 'Faltan datos para eliminar de favoritos' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM favoritos WHERE id_usuarios = $1 AND cursos_id = $2`,
      [usuario_id, id_cursos]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'No se encontró el curso en favoritos' });
    }

    res.status(200).json({ message: 'Curso eliminado de favoritos' });
  } catch (error) {
    console.error('Error al eliminar de favoritos:', error);
    res.status(500).send('Error interno del servidor');
  }
});


// Iniciar el servidor
const server = app.listen(3000, () => {
  console.log(`Servidor corriendo en http://localhost:3000`);
});