const { ethers } = require("hardhat")

const networkConfig = {
    11155111: {
        name: "sepolia testnet",
        vrfCoordinatorV2: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
        entranceFee: ethers.parseEther("0.00001"),
        gasLane: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        subscriptionId:
            "48146606123389034119269388057707902110479942126811981665332213894828502259205",
        callbackGasLimit: "500000",
        interval: "30",
    },
    31337: {
        name: "hardhat",
        entranceFee: ethers.parseEther("0.00001"),
        gasLane: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        subscriptionId: "0",
        callbackGasLimit: "500000",
        interval: "30",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
