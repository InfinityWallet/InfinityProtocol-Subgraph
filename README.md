# Infinity Protocol Subgraph

[Infinity Protocol](https://infinitycrypto.com/) is a decentralized protocol for automated token exchange on Binance Smart Chain.

This subgraph dynamically tracks any pair created by the Infinity Protocol factory. It tracks of the current state of Infinity Protocol contracts, and contains derived stats for things like historical data and USD prices.

- aggregated data across pairs and tokens,
- data on individual pairs and tokens,
- data on transactions
- data on liquidity providers
- historical data on Infinity Protocol, pairs or tokens, aggregated by day

## Running Locally

Make sure to update package.json settings to point to your own graph account.

## Queries

Below are a few ways to show how to query the infinity-subgraph for data. The queries show most of the information that is query-able, but there are many other filtering options that can be used, just check out the [querying api](https://thegraph.com/docs/graphql-api). These queries can be used locally or in The Graph Explorer playground.

## Key Entity Overviews

#### InfinityFactory

Contains data across all of Infinity Protocol. This entity tracks important things like total liquidity (in ETH and USD, see below), all time volume, transaction count, number of pairs and more.

#### Token

Contains data on a specific token. This token specific data is aggregated across all pairs, and is updated whenever there is a transaction involving that token.

#### Pair

Contains data on a specific pair.

#### Transaction

Every transaction on Infinity Protocol is stored. Each transaction contains an array of mints, burns, and swaps that occurred within it.

#### Mint, Burn, Swap

These contain specific information about a transaction. Things like which pair triggered the transaction, amounts, sender, recipient, and more. Each is linked to a parent Transaction entity.

## Example Queries

### Querying Aggregated Infinity Protocol Data

This query fetches aggregated data from all Infinity Protocol pairs and tokens, to give a view into how much activity is happening within the whole protocol.

```graphql
{
  infinityswapFactories(first: 1) {
    pairCount
    totalVolumeUSD
    totalLiquidityUSD
  }
}
```
