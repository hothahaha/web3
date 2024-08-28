const { network } = require("hardhat");
const { developmentChains, DECIMALS, INITIAL_ANSWER } = require("../helper-hardhat-config")

module.exports = async ({deployments, getNamedAccounts}) => {
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();

    log(network.name)
    if(developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER]
        })
        log("Mocks deployed!")

    }
}

module.exports.tags = ["all", "mocks"]
