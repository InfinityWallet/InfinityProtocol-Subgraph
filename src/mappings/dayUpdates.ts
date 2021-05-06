import { PairHourData, PairMinuteData, TokenHourData, TokenMinuteData} from './../types/schema'
/* eslint-disable prefer-const */
import { BigInt, BigDecimal, EthereumEvent } from '@graphprotocol/graph-ts'
import { Pair, Bundle, Token, InfinityFactory, InfinityswapDayData, PairDayData, TokenDayData } from '../types/schema'
import { ONE_BI, ZERO_BD, HUNDRED_BD, ZERO_BI, FACTORY_ADDRESS } from './helpers'

// max number of entities to store
const maxTokenDayDatas = 10
const maxPairDayDatas = 10

export function updateInfinityswapDayData(event: EthereumEvent): void {
  let infinityswap = InfinityFactory.load(FACTORY_ADDRESS)
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let infinityswapDayData = InfinityswapDayData.load(dayID.toString())
  if (infinityswapDayData == null) {
    let infinityswapDayData = new InfinityswapDayData(dayID.toString())
    infinityswapDayData.date = dayStartTimestamp
    infinityswapDayData.dailyVolumeUSD = ZERO_BD
    infinityswapDayData.dailyVolumeBNB = ZERO_BD
    infinityswapDayData.totalVolumeUSD = ZERO_BD
    infinityswapDayData.totalVolumeBNB = ZERO_BD
    infinityswapDayData.dailyVolumeUntracked = ZERO_BD
    infinityswapDayData.totalLiquidityUSD = ZERO_BD
    infinityswapDayData.totalLiquidityBNB = ZERO_BD
    infinityswapDayData.txCount = ZERO_BI
    infinityswapDayData.save()
  }
  infinityswapDayData = InfinityswapDayData.load(dayID.toString())
  infinityswapDayData.totalLiquidityUSD = infinityswap.totalLiquidityUSD
  infinityswapDayData.totalLiquidityBNB = infinityswap.totalLiquidityBNB
  infinityswapDayData.txCount = infinityswap.txCount
  infinityswapDayData.save()
}

export function updatePairDayData(event: EthereumEvent): void {
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let dayPairID = event.address
    .toHexString()
    .concat('-')
    .concat(BigInt.fromI32(dayID).toString())

  let pair = Pair.load(event.address.toHexString())
  let pairDayData = PairDayData.load(dayPairID)

  let pairPriceReserves = ZERO_BD
  if(pair.reserve1.notEqual(ZERO_BD)){
    pairPriceReserves = pair.reserve0.div(pair.reserve1)
  }

  let pairReserves = ZERO_BD
  if(pair.reserveUSD.notEqual(ZERO_BD)){
    pairReserves = pair.reserveUSD
  }

  let pairTotalSupply = ZERO_BD
  if(pair.totalSupply.notEqual(ZERO_BD)){
    pairTotalSupply = pair.totalSupply
  }

  if (pairDayData == null) {
    let pairDayData = new PairDayData(dayPairID)
    //pairDayData.totalSupply = pair.totalSupply
    pairDayData.date = dayStartTimestamp
    pairDayData.token0 = pair.token0
    pairDayData.token1 = pair.token1
    pairDayData.pair = event.address
    pairDayData.reserve0 = ZERO_BD
    pairDayData.reserve1 = ZERO_BD
    //pairDayData.reserveUSD = ZERO_BD
    pairDayData.dailyVolumeToken0 = ZERO_BD
    pairDayData.dailyVolumeToken1 = ZERO_BD
    pairDayData.dailyVolumeUSD = ZERO_BD
    pairDayData.dailyTxns = ZERO_BI

    pairDayData.token0Open = pairPriceReserves
    pairDayData.token0High = pairPriceReserves
    pairDayData.token0Low = pairPriceReserves
    pairDayData.token0Close = pairPriceReserves

    pairDayData.reserveUSDOpen = pairReserves
    pairDayData.reserveUSDHigh = pairReserves
    pairDayData.reserveUSDLow = pairReserves
    pairDayData.reserveUSDClose = pairReserves

    pairDayData.totalSupplyOpen = pairTotalSupply
    pairDayData.totalSupplyHigh = pairTotalSupply
    pairDayData.totalSupplyLow = pairTotalSupply
    pairDayData.totalSupplyClose = pairTotalSupply

    pairDayData.save()
  }
  pairDayData = PairDayData.load(dayPairID)
  //pairDayData.totalSupply = pair.totalSupply
  pairDayData.reserve0 = pair.reserve0
  pairDayData.reserve1 = pair.reserve1
  //pairDayData.reserveUSD = pair.reserveUSD
  pairDayData.dailyTxns = pairDayData.dailyTxns.plus(ONE_BI)
  pairDayData.token0Close = pairPriceReserves

  if(pairDayData.token0High < pairPriceReserves){
    pairDayData.token0High = pairPriceReserves;
  }

  if(pairDayData.token0Low > pairPriceReserves){
    pairDayData.token0Low = pairPriceReserves;
  }

  pairDayData.reserveUSDClose = pairReserves

  if(pairDayData.reserveUSDHigh < pairReserves){
    pairDayData.reserveUSDHigh = pairReserves;
  }

  if(pairDayData.reserveUSDLow > pairReserves){
    pairDayData.reserveUSDLow = pairReserves;
  }

  pairDayData.totalSupplyClose = pairTotalSupply

  if(pairDayData.totalSupplyHigh < pairTotalSupply){
    pairDayData.totalSupplyHigh = pairTotalSupply;
  }

  if(pairDayData.totalSupplyLow > pairTotalSupply){
    pairDayData.totalSupplyLow = pairTotalSupply;
  }

  pairDayData.save()
}

export function updatePairHourData(event: EthereumEvent): void {
  let timestamp = event.block.timestamp.toI32()
  let hourIndex = timestamp / 3600 // get unique hour within unix history
  let hourStartUnix = hourIndex * 3600 // want the rounded effect
  let hourPairID = event.address
    .toHexString()
    .concat('-')
    .concat(BigInt.fromI32(hourIndex).toString())
  let pair = Pair.load(event.address.toHexString())
  let pairHourData = PairHourData.load(hourPairID)

  let pairPriceReserves = ZERO_BD
  if(pair.reserve1.notEqual(ZERO_BD)){
    pairPriceReserves = pair.reserve0.div(pair.reserve1)
  }

  let pairReserves = ZERO_BD
  if(pair.reserveUSD.notEqual(ZERO_BD)){
    pairReserves = pair.reserveUSD
  }

  let pairTotalSupply = ZERO_BD
  if(pair.totalSupply.notEqual(ZERO_BD)){
    pairTotalSupply = pair.totalSupply
  }

  if (pairHourData == null) {
    let pairHourData = new PairHourData(hourPairID)
    //pairHourData.totalSupply = pair.totalSupply
    pairHourData.date = hourStartUnix
    pairHourData.token0 = pair.token0
    pairHourData.token1 = pair.token1
    pairHourData.pair = event.address.toHexString()
    pairHourData.reserve0 = ZERO_BD
    pairHourData.reserve1 = ZERO_BD
    //pairHourData.reserveUSD = ZERO_BD
    pairHourData.hourlyVolumeToken0 = ZERO_BD
    pairHourData.hourlyVolumeToken1 = ZERO_BD
    pairHourData.hourlyVolumeUSD = ZERO_BD
    pairHourData.hourlyTxns = ZERO_BI

    pairHourData.token0Open = pairPriceReserves
    pairHourData.token0High = pairPriceReserves
    pairHourData.token0Low = pairPriceReserves
    pairHourData.token0Close = pairPriceReserves

    pairHourData.reserveUSDOpen = pairReserves
    pairHourData.reserveUSDHigh = pairReserves
    pairHourData.reserveUSDLow = pairReserves
    pairHourData.reserveUSDClose = pairReserves

    pairHourData.totalSupplyOpen = pairTotalSupply
    pairHourData.totalSupplyHigh = pairTotalSupply
    pairHourData.totalSupplyLow = pairTotalSupply
    pairHourData.totalSupplyClose = pairTotalSupply

    pairHourData.save()
  }

  pairHourData = PairHourData.load(hourPairID)
  //pairHourData.totalSupply = pair.totalSupply
  pairHourData.reserve0 = pair.reserve0
  pairHourData.reserve1 = pair.reserve1
  //pairHourData.reserveUSD = pair.reserveUSD
  pairHourData.hourlyTxns = pairHourData.hourlyTxns.plus(ONE_BI)
  pairHourData.token0Close = pairPriceReserves

  if(pairHourData.token0High < pairPriceReserves){
    pairHourData.token0High = pairPriceReserves;
  }

  if(pairHourData.token0Low > pairPriceReserves){
    pairHourData.token0Low = pairPriceReserves;
  }

  pairHourData.reserveUSDClose = pairReserves

  if(pairHourData.reserveUSDHigh < pairReserves){
    pairHourData.reserveUSDHigh = pairReserves;
  }

  if(pairHourData.reserveUSDLow > pairReserves){
    pairHourData.reserveUSDLow = pairReserves;
  }

  pairHourData.totalSupplyClose = pairTotalSupply

  if(pairHourData.totalSupplyHigh < pairTotalSupply){
    pairHourData.totalSupplyHigh = pairTotalSupply;
  }

  if(pairHourData.totalSupplyLow > pairTotalSupply){
    pairHourData.totalSupplyLow = pairTotalSupply;
  }

  pairHourData.save()

}

export function updatePairMinuteData(event: EthereumEvent): void {
  let timestamp = event.block.timestamp.toI32()
  let minuteIndex = timestamp / 60 // get unique minute within unix history
  let minuteStartUnix = minuteIndex * 60 // want the rounded effect
  let minutePairID = event.address
    .toHexString()
    .concat('-')
    .concat(BigInt.fromI32(minuteIndex).toString())
  let pair = Pair.load(event.address.toHexString())
  let pairMinuteData = PairMinuteData.load(minutePairID)

  let pairPriceReserves = ZERO_BD
  if(pair.reserve1.notEqual(ZERO_BD)){
    pairPriceReserves = pair.reserve0.div(pair.reserve1)
  }

  let pairReserves = ZERO_BD
  if(pair.reserveUSD.notEqual(ZERO_BD)){
    pairReserves = pair.reserveUSD;
  }

  let pairTotalSupply = ZERO_BD
  if(pair.totalSupply.notEqual(ZERO_BD)){
    pairTotalSupply = pair.totalSupply
  }

  if (pairMinuteData == null) {
    let pairMinuteData = new PairMinuteData(minutePairID)
    //pairMinuteData.totalSupply = pair.totalSupply
    pairMinuteData.date = minuteStartUnix
    pairMinuteData.pair = event.address.toHexString()
    pairMinuteData.token0 = pair.token0
    pairMinuteData.token1 = pair.token1
    pairMinuteData.reserve0 = ZERO_BD
    pairMinuteData.reserve1 = ZERO_BD
    //pairMinuteData.reserveUSD = ZERO_BD
    pairMinuteData.minuteVolumeToken0 = ZERO_BD
    pairMinuteData.minuteVolumeToken1 = ZERO_BD
    pairMinuteData.minuteVolumeUSD = ZERO_BD
    pairMinuteData.minuteTxns = ZERO_BI

    pairMinuteData.token0Open = pairPriceReserves
    pairMinuteData.token0High = pairPriceReserves
    pairMinuteData.token0Low = pairPriceReserves
    pairMinuteData.token0Close = pairPriceReserves

    pairMinuteData.reserveUSDOpen = pairReserves
    pairMinuteData.reserveUSDHigh = pairReserves
    pairMinuteData.reserveUSDLow = pairReserves
    pairMinuteData.reserveUSDClose = pairReserves

    pairMinuteData.totalSupplyOpen = pairTotalSupply
    pairMinuteData.totalSupplyHigh = pairTotalSupply
    pairMinuteData.totalSupplyLow = pairTotalSupply
    pairMinuteData.totalSupplyClose = pairTotalSupply

    pairMinuteData.save()
  }

  pairMinuteData = PairMinuteData.load(minutePairID)
  //pairMinuteData.totalSupply = pair.totalSupply
  pairMinuteData.reserve0 = pair.reserve0
  pairMinuteData.reserve1 = pair.reserve1
  //pairMinuteData.reserveUSD = pair.reserveUSD
  pairMinuteData.minuteTxns = pairMinuteData.minuteTxns.plus(ONE_BI)
  pairMinuteData.token0Close = pairPriceReserves

  if(pairMinuteData.token0High < pairPriceReserves){
    pairMinuteData.token0High = pairPriceReserves;
  }

  if(pairMinuteData.token0Low > pairPriceReserves){
    pairMinuteData.token0Low = pairPriceReserves;
  }

  pairMinuteData.reserveUSDClose = pairReserves

  if(pairMinuteData.reserveUSDHigh < pairReserves){
    pairMinuteData.reserveUSDHigh = pairReserves;
  }

  if(pairMinuteData.reserveUSDLow > pairReserves){
    pairMinuteData.reserveUSDLow = pairReserves;
  }

  pairMinuteData.totalSupplyClose = pairTotalSupply

  if(pairMinuteData.totalSupplyHigh < pairTotalSupply){
    pairMinuteData.totalSupplyHigh = pairTotalSupply;
  }

  if(pairMinuteData.totalSupplyLow > pairTotalSupply){
    pairMinuteData.totalSupplyLow = pairTotalSupply;
  }

  pairMinuteData.save()

}

export function updateTokenDayData(token: Token, event: EthereumEvent): void {
  let bundle = Bundle.load('1')
  let timestamp = event.block.timestamp.toI32()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let tokenDayID = token.id
    .toString()
    .concat('-')
    .concat(BigInt.fromI32(dayID).toString())

  let tokenDayData = TokenDayData.load(tokenDayID)
  if (tokenDayData == null) {
    let tokenDayData = new TokenDayData(tokenDayID)
    tokenDayData.date = dayStartTimestamp
    tokenDayData.token = token.id
    tokenDayData.priceUSD = token.derivedBNB.times(bundle.bnbPrice)
    tokenDayData.dailyVolumeToken = ZERO_BD
    tokenDayData.dailyVolumeBNB = ZERO_BD
    tokenDayData.dailyVolumeUSD = ZERO_BD
    tokenDayData.dailyTxns = ZERO_BI
    tokenDayData.totalLiquidityToken = ZERO_BD
    tokenDayData.totalLiquidityBNB = ZERO_BD
    tokenDayData.totalLiquidityUSD = ZERO_BD

    tokenDayData.token0Open = token.derivedBNB.times(bundle.bnbPrice)
    tokenDayData.token0High = token.derivedBNB.times(bundle.bnbPrice)
    tokenDayData.token0Low = token.derivedBNB.times(bundle.bnbPrice)
    tokenDayData.token0Close = token.derivedBNB.times(bundle.bnbPrice)

    tokenDayData.save()
  }
  tokenDayData = TokenDayData.load(tokenDayID)
  tokenDayData.priceUSD = token.derivedBNB.times(bundle.bnbPrice)
  tokenDayData.totalLiquidityToken = token.totalLiquidity
  tokenDayData.totalLiquidityBNB = token.totalLiquidity.times(token.derivedBNB as BigDecimal)
  tokenDayData.totalLiquidityUSD = tokenDayData.totalLiquidityBNB.times(bundle.bnbPrice)
  tokenDayData.dailyTxns = tokenDayData.dailyTxns.plus(ONE_BI)

  tokenDayData.token0Close = token.derivedBNB.times(bundle.bnbPrice)

  if(tokenDayData.token0High < token.derivedBNB.times(bundle.bnbPrice)){
    tokenDayData.token0High = token.derivedBNB.times(bundle.bnbPrice);
  }

  if(tokenDayData.token0Low > token.derivedBNB.times(bundle.bnbPrice)){
    tokenDayData.token0Low = token.derivedBNB.times(bundle.bnbPrice);
  }

  tokenDayData.save()
}


export function updateTokenHourData(token: Token, event: EthereumEvent): void {
  let bundle = Bundle.load('1')
  let timestamp = event.block.timestamp.toI32()
  let hourID = timestamp / 3600
  let hourStartTimestamp = hourID * 3600
  let tokenHourID = token.id
    .toString()
    .concat('-')
    .concat(BigInt.fromI32(hourID).toString())

  let tokenHourData = TokenHourData.load(tokenHourID)
  if (tokenHourData == null) {
    let tokenHourData = new TokenHourData(tokenHourID)
    tokenHourData.date = hourStartTimestamp
    tokenHourData.token = token.id
    tokenHourData.priceUSD = token.derivedBNB.times(bundle.bnbPrice)
    tokenHourData.hourlyVolumeToken = ZERO_BD
    tokenHourData.hourlyVolumeBNB = ZERO_BD
    tokenHourData.hourlyVolumeUSD = ZERO_BD
    tokenHourData.hourlyTxns = ZERO_BI
    tokenHourData.totalLiquidityToken = ZERO_BD
    tokenHourData.totalLiquidityBNB = ZERO_BD
    tokenHourData.totalLiquidityUSD = ZERO_BD

    tokenHourData.token0Open = token.derivedBNB.times(bundle.bnbPrice)
    tokenHourData.token0High = token.derivedBNB.times(bundle.bnbPrice)
    tokenHourData.token0Low = token.derivedBNB.times(bundle.bnbPrice)
    tokenHourData.token0Close = token.derivedBNB.times(bundle.bnbPrice)

    tokenHourData.save()
  }
  tokenHourData = TokenHourData.load(tokenHourID)
  tokenHourData.priceUSD = token.derivedBNB.times(bundle.bnbPrice)
  tokenHourData.totalLiquidityToken = token.totalLiquidity
  tokenHourData.totalLiquidityBNB = token.totalLiquidity.times(token.derivedBNB as BigDecimal)
  tokenHourData.totalLiquidityUSD = tokenHourData.totalLiquidityBNB.times(bundle.bnbPrice)
  tokenHourData.hourlyTxns = tokenHourData.hourlyTxns.plus(ONE_BI)

  tokenHourData.token0Close = token.derivedBNB.times(bundle.bnbPrice)

  if(tokenHourData.token0High < token.derivedBNB.times(bundle.bnbPrice)){
    tokenHourData.token0High = token.derivedBNB.times(bundle.bnbPrice);
  }

  if(tokenHourData.token0Low > token.derivedBNB.times(bundle.bnbPrice)){
    tokenHourData.token0Low = token.derivedBNB.times(bundle.bnbPrice);
  }

  tokenHourData.save()
}



export function updateTokenMinuteData(token: Token, event: EthereumEvent): void {
  let bundle = Bundle.load('1')
  let timestamp = event.block.timestamp.toI32()
  let minuteID = timestamp / 60
  let minuteStartTimestamp = minuteID * 60
  let tokenMinuteID = token.id
    .toString()
    .concat('-')
    .concat(BigInt.fromI32(minuteID).toString())

  let tokenMinuteData = TokenMinuteData.load(tokenMinuteID)
  if (tokenMinuteData == null) {
    let tokenMinuteData = new TokenMinuteData(tokenMinuteID)
    tokenMinuteData.date = minuteStartTimestamp
    tokenMinuteData.token = token.id
    tokenMinuteData.priceUSD = token.derivedBNB.times(bundle.bnbPrice)
    tokenMinuteData.minuteVolumeToken = ZERO_BD
    tokenMinuteData.minuteVolumeBNB = ZERO_BD
    tokenMinuteData.minuteVolumeUSD = ZERO_BD
    tokenMinuteData.minuteTxns = ZERO_BI
    tokenMinuteData.totalLiquidityToken = ZERO_BD
    tokenMinuteData.totalLiquidityBNB = ZERO_BD
    tokenMinuteData.totalLiquidityUSD = ZERO_BD

    tokenMinuteData.token0Open = token.derivedBNB.times(bundle.bnbPrice)
    tokenMinuteData.token0High = token.derivedBNB.times(bundle.bnbPrice)
    tokenMinuteData.token0Low = token.derivedBNB.times(bundle.bnbPrice)
    tokenMinuteData.token0Close = token.derivedBNB.times(bundle.bnbPrice)

    tokenMinuteData.save()
  }
  tokenMinuteData = TokenMinuteData.load(tokenMinuteID)
  tokenMinuteData.priceUSD = token.derivedBNB.times(bundle.bnbPrice)
  tokenMinuteData.totalLiquidityToken = token.totalLiquidity
  tokenMinuteData.totalLiquidityBNB = token.totalLiquidity.times(token.derivedBNB as BigDecimal)
  tokenMinuteData.totalLiquidityUSD = tokenMinuteData.totalLiquidityBNB.times(bundle.bnbPrice)
  tokenMinuteData.minuteTxns = tokenMinuteData.minuteTxns.plus(ONE_BI)

  tokenMinuteData.token0Close = token.derivedBNB.times(bundle.bnbPrice)

  if(tokenMinuteData.token0High < token.derivedBNB.times(bundle.bnbPrice)){
    tokenMinuteData.token0High = token.derivedBNB.times(bundle.bnbPrice);
  }

  if(tokenMinuteData.token0Low > token.derivedBNB.times(bundle.bnbPrice)){
    tokenMinuteData.token0Low = token.derivedBNB.times(bundle.bnbPrice);
  }

  tokenMinuteData.save()
}
