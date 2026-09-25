const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Conexión a la base de datos MySQL en Aiven
const conexion = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'defaultdb',
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : false
});

conexion.connect((err) => {
  if (err) {
    console.error('Error de conexión a la BD: ', err);
    return;
  }
  console.log('Conectado a MySQL exitosamente');
});

// Ruta raíz para verificación
app.get('/', (req, res) => {
  res.send('API Backend de Cafetería Funcionando Correctamente');
});

// --- FUNCIONES CONTROLADORAS ---
const obtenerEstudiantes = (req, res) => {
  conexion.query('SELECT * FROM estudiantes', (err, resultados) => {
    if (err) return res.status(500).json(err);
    res.json(resultados);
  });
};

const obtenerProductos = (req, res) => {
  conexion.query('SELECT * FROM productos', (err, resultados) => {
    if (err) return res.status(500).json(err);
    res.json(resultados);
  });
};

const registrarVenta = (req, res) => {
  const { estudiante_id, producto_id, cantidad, fecha } = req.body;
  const sql = 'INSERT INTO ventas (estudiante_id, producto_id, cantidad, fecha) VALUES (?, ?, ?, ?)';
  
  conexion.query(sql, [estudiante_id, producto_id, cantidad, fecha], (err, resultado) => {
    if (err) return res.status(500).json(err);
    res.send('Venta registrada con éxito');
  });
};

// --- RUTAS (Mapeadas con y sin /api para compatibilidad total) ---
app.get('/estudiantes', obtenerEstudiantes);
app.get('/api/estudiantes', obtenerEstudiantes);

app.get('/productos', obtenerProductos);
app.get('/api/productos', obtenerProductos);

app.post('/ventas', registrarVenta);
app.post('/api/ventas', registrarVenta);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});