const { pool } = require("../database/db");
/* =====================================================
   STAR RACE SOZLAMALARI
===================================================== */

const STAR_RACE_DURATION_HOURS = 24;

// Kunlik jami mukofot fondi.
// Keyingi bosqichda Telegram Stars bilan bog'lanadi.
const STAR_RACE_PRIZE_POOL = 250;


/*
 * 250 ⭐ taqsimoti
 *
 * 1-o'rin  → 80 ⭐
 * 2-o'rin  → 50 ⭐
 * 3-o'rin  → 30 ⭐
 * 4-o'rin  → 20 ⭐
 * 5-o'rin  → 15 ⭐
 * 6-o'rin  → 12 ⭐
 * 7-o'rin  → 10 ⭐
 * 8-o'rin  → 9 ⭐
 * 9-o'rin  → 8 ⭐
 * 10-o'rin → 6 ⭐
 *
 * Jami = 240 ⭐
 *
 * Qolgan 10 ⭐ keyingi bosqichda
 * maxsus bonus / tenglashtirish mexanizmi
 * uchun ishlatiladi.
 */

const STAR_RACE_REWARDS = [
  { position: 1, stars: 80 },
  { position: 2, stars: 50 },
  { position: 3, stars: 30 },
  { position: 4, stars: 20 },
  { position: 5, stars: 15 },
  { position: 6, stars: 12 },
  { position: 7, stars: 10 },
  { position: 8, stars: 9 },
  { position: 9, stars: 8 },
  { position: 10, stars: 6 }
];


/* =====================================================
   KEYINGI RACE BOSHLANISHI
===================================================== */

/*
 * Hozircha UTC bo'yicha 00:00 asosida ishlaydi.
 *
 * Keyinchalik server timezone emas,
 * aniq race_start / race_end timestamp
 * database'da saqlanadi.
 */

function getNextRaceStart() {

  const now = new Date();

  const next = new Date(now);

  next.setUTCHours(
    24,
    0,
    0,
    0
  );

  return next;
}


/* =====================================================
   RACE HOLATI
===================================================== */

function getRaceStatus() {

  const now = new Date();

  const start = new Date(now);

  start.setUTCHours(
    0,
    0,
    0,
    0
  );

  const end = new Date(start);

  end.setUTCHours(
    24,
    0,
    0,
    0
  );

  const remainingMs =
    Math.max(
      0,
      end.getTime() - now.getTime()
    );

  return {
    active: remainingMs > 0,

    startAt: start.toISOString(),

    endAt: end.toISOString(),

    remainingMs,

    remainingSeconds:
      Math.floor(
        remainingMs / 1000
      ),

    prizePool:
      STAR_RACE_PRIZE_POOL
  };
}


/* =====================================================
   QANCHA VAQT QOLGAN?
===================================================== */

function getRemainingTime() {

  const status =
    getRaceStatus();

  const totalSeconds =
    status.remainingSeconds;

  const hours =
    Math.floor(
      totalSeconds / 3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );

  const seconds =
    totalSeconds % 60;

  return {
    hours,
    minutes,
    seconds,

    totalSeconds,

    formatted:
      `${String(hours).padStart(2, "0")}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(seconds).padStart(2, "0")}`
  };
}


/* =====================================================
   STAR RACE LEADERBOARD
===================================================== */

async function getStarRaceLeaderboard(
  limit = 10
) {

  const safeLimit = Math.min(
    Math.max(
      Number(limit) || 10,
      1
    ),
    100
  );

  /*
   * Hozirgi score:
   * foydalanuvchining referral soni.
   *
   * Keyinchalik daily race statistikasi
   * alohida jadvalga o'tkaziladi.
   */

  const result = await pool.query(
    `
    SELECT
      u.id,
      u.username,
      u.first_name,

      COUNT(r.id)::int
        AS referral_count

    FROM users u

    LEFT JOIN users r
      ON r.referred_by = u.id

    WHERE u.is_banned = false

    GROUP BY
      u.id,
      u.username,
      u.first_name,
      u.created_at

    ORDER BY
      referral_count DESC,
      u.created_at ASC

    LIMIT $1
    `,
    [safeLimit]
  );

  return result.rows.map(
    (row, index) => {

      const reward =
        STAR_RACE_REWARDS.find(
          item =>
            item.position ===
            index + 1
        );

      return {
        position: index + 1,

        userId: row.id,

        username:
          row.username,

        firstName:
          row.first_name,

        score:
          Number(
            row.referral_count
          ),

        potentialStars:
          reward
            ? reward.stars
            : 0
      };
    }
  );
}


/* =====================================================
   USERNING STAR RACE HOLATI
===================================================== */

async function getUserStarRaceStatus(
  userId
) {

  const result =
    await pool.query(
      `
      WITH referral_counts AS (
        SELECT
          u.id,

          COUNT(r.id)::int
            AS referral_count

        FROM users u

        LEFT JOIN users r
          ON r.referred_by = u.id

        WHERE u.is_banned = false

        GROUP BY
          u.id
      ),

      ranked AS (
        SELECT
          id,
          referral_count,

          RANK() OVER (
            ORDER BY
              referral_count DESC
          )::int AS rank

        FROM referral_counts
      )

      SELECT
        id,
        referral_count,
        rank

      FROM ranked

      WHERE id = $1
      `,
      [userId]
    );

  if (result.rows.length === 0) {

    return {
      userId,
      score: 0,
      rank: null,
      potentialStars: 0
    };
  }

  const row =
    result.rows[0];

  const rank =
    Number(row.rank);

  const reward =
    STAR_RACE_REWARDS.find(
      item =>
        item.position === rank
    );

  return {
    userId: row.id,

    score:
      Number(
        row.referral_count
      ),

    rank,

    potentialStars:
      reward
        ? reward.stars
        : 0
  };
}


/* =====================================================
   REWARD JADVALI
===================================================== */

function getRewardTable() {

  return STAR_RACE_REWARDS.map(
    item => ({
      ...item
    })
  );
}


/* =====================================================
   RACE MA'LUMOTLARI
===================================================== */

async function getStarRaceInfo() {

  const status =
    getRaceStatus();

  const time =
    getRemainingTime();

  const leaderboard =
    await getStarRaceLeaderboard(10);

  return {
    active:
      status.active,

    startAt:
      status.startAt,

    endAt:
      status.endAt,

    remainingMs:
      status.remainingMs,

    remainingSeconds:
      status.remainingSeconds,

    countdown:
      time.formatted,

    prizePool:
      STAR_RACE_PRIZE_POOL,

    leaderboard,

    rewards:
      getRewardTable()
  };
}


/* =====================================================
   EXPORT
===================================================== */

module.exports = {

  STAR_RACE_DURATION_HOURS,

  STAR_RACE_PRIZE_POOL,

  STAR_RACE_REWARDS,

  getNextRaceStart,

  getRaceStatus,

  getRemainingTime,

  getStarRaceLeaderboard,

  getUserStarRaceStatus,

  getRewardTable,

  getStarRaceInfo

};
