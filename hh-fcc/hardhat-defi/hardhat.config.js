require("@nomicfoundation/hardhat-toolbox")
require("hardhat-deploy")
require("hardhat-deploy-ethers")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const MAINNET_RPC_URL =
    process.env.MAINNET_RPC_URL || "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.io"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ""

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        compilers: [
            { version: "0.8.24" },
            { version: "0.4.19" },
            { version: "0.6.6" },
            { version: "0.6.12" },
        ],
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            forking: {
                url: MAINNET_RPC_URL,
            },
            blockConfirmationTime: 1,
        },
        sepolia: {
            chainId: 11155111,
            blockConfirmationTime: 6,
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
        },
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
        },
        player: {
            default: 1, // here this will by default take the second account as player
        },
    },
    gasReporter: {
        enabled: false,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "ETH",
    },
    mocha: {
        timeout: 200000, // 200s
    },
}
