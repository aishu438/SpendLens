const bcrypt           = require('bcryptjs');
const { query, run, lastId } = require('../config/db');

const User = {

  async create({ name, email, password }) {
    const salt         = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    run(
      `INSERT INTO users (name, email, passwordHash) VALUES (?, ?, ?)`,
      [name, email, passwordHash]
    );

    return User.findById(lastId());
  },

  findById(id) {
    const rows = query(
      `SELECT id, name, email, budget, createdAt FROM users WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  findByEmail(email) {
    const rows = query(
      `SELECT id, name, email, budget, passwordHash, createdAt FROM users WHERE email = ?`,
      [email]
    );
    return rows[0] || null;
  },

  updateBudget(id, budget) {
    run(`UPDATE users SET budget = ? WHERE id = ?`, [budget, id]);
    return User.findById(id);
  },

  updateProfile(id, { name }) {
    run(`UPDATE users SET name = ? WHERE id = ?`, [name, id]);
    return User.findById(id);
  },

  async matchPassword(plainPassword, passwordHash) {
    return bcrypt.compare(plainPassword, passwordHash);
  },

};

module.exports = User;
