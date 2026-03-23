const axios = require("axios")

const FALLBACK_PRICES = {
  btc: { ngn: 92000000, usd: 62000 },
  eth: { ngn: 4800000, usd: 3200 },
  usdt: { ngn: 1315, usd: 1 }
}

let cachedPrices = { ...FALLBACK_PRICES }
let lastFetched = null

const fetchLivePrices = async () => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=ngn,usd"
    )

    cachedPrices = {
      btc: {
        ngn: response.data.bitcoin?.ngn || FALLBACK_PRICES.btc.ngn,
        usd: response.data.bitcoin?.usd || FALLBACK_PRICES.btc.usd,
      },
      eth: {
        ngn: response.data.ethereum?.ngn || FALLBACK_PRICES.eth.ngn,
        usd: response.data.ethereum?.usd || FALLBACK_PRICES.eth.usd,
      },
      usdt: {
        ngn: response.data.tether?.ngn || FALLBACK_PRICES.usdt.ngn,
        usd: response.data.tether?.usd || FALLBACK_PRICES.usdt.usd,
      },
      dollarToNairaRate: response.data.tether?.ngn
    }

    lastFetched = Date.now()

  } catch (error) {
    console.log("Price fetch failed, using fallback prices:", error.message)
  }
}

const refreshIfStale = async () => {
  const isStale = !lastFetched || Date.now() - lastFetched > 60000
  if (isStale) {
    await fetchLivePrices()
  }
}

const getCryptoPriceNGN = async (cryptoType) => {
  await refreshIfStale()
  return cachedPrices[cryptoType.toLowerCase()]?.ngn || 0
}

const getCryptoPriceUSD = async (cryptoType) => {
  await refreshIfStale()
  return cachedPrices[cryptoType.toLowerCase()]?.usd || 0
}

const getCachedPrices = async () => {
  await refreshIfStale()
  return cachedPrices
}

const calculateNairaValue = async (cryptoType, cryptoAmount) => {
  const price = await getCryptoPriceNGN(cryptoType)
  return price * parseFloat(cryptoAmount)
}

const calculateUSDValue = async (cryptoType, cryptoAmount) => {
  const price = await getCryptoPriceUSD(cryptoType)
  return price * parseFloat(cryptoAmount)
}
// const dollarToNairaRate = async()=>{
//   await refreshIfStale()
//   return cachedPrices.usdt.toLowerCase()?.ngn || FALLBACK_PRICES.usdt.ngn
// }


module.exports = {
  getCryptoPriceNGN,
  getCryptoPriceUSD,
  getCachedPrices,
  calculateNairaValue,
  calculateUSDValue,
  // dollarToNairaRate
}