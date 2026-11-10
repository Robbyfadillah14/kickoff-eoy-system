require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth.routes");
const departmentRoutes = require("./routes/department.routes");
const plantRoutes = require("./routes/plant.routes");
const reportRoutes = require("./routes/report.routes");
const commentRoutes = require("./routes/comment.routes");
const auditRoutes = require("./routes/audit.routes");
const { initSockets } = require("./sockets");
const { startLockScheduler } = require("./jobs/lockScheduler");

const app = express();

// Konfigurasi CORS bersih tanpa karakter tersembunyi
app.use(cors({ 
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"], 
  credentials: true 
}));

// Ditambahkan limit 50mb untuk mengatasi error Payload Too Large (413)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/uploads", express.static("uploads"));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/plants", plantRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/audit-logs", auditRoutes);

const server = http.createServer(app);

const io = new Server(server, { 
  cors: { 
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true 
  } 
});

app.set("io", io); 
initSockets(io);
startLockScheduler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Backend jalan di port ${PORT}`));