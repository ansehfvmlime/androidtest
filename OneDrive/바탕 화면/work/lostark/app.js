require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const path = require('path');

const pageRoutes = require('./routes/page');
const apiRoutes = require('./routes/apiCharacters');


const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use(morgan('dev'));
app.use('/', pageRoutes);
app.use('/api', apiRoutes);

// Health (선택)
app.get('/health', (req, res) => res.json({ ok: true }));

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  const status = err.status || 500;
  res.status(status).send(`Error ${status}: ${err.message}`);
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`✅ Server running: http://localhost:${port}`);
});
