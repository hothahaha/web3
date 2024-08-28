const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const chainId = network.config.chainId
    let ethUsdPriceFeedAddress, args

    if (developmentChains.includes(network.name)) {
        const EthUsdAggregator = await ethers.getContract("MockV3Aggregator")
        ethUsdPriceFeedAddress = EthUsdAggregator.target
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    }

    const lowSVG = fs.readFileSync("./images/dynamicNft/frown.svg", { encoding: "utf-8" })
    const highSVG = fs.readFileSync("./images/dynamicNft/happy.svg", { encoding: "utf-8" })

    args = [ethUsdPriceFeedAddress, lowSVG, highSVG]
    const dynamicNft = await deploy("DynamicSvgNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(dynamicNft.address, args)
    }
}

module.exports.tags = ["all", "dynamicsvg", "main"]
