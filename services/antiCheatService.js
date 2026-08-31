const { pool } = require("../database/db");


/* =====================================================
   ANTI-CHEAT SOZLAMALARI
===================================================== */

const MIN_ACCOUNT_AGE_FOR_RACE = 0;

const MAX_REFERRALS_PER_USER_PER_DAY = 100;


/* =====================================================
   USER TEKSHIRISH
===================================================== */

async function getUserSecurityInfo(userId) {

  const result = await pool.query(
    `
    SELECT
      id,
      username,
      first_name,
      created_at,
      referred_by,
      is_banned
    FROM users
    WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0] || null;
}


/* =====================================================
   SELF REFERRAL
===================================================== */

function isSelfReferral(
  userId,
  referrerId
) {
  return (
    Number(userId) ===
    Number(referrerId)
  );
}


/* =====================================================
   REFERRAL VALIDATSIYASI
===================================================== */

async function validateReferral(
  newUserId,
  referrerId
) {

  if (
    isSelfReferral(
      newUserId,
      referrerId
    )
  ) {
    return {
      valid: false,
      reason: "SELF_REFERRAL"
    };
  }

  const newUser =
    await getUserSecurityInfo(
      newUserId
    );

  if (!newUser) {
    return {
      valid: false,
      reason: "NEW_USER_NOT_FOUND"
    };
  }

  const referrer =
    await getUserSecurityInfo(
      referrerId
    );

  if (!referrer) {
    return {
      valid: false,
      reason: "REFERRER_NOT_FOUND"
    };
  }

  if (newUser.is_banned) {
    return {
      valid: false,
      reason: "NEW_USER_BANNED"
    };
  }

  if (referrer.is_banned) {
    return {
      valid: false,
      reason: "REFERRER_BANNED"
    };
  }

  if (newUser.referred_by) {
    return {
      valid: false,
      reason: "ALREADY_REFERRED"
    };
  }

  return {
    valid: true
  };
}


/* =====================================================
   DAILY REFERRAL LIMIT
===================================================== */

async function getTodayReferralCount(
  userId
) {

  /*
   * Hozir users.created_at asosida
   * soddalashtirilgan hisob ishlatiladi.
   *
   * Keyingi bosqichda alohida
   * referral_events jadvali qo'shiladi.
   */

  const result = await pool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM users
    WHERE referred_by = $1
      AND created_at >= CURRENT_DATE
    `,
    [userId]
  );

  return result.rows[0].count;
}


/* =====================================================
   DAILY REFERRAL LIMIT TEKSHIRISH
===================================================== */

async function checkReferralDailyLimit(
  userId
) {

  const count =
    await getTodayReferralCount(
      userId
    );

  return {
    allowed:
      count <
      MAX_REFERRALS_PER_USER_PER_DAY,

    count,

    limit:
      MAX_REFERRALS_PER_USER_PER_DAY
  };
}


/* =====================================================
   STAR RACE USER VALIDATSIYASI
===================================================== */

async function validateRaceParticipant(
  userId
) {

  const user =
    await getUserSecurityInfo(
      userId
    );

  if (!user) {
    return {
      valid: false,
      reason: "USER_NOT_FOUND"
    };
  }

  if (user.is_banned) {
    return {
      valid: false,
      reason: "BANNED"
    };
  }

  const accountAgeMs =
    Date.now() -
    new Date(
      user.created_at
    ).getTime();

  const accountAgeDays =
    accountAgeMs /
    (1000 * 60 * 60 * 24);

  if (
    accountAgeDays <
    MIN_ACCOUNT_AGE_FOR_RACE
  ) {
    return {
      valid: false,
      reason: "ACCOUNT_TOO_NEW",
      accountAgeDays
    };
  }

  return {
    valid: true,
    userId,
    accountAgeDays
  };
}


/* =====================================================
   LEADERBOARD USERLARINI FILTRLASH
===================================================== */

async function filterRaceParticipants(
  leaderboard
) {

  if (!Array.isArray(leaderboard)) {
    return [];
  }

  const validParticipants = [];

  for (const player of leaderboard) {

    const check =
      await validateRaceParticipant(
        player.userId
      );

    if (check.valid) {
      validParticipants.push(
        player
      );
    }
  }

  return validParticipants;
}


/* =====================================================
   REFERRAL REWARD UCHUN XAVFSIZLIK
===================================================== */

async function validateReferralReward(
  newUserId,
  referrerId
) {

  const referralCheck =
    await validateReferral(
      newUserId,
      referrerId
    );

  if (!referralCheck.valid) {
    return referralCheck;
  }

  const limitCheck =
    await checkReferralDailyLimit(
      referrerId
    );

  if (!limitCheck.allowed) {
    return {
      valid: false,
      reason: "DAILY_REFERRAL_LIMIT",
      count: limitCheck.count,
      limit: limitCheck.limit
    };
  }

  return {
    valid: true,

    newUserId,

    referrerId,

    dailyReferralCount:
      limitCheck.count
  };
}


/* =====================================================
   EXPORT
===================================================== */

module.exports = {

  MIN_ACCOUNT_AGE_FOR_RACE,

  MAX_REFERRALS_PER_USER_PER_DAY,

  getUserSecurityInfo,

  isSelfReferral,

  validateReferral,

  getTodayReferralCount,

  checkReferralDailyLimit,

  validateRaceParticipant,

  filterRaceParticipants,

  validateReferralReward

};
