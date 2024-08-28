const { ethers, network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { MaxUint256 } = require("@ethersproject/constants")

const VRF_SUB_FUND_AMOUNT = 2000000000000000000n

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2Address, subscriptionId

    if (!developmentChains.includes(network.name)) {
        const vrfCoordinatorV2_5Mock = await ethers.getContract("VRFCoordinatorV2_5Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2_5Mock.target
        const txResponse = await vrfCoordinatorV2_5Mock.createSubscription()
        const txReceipt = await txResponse.wait()
        subscriptionId = txReceipt.logs[0].args.subId
        // subscriptionId = networkConfig[chainId]["subscriptionId"]
        console.log("subscriptionId:", subscriptionId)
        // Fund the subscription with LINK
        // Usually, you'd need the link token on a real network, but for development, we can use the mock
        // await vrfCoordinatorV2_5Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]
    const args = [
        vrfCoordinatorV2Address,
        entranceFee,
        gasLane,
        subscriptionId,
        callbackGasLimit,
        interval,
    ]
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    // resolve the problem which in vrfCoordinatorV2_5Mock named "reverted with custom error 'InvalidConsumer()'"
    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2_5Mock = await ethers.getContract("VRFCoordinatorV2_5Mock")
        await vrfCoordinatorV2_5Mock.addConsumer(subscriptionId, raffle.address)
        log("adding consumer...")
        log("Consumer added!")
    }

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying Raffle on Etherscan...")
        await verify(raffle.target, args)
    }

    log("-----------------------------------------------")

    console.log("Raffle deployed to:", raffle.target)
}

module.exports.tags = ["all", "Raffle"]
