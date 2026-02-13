const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const metaTypeRoutes = require('./routes/metaTypes');
const leaveRoutes = require('./routes/leave');
const attendanceRoutes = require('./routes/attendance');
const workFromHomeRoutes = require('./routes/workFromHome');
const performanceWarningRoutes = require('./routes/performanceWarning');
const notificationRoutes = require('./routes/notification');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/employee'));
app.use('/api/payrolls', require('./routes/payroll'));
app.use('/api/payroll-meta-types', metaTypeRoutes);
app.use('/api/leave-requests', leaveRoutes);
app.use('/api/work-from-home', workFromHomeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/performance-warnings', performanceWarningRoutes);
app.use('/api/notifications', notificationRoutes);

module.exports = app;