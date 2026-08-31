const {
  attachReferral,
  getReferralInfo,
  getReferralCount,
  getReferrals,
  getReferralLeaderboard,
  getReferralRank
} = require("../database/referrals");


/* =====================================================
   REFERRALNI QABUL QILISH
===================================================== */

async function processReferral(
  newUserId,
  referralCode
) {
  if (!referralCode) {
    return {
      success: false,
      reason: "NO_REFERRAL"
    };
  }

  const referrerId = Number(referralCode);

  if (
    !Number.isInteger(referrerId) ||
    referrerId <= 0
  ) {
    return {
      success: false,
      reason: "INVALID_REFERRAL"
    };
  }

  const result = await attachReferral(
    newUserId,
    referrerId
  );

  return result;
}


/* =====================================================
   USER REFERRAL STATISTIKASI
===================================================== */

async function getUserReferralStats(userId) {

  const info =
    await getReferralInfo(userId);

  const count =
    await getReferralCount(userId);

  const rank =
    await getReferralRank(userId);

  return {
    userId,
    referredBy: info?.referred_by || null,
    referrerUsername:
      info?.referrer_username || null,

    referralCount: count,

    rank: rank?.rank || null
  };
}


/* =====================================================
   REFERRAL USERLARINI OLISH
===================================================== */

async function getUserReferrals(
  userId,
  limit = 100
) {
  return await getReferrals(
    userId,
    limit
  );
}


/* =====================================================
   REFERRAL LEADERBOARD
===================================================== */

async function getTopReferrers(
  limit = 10
) {
  return await getReferralLeaderboard(
    limit
  );
}


/* =====================================================
   STAR RACE UCHUN REFERRAL SCORE
===================================================== */

/*
 * Hozircha score = haqiqiy referral soni.
 *
 * Keyinchalik:
 *
 * valid referral
 *      +
 * active referral
 *      +
 * anti-cheat
 *      +
 * daily reset
 *
 * orqali STAR RACE score hisoblanadi.
 */

async function getReferralScore(userId) {

  const count =
    await getReferralCount(userId);

  return {
    userId,
    score: count
  };
}


/* =====================================================
   EXPORT
===================================================== */

module.exports = {

  processReferral,

  getUserReferralStats,

  getUserReferrals,

  getTopReferrers,

  getReferralScore

};
