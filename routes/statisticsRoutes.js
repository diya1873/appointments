// routes/statisticsRoutes.js

const express = require('express');
const router = express.Router();
const { getAppointmentStatistics } = require('../controllers/statisticsController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');
// إحصائيات المواعيد فقط للمسؤول
router.get('/appointments/stats', protect, isAdmin, getAppointmentStatistics);

module.exports = router;
