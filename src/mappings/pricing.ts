/* eslint-disable prefer-const */
import { Pair, Token, Bundle } from '../types/schema'
import { BigDecimal, Address, BigInt } from '@graphprotocol/graph-ts/index'
import { ZERO_BD, factoryContract, ADDRESS_ZERO, ONE_BD } from './helpers'

const WBNB_ADDRESS = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'
const BUSD_WBNB_PAIR = '0x5c192278bb23f4a9a3b262514473117fb7e635ef' //WBNB-BUSD
const DAI_WBNB_PAIR = '0x926bd4bd92a1221ec3ca43dee9a8bb7e4fd3acd4' //DAI-WBNB
const USDT_WBNB_PAIR = '0x465730a393847fcc5c01339b006c94fabe0eeb1d' //USDT-WBNB
const USDC_WBNB_PAIR = '0x472120f2f56f1e58bd531a4a3bd4137b6b895f99' //USDC-WBNB

// dummy for testing
export function getBnbPriceInUSD(): BigDecimal {
  // fetch BNB prices for each stablecoin
  let usdtPair = Pair.load(USDT_WBNB_PAIR) // usdt is token0
  let busdPair = Pair.load(BUSD_WBNB_PAIR) // busd is token1
  let daiPair = Pair.load(DAI_WBNB_PAIR) // dai is token0
  let usdcPair = Pair.load(USDC_WBNB_PAIR) // usdc is token0

  // all 3 have been created
  if (daiPair !== null && busdPair !== null && usdtPair !== null && usdcPair !== null) {

    let totalLiquidityBNB = daiPair.reserve1.plus(busdPair.reserve0).plus(usdtPair.reserve1).plus(usdcPair.reserve1)
    let daiWeight = daiPair.reserve1.div(totalLiquidityBNB)
    let busdWeight = busdPair.reserve0.div(totalLiquidityBNB)
    let usdtWeight = usdtPair.reserve1.div(totalLiquidityBNB)
    let usdcWeight = usdcPair.reserve1.div(totalLiquidityBNB)
    return daiPair.token0Price
      .times(daiWeight)
      .plus(busdPair.token1Price.times(busdWeight))
      .plus(usdtPair.token0Price.times(usdtWeight))
      .plus(usdcPair.token0Price.times(usdcWeight))

  } else if (busdPair !== null && usdtPair !== null && usdcPair !== null) {

    let totalLiquidityBNB = busdPair.reserve0.plus(usdtPair.reserve1).plus(usdcPair.reserve1)
    let busdWeight = busdPair.reserve0.div(totalLiquidityBNB)
    let usdtWeight = usdtPair.reserve1.div(totalLiquidityBNB)
    let usdcWeight = usdcPair.reserve1.div(totalLiquidityBNB)
    return busdPair.token1Price.times(busdWeight).plus(usdtPair.token0Price.times(usdtWeight)).plus(usdcPair.token0Price.times(usdcWeight))

  } else if (usdtPair !== null && usdcPair !== null) {

    let totalLiquidityBNB = usdtPair.reserve1.plus(usdcPair.reserve1)
    let usdtWeight = usdtPair.reserve1.div(totalLiquidityBNB)
    let usdcWeight = usdcPair.reserve1.div(totalLiquidityBNB)
    return usdtPair.token0Price.times(usdtWeight).plus(usdcPair.token0Price.times(usdcWeight))

  } else if (usdcPair !== null) {

    return usdcPair.token0Price

  } else {

    return ZERO_BD

  }
}

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = [
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', // wbnb
  '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3', // dai
  '0xe9e7cea3dedca5984780bafc599bd69add087d56', // busd
  '0x55d398326f99059ff775485246999027b3197955', // usdt
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // usdc
  '0xd8a1734945b9ba38eb19a291b475e31f49e59877' // shard
]

/**
 * Search through graph to find derived BNB per token.
 * @todo update to be derived BNB (add stablecoin estimates)
 **/
export function findBnbPerToken(token: Token): BigDecimal {
  if (token.id == WBNB_ADDRESS) {
    return ONE_BD
  }
  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    let pairAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(WHITELIST[i]))
    if (pairAddress.toHexString() != ADDRESS_ZERO) {
      let pair = Pair.load(pairAddress.toHexString())
      if (pair.token0 == token.id) {
        let token1 = Token.load(pair.token1)
        return pair.token1Price.times(token1.derivedBNB as BigDecimal) // return token1 per our token * BNB per token 1
      }
      if (pair.token1 == token.id) {
        let token0 = Token.load(pair.token0)
        return pair.token0Price.times(token0.derivedBNB as BigDecimal) // return token0 per our token * BNB per token 0
      }
    }
  }
  return ZERO_BD // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export function getTrackedVolumeUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token,
  pair: Pair
): BigDecimal {
  let bundle = Bundle.load('1')
  let price0 = token0.derivedBNB.times(bundle.bnbPrice)
  let price1 = token1.derivedBNB.times(bundle.bnbPrice)

  // if less than 5 LPs, require high minimum reserve amount amount or return 0
  if (pair.liquidityProviderCount.lt(BigInt.fromI32(5))) {
    let reserve0USD = pair.reserve0.times(price0)
    let reserve1USD = pair.reserve1.times(price1)
  }

  return tokenAmount0
    .times(price0)
    .plus(tokenAmount1.times(price1))
    .div(BigDecimal.fromString('2'))

}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedLiquidityUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): BigDecimal {
  let bundle = Bundle.load('1')
  let price0 = token0.derivedBNB.times(bundle.bnbPrice)
  let price1 = token1.derivedBNB.times(bundle.bnbPrice)

  return tokenAmount0.times(price0).plus(tokenAmount1.times(price1))
}
