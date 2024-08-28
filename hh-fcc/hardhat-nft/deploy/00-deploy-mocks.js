const { network, ethers } = require("hardhat")
const { developmentChains, DECIMALS, INITIAL_VALUE } = require("../helper-hardhat-config")

const BASE_FEE = ethers.parseEther("0.25") // 0.25 is the premium. It costs 0.25 LINK per request.
const GAS_PRICE_LINK = 1e9 // calculated value based on the gas price of the chain.
const WEIPERUNITLINK = 4038481770777446n

module.exports = async ({ deployments, getNamedAccounts }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK, WEIPERUNITLINK]
    const args1 = [DECIMALS, INITIAL_VALUE]

    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")
        // deploy a mock vrfcoordinator...
        await deploy("VRFCoordinatorV2_5Mock", {
            from: deployer,
            args: args,
            log: true,
            gasPrice: 50000000000,
        })
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: args1,
        })
        log("Mocks Deployed!")
        log("-------------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks", "main"]
