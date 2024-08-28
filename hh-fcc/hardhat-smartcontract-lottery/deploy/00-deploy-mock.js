const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = "250000000000000000" // 0.25 is the premium. It costs 0.25 LINK per request.
const GAS_PRICE_LINK = 1e9 // calculated value based on the gas price of the chain.
const WEIPERUNITLINK = 4038481770777446n

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK, WEIPERUNITLINK]

    // if (developmentChains.includes(network.name)) {
    log("Local network detected! Deploying mocks...")
    // deploy a mock vrfcoordinator...
    await deploy("VRFCoordinatorV2_5Mock", {
        from: deployer,
        args: args,
        log: true,
    })
    log("Mocks Deployed!")
    log("-------------------------------------------------")
    // }
}

module.exports.tags = ["all", "mocks"]
