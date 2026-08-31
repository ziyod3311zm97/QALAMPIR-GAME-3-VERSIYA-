const {
  recordReward
} = require("../database/rewards");


/* =====================================================
   REWARD TURLARI
===================================================== */

const REWARD_TYPES = {
  DAILY_BONUS: "daily_bonus",

  REFERRAL_BONUS: "referral_bonus",

  STAR_RACE_1: "star_race_1",
  STAR_RACE_2: "star_race_2",
  STAR_RACE_3: "star_race_3",
  STAR_RACE_4: "star_race_4",
  STAR_RACE_5: "star_race_5",
  STAR_RACE_6: "star_race_6",
  STAR_RACE_7: "star_race_7",
  STAR_RACE_8: "star_race_8",
  STAR_RACE_9: "star_race_9",
  STAR_RACE_10: "star_race_10"
};


/* =====================================================
   COIN REWARD
===================================================== */

async function giveCoinReward(
  userId,
  amount,
  type
) {

  if (!Number.isFinite(Number(amount))) {
    throw new Error(
      "Reward miqdori noto'g'ri"
    );
  }

  const rewardAmount =
    Math.floor(Number(amount));

  if (rewardAmount <= 0) {
    throw new Error(
      "Reward 0 dan katta bo'lishi kerak"
    );
  }

  return await recordReward(
    userId,
    rewardAmount,
    type
  );
}


/* =====================================================
   REFERRAL REWARD
===================================================== */

/*
 * Hozircha referral reward
 * Telegram Stars bilan berilmaydi.
 *
 * Bu funksiya keyinchalik
 * Telegram Stars payment/reward
 * mexanizmiga ulanadi.
 */

async function giveReferralReward(
  userId,
  starsAmount = 5
) {

  if (
    !Number.isInteger(
      Number(starsAmount)
    ) ||
    Number(starsAmount) <= 0
  ) {
    throw new Error(
      "Stars miqdori noto'g'ri"
    );
  }

  return {
    success: true,

    userId,

    stars:
      Number(starsAmount),

    type:
      REWARD_TYPES.REFERRAL_BONUS,

    status:
      "PENDING_STARS_DISTRIBUTION"
  };
}


/* =====================================================
   STAR RACE REWARD
===================================================== */

async function calculateStarRaceReward(
  position,
  rewards
) {

  const rank =
    Number(position);

  if (
    !Number.isInteger(rank) ||
    rank < 1
  ) {
    return 0;
  }

  const reward =
    rewards.find(
      item =>
        Number(item.position) === rank
    );

  return reward
    ? Number(reward.stars)
    : 0;
}


/* =====================================================
   STAR RACE WINNER REWARD
===================================================== */

async function prepareStarRaceReward(
  userId,
  position,
  rewards
) {

  const stars =
    await calculateStarRaceReward(
      position,
      rewards
    );

  if (stars <= 0) {
    return {
      success: false,
      userId,
      position,
      stars: 0,
      status: "NO_REWARD"
    };
  }

  return {
    success: true,

    userId,

    position,

    stars,

    type:
      `star_race_${position}`,

    status:
      "PENDING_STARS_DISTRIBUTION"
  };
}


/* =====================================================
   STAR RACE BARCHA G'OLIBLARINI TAYYORLASH
===================================================== */

async function prepareStarRaceRewards(
  leaderboard,
  rewards
) {

  if (!Array.isArray(leaderboard)) {
    return [];
  }

  return leaderboard
    .slice(0, 10)
    .map((player, index) => {

      const position =
        index + 1;

      const reward =
        rewards.find(
          item =>
            Number(item.position) ===
            position
        );

      return {
        userId:
          player.userId,

        position,

        score:
          Number(player.score || 0),

        stars:
          reward
            ? Number(reward.stars)
            : 0,

        type:
          `star_race_${position}`,

        status:
          reward
            ? "PENDING_STARS_DISTRIBUTION"
            : "NO_REWARD"
      };
    });
}


/* =====================================================
   REWARD SUM CHECK
===================================================== */

function calculateTotalPrizePool(
  rewards
) {

  if (!Array.isArray(rewards)) {
    return 0;
  }

  return rewards.reduce(
    (total, reward) =>
      total +
      Number(reward.stars || 0),
    0
  );
}


/* =====================================================
   REWARD TIZIMI VALIDATSIYASI
===================================================== */

function validatePrizePool(
  rewards,
  expectedTotal = 250
) {

  const total =
    calculateTotalPrizePool(
      rewards
    );

  return {
    valid:
      total === Number(expectedTotal),

    total,

    expected:
      Number(expectedTotal),

    difference:
      total - Number(expectedTotal)
  };
}


/* =====================================================
   EXPORT
===================================================== */

module.exports = {

  REWARD_TYPES,

  giveCoinReward,

  giveReferralReward,

  calculateStarRaceReward,

  prepareStarRaceReward,

  prepareStarRaceRewards,

  calculateTotalPrizePool,

  validatePrizePool

};
