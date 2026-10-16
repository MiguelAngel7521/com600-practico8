const app = require('./app');
const puerto = Number(process.env.PORT || 3000);
app.listen(puerto, () => console.log(`API de tareas en http://localhost:${puerto}`));
