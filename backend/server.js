const express  = require('express');
const cors     = require('cors');
require('dotenv').config();

const { connectDB }  = require('./config/db');
const errorHandler   = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',     require('./routes/authRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/user',     require('./routes/userRoutes'));

app.get('/', (req, res) => res.json({ message: 'SpendLens API is running' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`✅  Server running on port ${PORT}`));
}).catch(err => {
  console.error('❌  Failed to start:', err.message);
  process.exit(1);
});