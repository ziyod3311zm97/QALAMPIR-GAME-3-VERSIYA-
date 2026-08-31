const {
  pool,
  getUser,
  createOrUpdateUser,
  updateGameResult,
  spendEnergy
} = require("../db");


/* =====================================================
   QALAMPIR GAME SERVICE
   O'yinning iqtisodiy va user bilan bog'liq qismlari
===================================================== */


/* =====================================================
   CONSTANTS
===================================================== */

const GAME_WIN_REWARD = 20;
const GAME_WIN_XP = 50;
const GAME_LOSS_XP = 10;

const MAX_ENERGY = 5;


/* =====================================================
   USER TEKSHIRISH
===================================================== */

async function ensureGameUser(user) {

  if (!user || !user.id) {
    throw new Error("User ma'lumoti mavjud emas");
  }

  const dbUser =
    await getUser(user.id);

  if (dbUser) {
    return dbUser;
  }

  return await createOrUpdateUser({
    id: user.id,
    username: user.username || null,
    first_name: user.first_name || null,
    last_name: user.last_name || null
  });
}


/* =====================================================
   O'YIN BOSHLASH
===================================================== */

async function startGame(userId) {

  if (!userId) {
    const error =
      new Error("User ID mavjud emas");

    error.code =
      "INVALID_USER";

    throw error;
  }

  const user =
    await getUser(userId);

  if (!user) {
    const error =
      new Error("Foydalanuvchi topilmadi");

    error.code =
      "USER_NOT_FOUND";

    throw error;
  }

  if (user.is_banned) {
    const error =
      new Error(
        "Foydalanuvchi bloklangan"
      );

    error.code =
      "BANNED";

    throw error;
  }

  const updatedUser =
    await spendEnergy(userId);

  return {
    success: true,

    user: updatedUser,

    energy:
      Number(updatedUser.energy),

    maxEnergy:
      MAX_ENERGY
  };
}


/* =====================================================
   O'YIN NATIJASINI SAQLASH
===================================================== */

async function finishGame(
  userId,
  result
) {

  if (!userId) {
    const error =
      new Error("User ID mavjud emas");

    error.code =
      "INVALID_USER";

    throw error;
  }

  if (
    result !== "win" &&
    result !== "loss"
  ) {
    const error =
      new Error(
        "Noto'g'ri o'yin natijasi"
      );

    error.code =
      "INVALID_RESULT";

    throw error;
  }

  const user =
    await getUser(userId);

  if (!user) {
    const error =
      new Error(
        "Foydalanuvchi topilmadi"
      );

    error.code =
      "USER_NOT_FOUND";

    throw error;
  }

  if (user.is_banned) {
    const error =
      new Error(
        "Foydalanuvchi bloklangan"
      );

    error.code =
      "BANNED";

    throw error;
  }

  const updatedUser =
    await updateGameResult(
      userId,
      result
    );

  return {
    success: true,

    result,

    user: updatedUser,

    reward:
      result === "win"
        ? GAME_WIN_REWARD
        : 0,

    xp:
      result === "win"
        ? GAME_WIN_XP
        : GAME_LOSS_XP
  };
}


/* =====================================================
   G'ALABA
===================================================== */

async function recordWin(userId) {

  return await finishGame(
    userId,
    "win"
  );
}


/* =====================================================
   MAG'LUBIYAT
===================================================== */

async function recordLoss(userId) {

  return await finishGame(
    userId,
    "loss"
  );
}


/* =====================================================
   O'YIN NATIJASINI XAVFSIZ SAQLASH
===================================================== */

async function safeRecordGameResult(
  userId,
  result
) {

  try {

    if (!userId) {
      return {
        success: false,
        skipped: true,
        reason: "NO_USER_ID"
      };
    }

    if (userId === "demo") {
      return {
        success: false,
        skipped: true,
        reason: "DEMO_USER"
      };
    }

    await ensureGameUser({
      id: userId
    });

    return await finishGame(
      userId,
      result
    );

  } catch (error) {

    console.error(
      "Game result saqlash xatosi:",
      error
    );

    return {
      success: false,
      error: error.message
    };
  }
}


/* =====================================================
   GAME ECONOMY MA'LUMOTLARI
===================================================== */

function getGameEconomy() {

  return {
    winReward:
      GAME_WIN_REWARD,

    winXp:
      GAME_WIN_XP,

    lossXp:
      GAME_LOSS_XP,

    maxEnergy:
      MAX_ENERGY
  };
}


/* =====================================================
   USER GAME PROFILE
===================================================== */

async function getGameProfile(userId) {

  const user =
    await getUser(userId);

  if (!user) {
    const error =
      new Error(
        "Foydalanuvchi topilmadi"
      );

    error.code =
      "USER_NOT_FOUND";

    throw error;
  }

  return {
    id: user.id,

    username:
      user.username,

    firstName:
      user.first_name,

    lastName:
      user.last_name,

    coins:
      Number(user.balance),

    wins:
      Number(user.wins),

    losses:
      Number(user.losses),

    streak:
      Number(user.streak),

    level:
      Number(user.level),

    xp:
      Number(user.xp),

    energy:
      Number(user.energy),

    maxEnergy:
      MAX_ENERGY,

    equippedSkin:
      user.equipped_skin,

    theme:
      user.theme,

    banned:
      Boolean(user.is_banned)
  };
}


/* =====================================================
   GAME STATISTIKA
===================================================== */

async function getGameStats(userId) {

  const result =
    await pool.query(
      `
      SELECT
        id,
        balance,
        wins,
        losses,
        streak,
        level,
        xp,
        energy
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

  if (result.rows.length === 0) {

    const error =
      new Error(
        "Foydalanuvchi topilmadi"
      );

    error.code =
      "USER_NOT_FOUND";

    throw error;
  }

  const user =
    result.rows[0];

  const totalGames =
    Number(user.wins) +
    Number(user.losses);

  const winRate =
    totalGames > 0
      ? Number(
          (
            Number(user.wins) /
            totalGames *
            100
          ).toFixed(1)
        )
      : 0;

  return {

    totalGames,

    wins:
      Number(user.wins),

    losses:
      Number(user.losses),

    streak:
      Number(user.streak),

    winRate,

    level:
      Number(user.level),

    xp:
      Number(user.xp),

    coins:
      Number(user.balance),

    energy:
      Number(user.energy),

    maxEnergy:
      MAX_ENERGY
  };
}


/* =====================================================
   EXPORT
===================================================== */

module.exports = {

  GAME_WIN_REWARD,

  GAME_WIN_XP,

  GAME_LOSS_XP,

  MAX_ENERGY,

  ensureGameUser,

  startGame,

  finishGame,

  recordWin,

  recordLoss,

  safeRecordGameResult,

  getGameEconomy,

  getGameProfile,

  getGameStats
};
