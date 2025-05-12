require('dotenv').config();
const express = require('express');
const http = require('http'); // استدعاء http لإنشاء السيرفر
const { Server } = require('socket.io'); // استدعاء مكتبة socket.io
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const appointmentRoutes = require('./routes/appointmentRoutes');
const userRoutes = require('./routes/userRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');

const app = express();
const server = http.createServer(app); // إنشاء سيرفر HTTP
const io = new Server(server, {
    cors: {
        origin: "*", // السماح لجميع المصادر بالاتصال (يمكنك تحديد نطاق معين)
        methods: ["GET", "POST"]
    }
});

// نشر الصور من مجلد 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// اتصال قاعدة البيانات
connectDB();
// فعل CORS
app.use(cors());
// ميدلويرات
app.use(express.json());

// تمرير WebSocket إلى الطلبات
app.use((req, res, next) => {
    req.io = io; // إضافة io إلى الطلبات لاستخدامه لاحقًا
    next();
});

// الروتات
app.use('/api/appointments', appointmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statistics', statisticsRoutes);

// إعداد WebSocket
io.on("connection", (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
        console.log(`⚡ Client disconnected: ${socket.id}`);
    });

    // اختبار الاتصال
    socket.on("test", (data) => {
        console.log("Test message received:", data);
        socket.emit("testResponse", { message: "WebSocket is working!" });
    });
});

// تشغيل السيرفر
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
