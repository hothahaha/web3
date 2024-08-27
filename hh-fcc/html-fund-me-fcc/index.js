// in nodejs
// require()

// in front-end javascript you can't use require()
// instead you can use import statement
// import { connectMetaMask } from './index.js';
import { ethers } from "./ethers-5.6.esm.min.js"
import { abi, contractAddress } from "./constants.js"

const connectButton = document.getElementById("connectMetaMask")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
const withdrawButton = document.getElementById("withdrawButton")

connectButton.onclick = connectMetaMask
balanceButton.onclick = getBalance
fundButton.onclick = fund
withdrawButton.onclick = withdraw
async function connectMetaMask() {
    if (typeof window.ethereum !== "undefined") {
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" })
        } catch (error) {
            console.error(error)
        }
        connectButton.innerHTML = "MetaMask Connected!"
    } else {
        connectButton.innerHTML = "MetaMask is not installed!"
    }
}

async function getBalance() {
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const balance = await provider.getBalance(contractAddress)
        console.log(`Your balance is ${ethers.utils.formatEther(balance)}`)
    }
}

// fund function
async function fund() {
    const ethAmount = document.getElementById("ethAmount").value
    console.log(`funding account with ${ethAmount}`)
    if (typeof window.ethereum !== "undefined") {
        // provider / connection to blockchain
        // signer / wallet / someone with some gas
        // contract that we are interacting with
        // ^ ABI & Address
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, abi, signer)
        try {
            const tx = await contract.fund({
                value: ethers.utils.parseEther(ethAmount),
            })
            // hey, wait for this tx to finish
            await listenForTxMine(tx, provider)
            console.log("Done!")
        } catch (error) {
            console.error(error)
        }
    }
}

function listenForTxMine(tx, provider) {
    console.log(`Mining ${tx.hash}...`)
    // return new Promise()
    // listen for this transaction to finish
    return new Promise((resolve, reject) => {
        provider.once(tx.hash, (transactionReceipt) => {
            console.log(`Completed with ${transactionReceipt.confirmations}`)
            resolve(transactionReceipt)
        })
    })
}

// withdraw function
async function withdraw() {
    if (typeof window.ethereum !== "undefined") {
        console.log("Withdrawing...")
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, abi, signer)
        try {
            const tx = await contract.withdraw()
            await listenForTxMine(tx, provider)
            console.log("Done!")
        } catch (error) {
            console.error(error)
        }
    }
}
