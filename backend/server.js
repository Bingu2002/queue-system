require('dotenv').config();
const express   = require('express');
const http      = require('http');
const cors      = require('cors');
const connectDB = require('./config/db');

connectDB();

const app    = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use('/api/auth',    require('./routes/auth.routes'));
app.use('/api/offices', require('./routes/office.routes'));
app.use('/api/admin',   require('./routes/admin.routes'));

app.get('/', (req, res) => res.json({ message: 'GovQueue API running ✓' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} ✓`));