const {
  pool,
  MAX_ENERGY,
  ENERGY_REGEN_MINUTES
} = require("./db");


/* =====================================================
   USERNI OLISH
===================================================== */

async function getUser(userId) {
  const result = await pool.query(
    `SELECT * FROM users WHERE id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}


/* =====================================================
   ENERGY QAYTA HISOBLASH
===================================================== */

function recalcEnergy(user) {
  const now = Date.now();

  const lastUpdate =
    user.energy_updated_at
      ? new Date(user.energy_updated_at).getTime()
      : now;

  const minutesPassed =
    (now - lastUpdate) / 60000;

  const regenSteps =
    Math.floor(
      minutesPassed / ENERGY_REGEN_MINUTES
    );

  const energy = Number(user.energy);

  if (
    energy >= MAX_ENERGY ||
    regenSteps <= 0
  ) {
    return {
      energy,
      energyUpdatedAt: user.energy_updated_at,
      changed: false
    };
  }

  const newEnergy = Math.min(
    MAX_ENERGY,
    energy + regenSteps
  );

  const consumedMs =
    regenSteps *
    ENERGY_REGEN_MINUTES *
    60000;

  const newUpdatedAt =
    new Date(lastUpdate + consumedMs);

  return {
    energy: newEnergy,
    energyUpdatedAt: newUpdatedAt,
    changed: true
  };
}


/* =====================================================
   USER + FRESH ENERGY
===================================================== */

async function getUserWithFreshEnergy(userId) {
  const user = await getUser(userId);

  if (!user) {
    return null;
  }

  const recalculated =
    recalcEnergy(user);

  if (!recalculated.changed) {
    return user;
  }

  const updated = await pool.query(
    `
    UPDATE users
    SET
      energy = $1,
      energy_updated_at = $2
    WHERE id = $3
    RETURNING *
    `,
    [
      recalculated.energy,
      recalculated.energyUpdatedAt,
      userId
    ]
  );

  return updated.rows[0];
}


/* =====================================================
   ENERGY SARFLASH
===================================================== */

async function spendEnergy(userId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      SELECT *
      FROM users
      WHERE id = $1
      FOR UPDATE
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error(
        "Foydalanuvchi topilmadi"
      );
    }

    const user = result.rows[0];

    if (user.is_banned) {
      const error = new Error(
        "Foydalanuvchi bloklangan"
      );

      error.code = "BANNED";

      throw error;
    }

    const recalculated =
      recalcEnergy(user);

    if (recalculated.energy < 1) {
      const error = new Error(
        "Jon yetarli emas"
      );

      error.code = "NO_ENERGY";

      throw error;
    }

    const updated = await client.query(
      `
      UPDATE users
      SET
        energy = $1,
        energy_updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [
        recalculated.energy - 1,
        userId
      ]
    );

    await client.query("COMMIT");

    return updated.rows[0];

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }
}


/* =====================================================
   USER YARATISH / YANGILASH
===================================================== */

async function createOrUpdateUser(
  user,
  referralCode
) {

  const inserted = await pool.query(
    `
    INSERT INTO users (
      id,
      username,
      first_name,
      last_name
    )
    VALUES ($1, $2, $3, $4)

    ON CONFLICT (id)
    DO NOTHING

    RETURNING *
    `,
    [
      user.id,
      user.username || null,
      user.first_name || null,
      user.last_name || null
    ]
  );

  const isNewUser =
    inserted.rows.length > 0;

  if (!isNewUser) {

    const updated = await pool.query(
      `
      UPDATE users
      SET
        username = $1,
        first_name = $2,
        last_name = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4

      RETURNING *
      `,
      [
        user.username || null,
        user.first_name || null,
        user.last_name || null,
        user.id
      ]
    );

    return updated.rows[0];
  }


  /*
   * Yangi foydalanuvchi.
   *
   * Referral mavjud bo‘lsa,
   * referralService orqali
   * keyinchalik bonus beriladi.
   *
   * Hozircha bu yerda
   * referral logikasini bajarmaymiz.
   */

  return inserted.rows[0];
}


/* =====================================================
   USERNI BAN QILISH
===================================================== */

async function setBanned(userId, banned) {

  const result = await pool.query(
    `
    UPDATE users
    SET
      is_banned = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2

    RETURNING *
    `,
    [
      banned,
      userId
    ]
  );

  return result.rows[0] || null;
}


/* =====================================================
   BARCHA AKTIV USER ID
===================================================== */

async function getAllUserIds() {

  const result = await pool.query(
    `
    SELECT id
    FROM users
    WHERE is_banned = false
    `
  );

  return result.rows.map(
    row => row.id
  );
}


/* =====================================================
   USERNI ID YOKI USERNAME ORQALI TOPISH
===================================================== */

async function findUserByIdOrUsername(query) {

  const numericId = Number(query);

  if (
    !Number.isNaN(numericId) &&
    numericId > 0
  ) {

    const byId =
      await getUser(numericId);

    if (byId) {
      return byId;
    }
  }

  const cleanUsername =
    String(query).replace(
      /^@/,
      ""
    );

  const result = await pool.query(
    `
    SELECT *
    FROM users
    WHERE username ILIKE $1
    LIMIT 1
    `,
    [cleanUsername]
  );

  return result.rows[0] || null;
}


/* =====================================================
   EXPORT
===================================================== */

module.exports = {

  getUser,

  createOrUpdateUser,

  getUserWithFreshEnergy,

  spendEnergy,

  setBanned,

  getAllUserIds,

  findUserByIdOrUsername,

  recalcEnergy

};
