require("@nomicfoundation/hardhat-toolbox")
require("hardhat-deploy")
require("hardhat-deploy-ethers")
require("dotenv").config()
require("./tasks/block-number")
require("hardhat-gas-reporter")
require("solidity-coverage")

const { ProxyAgent, setGlobalDispatcher } = require("undici")

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.io"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ""
const proxyAgent = new ProxyAgent("http://127.0.0.1:7890")

setGlobalDispatcher(proxyAgent)

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
        hardhat: {
            chainId: 31337,
        },
    },
    solidity: {
        compilers: [{ version: "0.8.7" }, { version: "0.6.6" }],
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
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
        timeout: 100000000, // or any time value that suits your project
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        user: {
            default: 1,
        },
    },
}
