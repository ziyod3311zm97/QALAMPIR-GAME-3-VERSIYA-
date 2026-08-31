const { pool } = require("./db");


/* =====================================================
   REFERRALNI TEKSHIRISH
===================================================== */

async function getReferrer(referrerId) {
  const result = await pool.query(
    `
    SELECT id, username, first_name
    FROM users
    WHERE id = $1
      AND is_banned = false
    `,
    [referrerId]
  );

  return result.rows[0] || null;
}


/* =====================================================
   USERNING REFERRERINI OLISH
===================================================== */

async function getReferralInfo(userId) {
  const result = await pool.query(
    `
    SELECT
      u.id,
      u.referred_by,
      r.username AS referrer_username,
      r.first_name AS referrer_first_name
    FROM users u
    LEFT JOIN users r
      ON r.id = u.referred_by
    WHERE u.id = $1
    `,
    [userId]
  );

  return result.rows[0] || null;
}


/* =====================================================
   REFERRALNI BOG'LASH
===================================================== */

async function attachReferral(newUserId, referrerId) {

  const newUser = await pool.query(
    `
    SELECT id, referred_by
    FROM users
    WHERE id = $1
    `,
    [newUserId]
  );

  if (newUser.rows.length === 0) {
    return {
      success: false,
      reason: "NEW_USER_NOT_FOUND"
    };
  }

  /*
   * User allaqachon referral orqali kelgan bo'lsa,
   * boshqa referralga almashtirilmaydi.
   */
  if (newUser.rows[0].referred_by) {
    return {
      success: false,
      reason: "ALREADY_REFERRED"
    };
  }


  /*
   * O'zini o'zi taklif qilishga yo'l qo'ymaymiz.
   */
  if (
    Number(newUserId) ===
    Number(referrerId)
  ) {
    return {
      success: false,
      reason: "SELF_REFERRAL"
    };
  }


  /*
   * Referrer mavjudligini tekshiramiz.
   */
  const referrer =
    await getReferrer(referrerId);

  if (!referrer) {
    return {
      success: false,
      reason: "REFERRER_NOT_FOUND"
    };
  }


  const updated = await pool.query(
    `
    UPDATE users
    SET
      referred_by = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
      AND referred_by IS NULL
    RETURNING *
    `,
    [
      referrerId,
      newUserId
    ]
  );


  if (updated.rows.length === 0) {
    return {
      success: false,
      reason: "REFERRAL_NOT_ATTACHED"
    };
  }


  return {
    success: true,
    user: updated.rows[0],
    referrer
  };
}


/* =====================================================
   NECHTA REFERRAL BOR?
===================================================== */

async function getReferralCount(userId) {

  const result = await pool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM users
    WHERE referred_by = $1
    `,
    [userId]
  );

  return result.rows[0].count;
}


/* =====================================================
   REFERRAL USERLAR
===================================================== */

async function getReferrals(userId, limit = 100) {

  const result = await pool.query(
    `
    SELECT
      id,
      username,
      first_name,
      created_at
    FROM users
    WHERE referred_by = $1
    ORDER BY created_at DESC
    LIMIT $2
    `,
    [
      userId,
      limit
    ]
  );

  return result.rows;
}


/* =====================================================
   DAILY STAR RACE UCHUN REFERRAL HISOBI
===================================================== */

/*
 * Keyinchalik alohida daily_referrals
 * statistikasi qo'shiladi.
 *
 * Hozircha umumiy referral sonini
 * qaytaramiz.
 */

async function getReferralLeaderboard(limit = 10) {

  const result = await pool.query(
    `
    SELECT
      u.id,
      u.username,
      u.first_name,
      COUNT(r.id)::int AS referral_count
    FROM users u
    LEFT JOIN users r
      ON r.referred_by = u.id
    WHERE u.is_banned = false
    GROUP BY
      u.id,
      u.username,
      u.first_name
    ORDER BY
      referral_count DESC,
      u.created_at ASC
    LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}


/* =====================================================
   REFERRAL RACE UCHUN USER POZITSIYASI
===================================================== */

async function getReferralRank(userId) {

  const result = await pool.query(
    `
    WITH referral_counts AS (
      SELECT
        u.id,
        COUNT(r.id)::int AS referral_count
      FROM users u
      LEFT JOIN users r
        ON r.referred_by = u.id
      WHERE u.is_banned = false
      GROUP BY u.id
    )

    SELECT
      id,
      referral_count,
      (
        SELECT COUNT(*) + 1
        FROM referral_counts rc2
        WHERE rc2.referral_count > rc.referral_count
      )::int AS rank

    FROM referral_counts rc
    WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0] || {
    id: userId,
    referral_count: 0,
    rank: null
  };
}


/* =====================================================
   EXPORT
===================================================== */

module.exports = {

  getReferrer,

  getReferralInfo,

  attachReferral,

  getReferralCount,

  getReferrals,

  getReferralLeaderboard,

  getReferralRank

};
