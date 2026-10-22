# 🏎️ RAAVA LIVE • Deportes y Televisión en Vivo para Stremio

Addon independiente y liviano para **Stremio** que proporciona transmisiones en directo de eventos deportivos (Fórmula 1, WRC, Fútbol, Champions League) y canales 24/7 en Español Latino (ESPN, TUDN, Star+, Fox Sports).

---

## 🚀 Cómo Probar en Local

1. Asegúrate de tener Node.js instalado.
2. Abre una terminal en esta carpeta:
   ```cmd
   cd raava-live
   ```
3. Instala dependencias e inicia el servidor:
   ```cmd
   npm install
   npm start
   ```
4. El servidor se iniciará en el puerto `7001`.
5. En Stremio:
   * Ve al buscador de complementos (arriba a la derecha).
   * Pega la siguiente dirección:
     ```text
     http://127.0.0.1:7001/manifest.json
     ```
   * O abre en tu navegador `http://127.0.0.1:7001` y pulsa **"Instalar en Stremio"**.

---

## 📺 Catálogos Disponibles en Stremio

* **⚽ Partidos y Eventos de Hoy:** Agenda actualizada en tiempo real con competiciones activas (UEFA Champions League, Liga MX, Conmebol, etc.).
* **📺 Canales 24/7:** Señales continuas de ESPN, ESPN México, ESPN 2, TUDN, Disney+ / Star+ Deportes, TNT Sports / Max, Azteca 7 y Win Sports+.

---

## 🌐 Despliegue Gratuito 24/7 en la Nube (Render.com)

1. Sube esta carpeta `raava-live` a un repositorio propio en GitHub.
2. En [Render.com](https://render.com/), crea un nuevo **Web Service**.
3. Conecta el repositorio de `raava-live`.
4. Render detectará automáticamente `render.yaml`:
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
5. Render te dará tu URL HTTPS permanente:
   ```text
   https://tu-servicio.onrender.com/manifest.json
   ```
   ¡Y quedará disponible 24/7 en tu TV, móvil o PC sin tokens ni Discord!
