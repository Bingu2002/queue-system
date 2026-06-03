require('dotenv').config();
const express    = require('express');
const http       = require('http');
const cors       = require('cors');
const { Server } = require('socket.io');
const connectDB  = require('./config/db');

connectDB();

const app    = express();
const server = http.createServer(app);

// --- Socket.io setup ---
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Make io available inside controllers via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {

  // Citizen joins a queue room: they'll receive 'queue-update' events live
  // Room name: "queue:<officeId>:<serviceId>"
  socket.on('join-queue', ({ officeId, serviceId }) => {
    socket.join(`queue:${officeId}:${serviceId}`);
  });

  // Citizen joins their personal token room for the "3 away" alert
  // Room name: "token:<tokenId>"
  socket.on('join-token', ({ tokenId }) => {
    socket.join(`token:${tokenId}`);
  });

  socket.on('disconnect', () => {});
});

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use('/api/auth',    require('./routes/auth.routes'));
app.use('/api/offices', require('./routes/office.routes'));
app.use('/api/admin',   require('./routes/admin.routes'));
app.use('/api/tokens',  require('./routes/token.routes'));
app.use('/api/queue',   require('./routes/queue.routes'));

app.get('/', (req, res) => res.json({ message: 'GovQueue API running ✓' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} ✓`));