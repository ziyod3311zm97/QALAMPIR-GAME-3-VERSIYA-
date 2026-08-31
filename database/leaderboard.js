const { pool } = require("./db");


/* =====================================================
   BALANCE BO'YICHA LEADERBOARD
===================================================== */

async function getLeaderboard(limit = 20) {
  const safeLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const result = await pool.query(
    `
    SELECT
      id,
      username,
      first_name,
      balance,
      wins,
      losses,
      streak,
      level,
      xp
    FROM users
    WHERE is_banned = false
    ORDER BY balance DESC, id ASC
    LIMIT $1
    `,
    [safeLimit]
  );

  return result.rows;
}


/* =====================================================
   USERNING BALANCE REYTINGI
===================================================== */

async function getUserRank(userId) {
  const result = await pool.query(
    `
    WITH ranked_users AS (
      SELECT
        id,
        balance,
        RANK() OVER (
          ORDER BY balance DESC
        )::int AS rank
      FROM users
      WHERE is_banned = false
    )

    SELECT
      id,
      balance,
      rank
    FROM ranked_users
    WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0] || {
    id: userId,
    balance: 0,
    rank: null
  };
}


/* =====================================================
   WIN BO'YICHA LEADERBOARD
===================================================== */

async function getWinsLeaderboard(limit = 20) {
  const safeLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const result = await pool.query(
    `
    SELECT
      id,
      username,
      first_name,
      wins,
      losses,
      streak,
      level,
      xp
    FROM users
    WHERE is_banned = false
    ORDER BY wins DESC, streak DESC, id ASC
    LIMIT $1
    `,
    [safeLimit]
  );

  return result.rows;
}


/* =====================================================
   LEVEL BO'YICHA LEADERBOARD
===================================================== */

async function getLevelLeaderboard(limit = 20) {
  const safeLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const result = await pool.query(
    `
    SELECT
      id,
      username,
      first_name,
      level,
      xp,
      balance,
      wins,
      losses
    FROM users
    WHERE is_banned = false
    ORDER BY level DESC, xp DESC, id ASC
    LIMIT $1
    `,
    [safeLimit]
  );

  return result.rows;
}


/* =====================================================
   STREAK BO'YICHA LEADERBOARD
===================================================== */

async function getStreakLeaderboard(limit = 20) {
  const safeLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const result = await pool.query(
    `
    SELECT
      id,
      username,
      first_name,
      streak,
      wins,
      level
    FROM users
    WHERE is_banned = false
    ORDER BY streak DESC, wins DESC, id ASC
    LIMIT $1
    `,
    [safeLimit]
  );

  return result.rows;
}


/* =====================================================
   EXPORT
===================================================== */

module.exports = {
  getLeaderboard,
  getUserRank,
  getWinsLeaderboard,
  getLevelLeaderboard,
  getStreakLeaderboard
};
