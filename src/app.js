const adminRoutes = require('./routes/admin');
const streamRoutes = require('./routes/stream');

app.use('/api/admin', adminRoutes);
app.use('/api/stream', streamRoutes); 