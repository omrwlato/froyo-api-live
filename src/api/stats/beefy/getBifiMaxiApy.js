const BigNumber = require('bignumber.js');
const web3 = require('../../../utils/web3');

const ERC20 = require('../../../abis/ERC20.json');
const IRewardPool = require('../../../abis/IRewardPool.json');
const { getPrice } = require('../../../utils/getPrice');
const { getTotalStakedInUsd } = require('../../../utils/getTotalStakedInUsd');
const { compound } = require('../../../utils/compound');

const BIFI = '0xCa3F508B8e4Dd382eE878A314789373D80A5190A';
const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const REWARDS = '0x453D4Ba9a2D594314DF88564248497F7D74d6b2C';
const ORACLE = 'thugs';
const ORACLE_ID = `${WBNB}_${BIFI}`;
const DECIMALS = '1e18';
const BLOCKS_PER_DAY = 28800;

const getBifiMaxiApy = async () => {
  const [yearlyRewardsInUsd, totalStakedInUsd] = await Promise.all([
    getYearlyRewardsInUsd(),
    getTotalStakedInUsd(REWARDS, BIFI, ORACLE, ORACLE_ID, DECIMALS),
  ]);

  const simpleApy = yearlyRewardsInUsd.dividedBy(totalStakedInUsd);
  const apy = compound(simpleApy, process.env.DAILY_HPY, 1, 0.99);

  return { 'bifi-maxi': apy };
};

const getYearlyRewardsInUsd = async () => {
  const bnbPrice = await getPrice('pancake', 'WBNB');

  const rewardPool = new web3.eth.Contract(IRewardPool, REWARDS);
  const rewardRate = new BigNumber(await rewardPool.methods.rewardRate().call());
  const yearlyRewards = rewardRate.times(3).times(BLOCKS_PER_DAY).times(365);
  const yearlyRewardsInUsd = yearlyRewards.times(bnbPrice).dividedBy(DECIMALS);

  return yearlyRewardsInUsd;
};

module.exports = getBifiMaxiApy;
