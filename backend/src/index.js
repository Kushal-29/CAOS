require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');

const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const taskRoutes = require('./routes/task.routes');
const documentRoutes = require('./routes/document.routes');
const credentialRoutes = require('./routes/credential.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const filingRoutes = require('./routes/filing.routes');
const searchRoutes = require('./routes/search.routes');
const notificationRoutes = require('./routes/notification.routes');
const activityRoutes = require('./routes/activity.routes');
const gstRoutes = require('./routes/gst.routes');
const itrRoutes = require('./routes/itr.routes');
const employeeRoutes = require('./routes/employee.routes');
const followupRoutes = require('./routes/followup.routes');
const revenueRoutes = require('./routes/revenue.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', apiLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'caos-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/filings', filingRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/gst', gstRoutes);
app.use('/api/itr', itrRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`CAOS backend listening on port ${PORT}`);
});

module.exports = app;
