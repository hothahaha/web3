import "@nomicfoundation/hardhat-toolbox"
import "dotenv/config"
import "./tasks/block-number"
import "hardhat-gas-reporter"
import "solidity-coverage"
import "@typechain/hardhat"

import {ProxyAgent, setGlobalDispatcher} from "undici";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.io";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";
const proxyAgent = new ProxyAgent("http://127.0.0.1:7890");

setGlobalDispatcher(proxyAgent);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 31337
        }
    },
    solidity: "0.8.7",
    etherscan: {
        apiKey: ETHERSCAN_API_KEY
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY
    },
    mocha: {
        timeout: 100000000 // or any time value that suits your project
    }
};
