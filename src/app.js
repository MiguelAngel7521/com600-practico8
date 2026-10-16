const express = require('express');
const { estadoDeTarea } = require('./tarea');

function crearApp() {
  const app = express();
  const tareas = [];
  app.use(express.json());
  app.post('/tareas', (req, res) => {
    if (typeof req.body?.titulo !== 'string' || !req.body.titulo.trim()) {
      return res.status(400).json({ error: 'titulo es obligatorio' });
    }
    const tarea = { ...req.body, titulo: req.body.titulo.trim(), id: tareas.length + 1, completada: false };
    tareas.push(tarea);
    return res.status(201).json(tarea);
  });
  app.get('/tareas', (_req, res) => res.json(
    tareas.map(tarea => ({ ...tarea, estado: estadoDeTarea(tarea) }))
  ));
  return app;
}

module.exports = crearApp();
module.exports.crearApp = crearApp;
