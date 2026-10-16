# Práctica 8 · Parte 1 · Hasta el Laboratorio 1

Rodriguez Vela Miguel Angel · COM-600 Microservicios · 15/10/2026.

Repositorio: <https://github.com/MiguelAngel7521/com600-practico8>.

Este proyecto completa el punto de partida del **Laboratorio 0** y el primer workflow del **Laboratorio 1**. El único job de GitHub Actions es `verificar`: trae el código y muestra el commit, la rama y los archivos con `ls -la`. La automatización de pruebas y la publicación de imágenes corresponden a los laboratorios posteriores.

## Ver el `ls -la` en GitHub

1. Abre [Actions](https://github.com/MiguelAngel7521/com600-practico8/actions).
2. Abre la ejecución más reciente del workflow **CI**.
3. En **Jobs**, pulsa **verificar**.
4. Despliega **Comprobar que el mecanismo funciona (ls -la)**.
5. Verás el commit, la rama, el directorio del runner y los listados de la raíz, `src/` y `tests/`.

El mismo listado también aparece en el **Summary / Resumen** de esa ejecución. GitHub puede dejar contraídos los pasos que terminan bien: pulsa la flecha del paso para abrir el registro. Necesitas iniciar sesión en GitHub para acceder a los logs.

## Qué se incorporó de las prácticas anteriores

| Origen en tu equipo | Destino aquí | Qué se hizo |
| --- | --- | --- |
| `../practica7-pruebas/src/` | `src/` | Se copiaron el servicio, las funciones y los contratos JSON. |
| `../practica7-pruebas/src/test/` | `tests/` | Se copiaron las siete suites; se ajustaron sus imports a `../src/`. |
| `../practica7-pruebas/package.json` | `package.json` | Se conservaron scripts y dependencias, se cambió el nombre del proyecto y se completó Testcontainers. |
| `../practica7-pruebas/package-lock.json` | `package-lock.json` | Se completó el lock con las dependencias faltantes para permitir `npm ci`. |
| `../practica7-pruebas/jest.config.js` | `jest.config.js` | Se configuró `tests/` y la salida de cobertura en `coverage/`. |
| `../practica7-pruebas/analizar.cjs` y `verificar-mongo.cjs` | Raíz del proyecto | Se conservaron las utilidades; el análisis también recorre `tests/`. |
| `../Practica 2/Parte 1/api/dockerfile` | `Dockerfile` | Se adaptó la receta al servicio de la práctica 7 y a sus pruebas. |

Las carpetas originales de las prácticas 2 y 7 se conservaron. Esta carpeta es autónoma: no usa rutas hacia esas carpetas al ejecutar el servicio, las pruebas ni el build.

La práctica 7 tenía un pendiente documentado: faltaban `@testcontainers/mongodb` y `testcontainers` en el lock. Aquí se instalaron ambos en la versión `12.2.1`. La suite de integración utiliza MongoDB real en un contenedor temporal. También se habilitó `--experimental-vm-modules` en los scripts de Jest: el driver MongoDB 7.7 carga `os` mediante un import dinámico, y sin esa opción Jest impedía cargarlo y MongoDB rechazaba la conexión. La configuración permite ejecutar el driver real sin alterar las pruebas. Véase la [guía oficial de Jest](https://jestjs.io/docs/ecmascript-modules).

## Preparar y probar en tu computadora

Requisitos: Node.js **22.15 o superior**, npm y Docker Engine activo. La primera instalación requiere Internet. `.nvmrc` selecciona la rama 22 si utilizas nvm. El enunciado usa Node 20 en sus ejemplos, pero las dependencias de tu práctica 7 requieren una versión superior.

Desde `practica8-cicd`:

```sh
git --version
git config --global user.name
git config --global user.email
node --version
docker --version

npm ci
npm test
docker build -t tareas:local .
```

`npm ci` instala lo fijado por el lock y falla si no coincide con el manifiesto. `npm test` ejecuta las siete suites, incluida integración con MongoDB. Testcontainers inicia y elimina el MongoDB temporal; no hay que iniciar los contenedores de las prácticas anteriores.

Comandos de consulta:

```sh
ls -la
ls -la src tests
cat Dockerfile
cat .github/workflows/ci.yml
npm run test:unit
npm run test:int
```

El nombre heredado `test:unit` incluye las pruebas rápidas unitarias, HTTP y contratos; excluye únicamente la integración con MongoDB. `npm run lint` conserva la comprobación de sintaxis de la práctica 7; no es ESLint.

## Qué hay dentro de tu imagen Docker

`docker build -t tareas:local .` crea una imagen local llamada `tareas:local`. El punto final indica que esta carpeta es el contexto de construcción.

El `Dockerfile` hace lo siguiente:

1. `FROM node:22-alpine` aporta Linux Alpine, Node.js y npm compatibles con el proyecto.
2. `WORKDIR /app` establece el directorio de trabajo dentro de la imagen.
3. `COPY package.json package-lock.json ./` incorpora los manifiestos.
4. `RUN npm ci --no-audit --no-fund` instala las dependencias fijadas, incluidas las de pruebas.
5. Los siguientes `COPY` incorporan `src/`, `tests/`, Jest y las utilidades del proyecto.
6. `USER node` ejecuta el proceso sin privilegios de administrador.
7. `EXPOSE 3000` documenta el puerto interno; `-p` lo publica al arrancar el contenedor.
8. `CMD ["npm", "start"]` inicia `node src/server.js`.

Es una **imagen de laboratorio con las pruebas incluidas**. Dentro están `/app/src`, `/app/tests`, `/app/node_modules` y los archivos de configuración. `.dockerignore` excluye dependencias locales, credenciales, metadatos Git y documentos del contexto. No se copió el contenido de todo tu equipo ni se depende de un volumen de las prácticas anteriores.

### Arrancar la API y entrar al contenedor

Se usa el puerto **3008** de tu computadora porque el 3000 ya estaba ocupado:

```sh
docker run -d --name practica8-api -p 127.0.0.1:3008:3000 tareas:local
docker ps --filter name=practica8-api
docker logs practica8-api
curl http://localhost:3008/tareas
```

Si el contenedor `practica8-api` ya existe y está detenido, usa `docker start practica8-api`. Si está funcionando, entra directamente:

```sh
docker exec -it practica8-api sh
```

Ya dentro, ejecuta:

```sh
pwd
ls -la
ls -la src tests
cat package.json
exit
```

`pwd` muestra `/app`. `exit` cierra esa terminal; el servidor sigue funcionando. Para detenerlo: `docker stop practica8-api`. Para iniciarlo otra vez: `docker start practica8-api`.

También puedes inspeccionar la imagen sin dejar un servidor funcionando:

```sh
docker run --rm -it tareas:local sh
```

Para ejecutar las 64 pruebas rápidas dentro de un contenedor temporal:

```sh
docker run --rm tareas:local npm run test:unit
```

La suite completa se ejecuta con `npm test` **en tu computadora**, donde tiene acceso a Docker. El contenedor de la API no tiene conexión al daemon Docker del anfitrión; tener Testcontainers instalado en la imagen no le da ese acceso. Por eso `npm test` dentro de ese contenedor necesita configuración adicional, que no forma parte de este laboratorio.

La API conserva tareas en memoria: reiniciar el contenedor vacía la lista. MongoDB se usa en las pruebas de `repositorio.js`; el servidor HTTP no está conectado a esa base.

## Cómo entrar a las carpetas originales

Desde `practica8-cicd`, abre otra terminal para consultar:

```sh
# Dockerfile original de la práctica 2
cd "../Practica 2/Parte 1/api"
ls -la
cat dockerfile
```

O, nuevamente desde `practica8-cicd`:

```sh
# Pruebas originales de la práctica 7
cd ../practica7-pruebas
ls -la src/test
```

Las pruebas preparadas para este laboratorio están en **`practica8-cicd/tests/`**. Ejecuta aquí los comandos de validación; las correcciones de dependencias se hicieron en esta copia.

## Qué hace el job `verificar`

El archivo `.github/workflows/ci.yml` se dispara con `push` y `pull_request`.

| Elemento | Función |
| --- | --- |
| `runs-on: ubuntu-latest` | GitHub asigna una máquina Ubuntu nueva para el job. |
| `actions/checkout@v4` | Descarga el código del commit dentro del runner. |
| `echo` | Muestra el commit, la rama y el directorio. |
| `ls -la` | Lista los archivos del repositorio, incluidos los ocultos. |
| `ls -la src tests` | Permite comprobar que también llegaron el código y las pruebas. |
| `GITHUB_STEP_SUMMARY` | Guarda el listado como un resumen visible en la corrida. |
| `permissions: contents: read` | Permite leer el repositorio con el token del workflow. |

Hay tres lugares distintos: tu carpeta local, el contenedor creado desde `tareas:local` y la máquina temporal de GitHub. En este laboratorio GitHub obtiene los archivos mediante `checkout`; el job **no utiliza tu imagen Docker local**. La imagen se construye localmente para cumplir el Laboratorio 0. Su publicación en un registro se realiza en un laboratorio posterior.

Para que GitHub vea una modificación hay que confirmarla y subirla:

```sh
git add .github/workflows/ci.yml Dockerfile .dockerignore .gitignore .nvmrc package.json package-lock.json jest.config.js analizar.cjs verificar-mongo.cjs src tests README.md evidencias/RESPUESTAS.md
git commit -m "Parte 1: completar laboratorios 0 y 1"
git push origin main
```

Estos comandos son para cambios nuevos. Si `git status` indica que no hay cambios, ya están confirmados. No necesitas crear otro repositorio ni volver a ejecutar `git init`.

## Respuestas y evidencias

En [evidencias/RESPUESTAS.md](evidencias/RESPUESTAS.md) están respondidas **solo las preguntas 1 y 2**, junto con las indicaciones de las capturas 1 a 4. Los registros de validación local quedan en `evidencias/*.log` y no se versionan.

El PDF del enunciado dice que las respuestas y capturas se entregan en la **Hoja de Evidencias**. Como esa plantilla de la práctica 8 no estaba en la carpeta, las respuestas se dejan en un documento independiente para trasladarlas a ella.

Referencias: [runners alojados por GitHub](https://docs.github.com/en/actions/concepts/runners/github-hosted-runners), [consulta de los logs](https://docs.github.com/en/actions/how-tos/monitor-workflows/use-workflow-run-logs) y [contexto de construcción Docker](https://docs.docker.com/build/concepts/context/).
