const admin = require("firebase-admin");

const serviceAccount = require("./firebaseAdmin.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const express = require("express");
const http = require("http");
const path = require("path");
const os = require("os");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Socket opcional (puedes quitarlo si quieres)
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

const PORT = process.env.PORT || 3000;

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   ARCHIVOS ESTÁTICOS
========================= */
app.use(express.static(path.join(__dirname)));

/* =========================
   HELPERS
========================= */
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
            const isIPv4 = net.family === "IPv4" || net.family === 4;

            if (isIPv4 && !net.internal) {
                if (
                    !net.address.startsWith("169.") &&
                    !net.address.startsWith("127.")
                ) {
                    return net.address;
                }
            }
        }
    }

    return "localhost";
}

function getNowISO() {
    return new Date().toISOString();
}

/* =========================
   USUARIOS DEMO
========================= */
const usuariosDemo = [
    { username: "admin", role: "Administrador", password: "1234", nombre: "Administrador CVM" },
    { username: "coordinador", role: "Coordinador", password: "1234", nombre: "Coordinador CVM" },
    { username: "tecnico1", role: "Técnico", password: "1234", nombre: "Técnico Principal" },
];

/* =========================
   SOCKET.IO (OPCIONAL)
========================= */
io.on("connection", (socket) => {
    console.log("🔌 Cliente conectado:", socket.id);

    socket.on("registrarUsuario", (data) => {
        const username = data?.username;

        if (username) {
            socket.join(`user:${username}`);
            console.log(`👤 Usuario conectado: ${username}`);
        }

        socket.emit("conexionOK", {
            ok: true,
            socketId: socket.id,
            fecha: getNowISO(),
        });
    });

    socket.on("disconnect", () => {
        console.log("❌ Cliente desconectado:", socket.id);
    });
});

/* =========================
   RUTAS API
========================= */
// 🔥 ASIGNAR ROLE (FIREBASE ADMIN)
app.post("/set-role", async (req, res) => {
    const { uid, role } = req.body;

    try {
        await admin.auth().setCustomUserClaims(uid, { role });

        res.json({ ok: true, message: "Rol asignado correctamente" });
    } catch (error) {
        console.error("ERROR SET ROLE:", error);
        res.status(500).json({ ok: false, error: error.message });
    }
});
/* --- Health --- */
app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        app: "CVM CMMS",
        version: "3.0.0",
        fecha: getNowISO(),
    });
});
const { translate } = require('@vitalets/google-translate-api');

app.post("/api/translate", async (req, res) => {
    const { text, target } = req.body;

    try {
        if (!text) {
            return res.json({ translated: "" });
        }

        const result = await translate(text, { to: target || "zh-CN" });

        return res.json({ translated: result.text });

    } catch (err) {
        console.error("ERROR TRADUCCIÓN:", err);

        return res.json({ translated: text });
    }
});
/* --- Login demo --- */
app.post("/api/login", (req, res) => {
    const { username, password } = req.body || {};

    const user = usuariosDemo.find(
        (u) =>
            u.username.toLowerCase() === String(username || "").toLowerCase() &&
            u.password === String(password || "")
    );

    if (!user) {
        return res.status(401).json({
            ok: false,
            message: "Usuario o contraseña incorrectos",
        });
    }

    res.json({
        ok: true,
        message: "Login correcto",
        user: {
            username: user.username,
            role: user.role,
            nombre: user.nombre,
        },
    });
});

/* --- Info del servidor --- */
app.get("/api/server-info", (req, res) => {
    const ip = getLocalIPAddress();
    const url = `http://${ip}:${PORT}`;

    res.json({
        ok: true,
        ip,
        port: PORT,
        url,
        usuariosDemo: usuariosDemo.map((u) => ({
            username: u.username,
            role: u.role,
        })),
    });
});

/* =========================
   RUTA PRINCIPAL
========================= */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

/* =========================
   INICIAR SERVIDOR
========================= */
server.listen(PORT, "0.0.0.0", () => {
    const ip = getLocalIPAddress();

    console.log("======================================");
    console.log("🚀 CMMS iniciado correctamente");
    console.log(`💻 Local:   http://localhost:${PORT}`);
    console.log(`📱 Móvil:   http://${ip}:${PORT}`);
    console.log("👤 Usuarios demo:");
    console.log("   - admin / 1234");
    console.log("   - coordinador / 1234");
    console.log("   - tecnico1 / 1234");
    console.log("======================================");
});