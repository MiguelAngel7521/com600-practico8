# Práctica 8 · Pipeline CI/CD con GitHub Actions

Miguel Angel Rodriguez Vela · COM-600 Microservicios · Gestión 2/2026.

[Repositorio](https://github.com/MiguelAngel7521/com600-practico8) · [Ejecuciones](https://github.com/MiguelAngel7521/com600-practico8/actions) · [Imagen publicada](https://github.com/users/MiguelAngel7521/packages/container/package/com600-practico8).

Parte 1: laboratorios 0 a 7 sobre el servicio de tareas de la Práctica 7 y el Dockerfile adaptado de la Práctica 2. La Parte 2 sobre el proyecto integrador queda fuera de esta entrega.

## Ejecutar y comprobar

Requisitos: Node.js 22.15 o superior, npm y Docker Engine activo. `.nvmrc` selecciona Node 22. La matriz usa Node 22 y 24: las dependencias heredadas requieren una versión superior a Node 20, usado como ejemplo en el enunciado.

```sh
npm ci
npm run lint
npm run audit
npm run test:cov
npm start
```

Hay 7 suites y 72 pruebas: funciones de negocio, API HTTP, contratos y repositorio con MongoDB real. Testcontainers inicia y elimina un `mongo:7` temporal. `--experimental-vm-modules` permite que Jest cargue los imports dinámicos del driver de MongoDB. El servidor HTTP guarda las tareas en memoria; MongoDB se utiliza para probar el repositorio, no como persistencia del servidor.

```sh
curl -X POST http://localhost:3000/tareas \
  -H 'Content-Type: application/json' -d '{"titulo":"Revisar CI"}'
curl http://localhost:3000/tareas
```

Las suites rápidas se pueden ejecutar con `npm run test:unit` y la integración con `npm run test:int`. CI siempre ejecuta la suite completa; no omite integración para ganar tiempo.

## Qué hace el pipeline

`.github/workflows/ci.yml` responde a `push`, `pull_request` y ejecución manual.

| Job | Trabajo y condición |
| --- | --- |
| `pruebas (22)` y `pruebas (24)` | Checkout, Node, caché npm según el lock, `npm ci` y las 72 pruebas con cobertura. `fail-fast: false` permite ver el resultado de ambas versiones. |
| `calidad` | Ejecuta en paralelo `npm ci`, ESLint sin avisos, comprobación de sintaxis/JSON y auditoría de dependencias. |
| `imagen` | Espera a toda la matriz y a calidad mediante `needs`. Publica solo desde `main`; en ramas y PR queda omitido. |

La cobertura se conserva con `if: always()`, incluso si falla una prueba. Cada versión de Node tiene un artefacto distinto, `cobertura-<node>-<sha>`, con retención de 7 días. La cobertura se calcula durante la misma ejecución de la suite.

El caché npm conserva descargas, no `node_modules`: se sigue instalando reproduciblemente con `npm ci`. Docker Buildx conserva capas en el caché de Actions; la primera ejecución lo crea y las siguientes pueden aprovecharlo. El tiempo total se mide desde el inicio del primer job hasta el fin del último; no se suman los jobs que se solapan.

## Puertas de calidad

- Cobertura global: 80 % de líneas, sentencias y funciones, y 70 % de ramas. Son mínimos heredados de la práctica de pruebas; la suite actual alcanza 100 % en las cuatro métricas.
- ESLint: cero errores y cero avisos; también se valida la sintaxis JavaScript y los contratos JSON.
- Auditoría: bloquea severidad `high` y `critical`. La demostración usa `lodash@4.17.20`, de severidad alta; el umbral `critical` del ejemplo no bastaría para ese caso.

No se impone ausencia absoluta de avisos moderados: el árbol de herramientas de pruebas tiene avisos transitivos que deben revisarse, y aplicar `npm audit fix --force` sin analizar cambios incompatibles no garantiza una corrección adecuada. Los avisos siguen visibles en el registro; no se silencia la auditoría ni se ignora su código de salida.

## Imagen y trazabilidad

```sh
docker build -t tareas:local .
docker pull ghcr.io/miguelangel7521/com600-practico8:latest
docker run --rm -p 127.0.0.1:3008:3000 ghcr.io/miguelangel7521/com600-practico8:latest
curl http://localhost:3008/tareas
```

Cada publicación incluye el SHA completo, la versión de `package.json`, `<version>-ci.<numero-de-corrida>` y `latest`. Para reproducir una entrega se usa el SHA o el digest; `latest` y la etiqueta de versión pueden avanzar con nuevas publicaciones. Las etiquetas OCI `source` y `revision` enlazan repositorio y commit. El nombre de GHCR se convierte a minúsculas.

Solo el job de imagen tiene `packages: write` y se autentica con `secrets.GITHUB_TOKEN`, generado por GitHub. El código no contiene credenciales. Ningún PR publica una imagen.

La imagen de laboratorio conserva las pruebas y sus dependencias, usa `node:22-alpine` y arranca como el usuario `node`. Las 64 pruebas rápidas se pueden ejecutar dentro de la imagen:

```sh
docker run --rm tareas:local npm run test:unit
```

La suite completa se ejecuta en el equipo o runner con acceso al daemon Docker; el contenedor HTTP no necesita ese acceso. Los documentos, credenciales locales, cobertura y `node_modules` del anfitrión se excluyen del contexto Docker.

## Contribuir con main protegida

```sh
git switch main
git pull --ff-only origin main
git switch -c mejora/descripcion-del-cambio
# Editar y comprobar: npm run lint, npm run audit, npm run test:cov
git add <archivos-del-cambio>
git commit -m "Describe el cambio"
git push -u origin mejora/descripcion-del-cambio
```

Abre un pull request hacia `main`. Para fusionarlo deben pasar `pruebas (22)`, `pruebas (24)` y `calidad`, la rama debe estar actualizada y las conversaciones deben estar resueltas. Las reglas también se aplican al administrador. No se permiten force pushes ni eliminación de `main`; un push directo es rechazado. No se exige aprobación de otra cuenta en este repositorio individual, pero sí pasar por PR. Si cambian los nombres de los jobs, deben actualizarse también los checks de protección.

## Demostraciones realizadas

| Laboratorio | Corridas o recurso |
| --- | --- |
| Primer workflow con listado del runner | [Verde](https://github.com/MiguelAngel7521/com600-practico8/actions/runs/38840469855) |
| Suite y cobertura sin caché | [Verde](https://github.com/MiguelAngel7521/com600-practico8/actions/runs/38840566029) |
| Expectativa incorrecta y corrección en la misma rama | [Rojo](https://github.com/MiguelAngel7521/com600-practico8/actions/runs/38841305325) · [Verde](https://github.com/MiguelAngel7521/com600-practico8/actions/runs/38841454932) |
| Dependencia vulnerable y retirada | [Rojo](https://github.com/MiguelAngel7521/com600-practico8/actions/runs/38841402464) · [Verde](https://github.com/MiguelAngel7521/com600-practico8/actions/runs/38841587237) |
| Publicación tras pruebas y calidad | [Verde](https://github.com/MiguelAngel7521/com600-practico8/actions/runs/38841461861) |
| PR bloqueado, corregido y fusionado | [Pull request #1](https://github.com/MiguelAngel7521/com600-practico8/pull/1) |

Medición del caché npm: el paso de instalación bajó de 22 s en la ejecución sin caché a 12 s con un acierto de caché, una reducción observada de 45,45 %. Ambas corridas usan el mismo lock; esta comparación puntual no garantiza tiempos idénticos en otros runners.

La Hoja de Evidencias, sus capturas y los registros de soporte se conservan localmente en esta carpeta. La comparación final del Laboratorio 7 está en la hoja, con enlaces a las corridas usadas.

Referencias: [caché de setup-node](https://github.com/actions/setup-node), [artefactos](https://github.com/actions/upload-artifact), [Buildx](https://github.com/docker/build-push-action) y [configuración de ESLint](https://eslint.org/docs/latest/use/configure/configuration-files).
