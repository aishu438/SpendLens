const { query, run, lastId } = require('../config/db');

const Expense = {

  create({ userId, desc, amount, date, category = 'Other', note = '' }) {
    run(
      `INSERT INTO expenses (userId, desc, amount, date, category, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, desc, amount, date, category, note]
    );
    return Expense.findById(lastId(), userId);
  },

  findById(id, userId) {
    const rows = query(
      `SELECT * FROM expenses WHERE id = ? AND userId = ?`,
      [id, userId]
    );
    return rows[0] || null;
  },

  findAll({ userId, month, category, page = 1, limit = 50 }) {
    let sql    = `SELECT * FROM expenses WHERE userId = ?`;
    let countSql = `SELECT COUNT(*) as total FROM expenses WHERE userId = ?`;
    const params = [userId];
    const countParams = [userId];

    if (month) {
      sql      += ` AND date LIKE ?`;
      countSql += ` AND date LIKE ?`;
      params.push(`${month}%`);
      countParams.push(`${month}%`);
    }
    if (category) {
      sql      += ` AND category = ?`;
      countSql += ` AND category = ?`;
      params.push(category);
      countParams.push(category);
    }

    const offset = (Number(page) - 1) * Number(limit);
    sql += ` ORDER BY date DESC, id DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const expenses = query(sql, params);
    const total    = query(countSql, countParams)[0]?.total || 0;

    return { expenses, total };
  },

  update(id, userId, fields) {
    const allowed = ['desc', 'amount', 'date', 'category', 'note'];
    const updates = allowed.filter(f => fields[f] !== undefined);
    if (!updates.length) return Expense.findById(id, userId);

    const setClause = updates.map(f => `${f} = ?`).join(', ');
    const values    = updates.map(f => fields[f]);
    run(
      `UPDATE expenses SET ${setClause} WHERE id = ? AND userId = ?`,
      [...values, id, userId]
    );
    return Expense.findById(id, userId);
  },

  delete(id, userId) {
    const expense = Expense.findById(id, userId);
    if (!expense) return null;
    run(`DELETE FROM expenses WHERE id = ? AND userId = ?`, [id, userId]);
    return expense;
  },

  summary({ userId, month }) {
    let sql    = `SELECT category, SUM(amount) as total, COUNT(*) as count
                  FROM expenses WHERE userId = ?`;
    const params = [userId];

    if (month) {
      sql += ` AND date LIKE ?`;
      params.push(`${month}%`);
    }

    sql += ` GROUP BY category ORDER BY total DESC`;

    const categories = query(sql, params);
    const grandTotal = categories.reduce((s, c) => s + c.total, 0);
    return { grandTotal, categories };
  },

};

module.exports = Expense;
