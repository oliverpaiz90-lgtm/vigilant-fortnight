require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); // Habilitar CORS para permitir llamadas desde Vercel

// Pool de conexión optimizado con soporte SSL para Aiven
const conexion = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: { rejectUnauthorized: false }, // Permite la conexión cifrada requerida por Aiven
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// GET /ventas (JOIN múltiple)
app.get('/ventas', (req, res) => {
  const sql = `
    SELECT v.id, e.nombre AS estudiante, p.nombre AS producto,
           v.cantidad, v.fecha, p.precio, (v.cantidad * p.precio) AS total,
           v.estudiante_id, v.producto_id
    FROM ventas v
    INNER JOIN estudiantes e ON v.estudiante_id = e.id
    INNER JOIN productos p ON v.producto_id = p.id
  `;
  conexion.query(sql, (err, resultados) => {
    if (err) {
      console.error('Error al obtener ventas:', err);
      return res.status(500).json({ error: 'Error al consultar las ventas' });
    }
    res.json(resultados);
  });
});

// GET /estudiantes
app.get('/estudiantes', (req, res) => {
  conexion.query('SELECT * FROM estudiantes', (err, resultados) => {
    if (err) {
      console.error('Error al obtener estudiantes:', err);
      return res.status(500).json({ error: 'Error al consultar estudiantes' });
    }
    res.json(resultados);
  });
});

// GET /productos
app.get('/productos', (req, res) => {
  conexion.query('SELECT * FROM productos', (err, resultados) => {
    if (err) {
      console.error('Error al obtener productos:', err);
      return res.status(500).json({ error: 'Error al consultar productos' });
    }
    res.json(resultados);
  });
});

// POST /ventas
app.post('/ventas', (req, res) => {
  const { estudiante_id, producto_id, cantidad, fecha } = req.body;
  
  // Si no envían fecha, usa la fecha/hora actual en formato ISO/MySQL
  const fechaFinal = fecha ? new Date(fecha) : new Date();

  conexion.query(
    'INSERT INTO ventas (estudiante_id, producto_id, cantidad, fecha) VALUES (?, ?, ?, ?)',
    [estudiante_id, producto_id, cantidad, fechaFinal],
    (err, result) => {
      if (err) {
        console.error('Error al insertar venta:', err);
        return res.status(500).json({ error: 'Error al registrar la venta' });
      }
      res.status(201).json({ message: 'Venta registrada correctamente', id: result.insertId });
    }
  );
});

// PUT /ventas/:id
app.put('/ventas/:id', (req, res) => {
  const id = req.params.id;
  const { estudiante_id, producto_id, cantidad, fecha } = req.body;
  
  const fechaFinal = fecha ? new Date(fecha) : new Date();

  conexion.query(
    'UPDATE ventas SET estudiante_id=?, producto_id=?, cantidad=?, fecha=? WHERE id=?',
    [estudiante_id, producto_id, cantidad, fechaFinal, id],
    (err) => {
      if (err) {
        console.error('Error al actualizar venta:', err);
        return res.status(500).json({ error: `Error al actualizar la venta con ID ${id}` });
      }
      res.json({ message: `Venta con ID ${id} actualizada` });
    }
  );
});

// DELETE /ventas/:id
app.delete('/ventas/:id', (req, res) => {
  const id = req.params.id;
  conexion.query('DELETE FROM ventas WHERE id=?', [id], (err) => {
    if (err) {
      console.error('Error al eliminar venta:', err);
      return res.status(500).json({ error: `Error al eliminar la venta con ID ${id}` });
    }
    res.json({ message: `Venta con ID ${id} eliminada` });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en el puerto ${PORT}`);
});