const networkConfig = {
    31337: {
        name: "localhost",
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
        gasLane: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae", // 30 gwei
        mintFee: "10000000000000", // 0.00001 ETH
        callbackGasLimit: "500000", // 500,000 gas
    },
    // Price Feed Address, values can be obtained at https://docs.chain.link/data-feeds/price-feeds/addresses
    11155111: {
        name: "sepolia",
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
        vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        gasLane: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        callbackGasLimit: "500000", // 500,000 gas
        mintFee: "10000000000000", // 0.00001 ETH
        subscriptionId:
            "48146606123389034119269388057707902110479942126811981665332213894828502259205", // add your ID here!
    },
}

const DECIMALS = 8
const INITIAL_VALUE = 200000000000
const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6

module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_VALUE,
    VERIFICATION_BLOCK_CONFIRMATIONS,
}
