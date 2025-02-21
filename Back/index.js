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