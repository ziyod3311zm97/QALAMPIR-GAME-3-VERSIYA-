const { pool, DAILY_BONUS_AMOUNT } = require("./db");


/* =====================================================
   KUNLIK BONUS
===================================================== */

async function claimDailyBonus(userId) {
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
      throw new Error("Foydalanuvchi topilmadi");
    }

    const user = result.rows[0];

    if (user.is_banned) {
      const error = new Error(
        "Foydalanuvchi bloklangan"
      );

      error.code = "BANNED";

      throw error;
    }

    if (user.last_bonus_date) {
      const bonusDate =
        new Date(user.last_bonus_date)
          .toISOString()
          .slice(0, 10);

      const today =
        new Date()
          .toISOString()
          .slice(0, 10);

      if (bonusDate === today) {
        const error = new Error(
          "Bugungi bonus allaqachon olingan"
        );

        error.code = "ALREADY_CLAIMED";

        throw error;
      }
    }

    const updated = await client.query(
      `
      UPDATE users
      SET
        balance = balance + $1,
        last_bonus_date = CURRENT_DATE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [
        DAILY_BONUS_AMOUNT,
        userId
      ]
    );

    await client.query(
      `
      INSERT INTO transactions (
        user_id,
        amount,
        type
      )
      VALUES ($1, $2, 'daily_bonus')
      `,
      [
        userId,
        DAILY_BONUS_AMOUNT
      ]
    );

    await client.query("COMMIT");

    return {
      user: updated.rows[0],
      amount: DAILY_BONUS_AMOUNT
    };

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }
}


/* =====================================================
   DAILY BONUS HOLATINI TEKSHIRISH
===================================================== */

async function getDailyBonusStatus(userId) {

  const result = await pool.query(
    `
    SELECT
      id,
      last_bonus_date
    FROM users
    WHERE id = $1
    `,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  const claimed =
    user.last_bonus_date
      ? new Date(user.last_bonus_date)
          .toISOString()
          .slice(0, 10) === today
      : false;

  return {
    claimed,
    amount: DAILY_BONUS_AMOUNT
  };
}


/* =====================================================
   REWARD TRANSACTION
===================================================== */

async function recordReward(
  userId,
  amount,
  type
) {
  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE users
      SET
        balance = balance + $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
        AND is_banned = false
      RETURNING *
      `,
      [
        amount,
        userId
      ]
    );

    if (result.rows.length === 0) {
      throw new Error(
        "Foydalanuvchi topilmadi yoki bloklangan"
      );
    }

    await client.query(
      `
      INSERT INTO transactions (
        user_id,
        amount,
        type
      )
      VALUES ($1, $2, $3)
      `,
      [
        userId,
        amount,
        type
      ]
    );

    await client.query("COMMIT");

    return result.rows[0];

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }
}


/* =====================================================
   STAR RACE REWARD LOG
===================================================== */

/*
 * Hozircha Starsni foydalanuvchiga bermaymiz.
 *
 * Keyingi bosqichda:
 *
 * STAR RACE
 *      ↓
 * 1-o'rin
 * 2-o'rin
 * 3-o'rin
 * 4-10
 *      ↓
 * Telegram Stars
 *
 * uchun alohida jadval va transaction
 * tizimi qo'shiladi.
 */


/* =====================================================
   EXPORT
===================================================== */

module.exports = {

  claimDailyBonus,

  getDailyBonusStatus,

  recordReward

};
