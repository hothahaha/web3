const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const { storeImage, storeTokenUrlMetadata } = require("../utils/uploadToPinata")

const imagesLocation = "./images/randomNft"

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
}

let tokenUris = [
    "ipfs://QmP8RdJU7RoKSH88F5Ei6GEf7R5KWUA1V11zLYmPGwrJdL",
    "ipfs://QmUDWCX8AYbmPLYQkBFjankK1qJSgpsHZK9cxV6fVHoJqD",
    "ipfs://QmWjs1LXwCsVt8ZechZsWga5SpG1i8i96CDG1cbrhYZBj6",
]

const FUND_AMOUNT = ethers.parseEther("100")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // get the IPFS hashes of our images
    if (process.env.UPLOAD_TO_PINATA === "true") {
        tokenUris = await handleTokenUris()
    }

    // 1. With our own IPFS node. https://docs.ipfs.io/how-to/command-line-quick-start/
    // 2. Pinata https://www.pinata.cloud/
    // 3. NFT.Storage https://nft.storage/

    let vrfCoordinatorV2Address, subscriptionId

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2_5Mock = await ethers.getContract("VRFCoordinatorV2_5Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2_5Mock.target
        const txResponse = await vrfCoordinatorV2_5Mock.createSubscription()
        const txReceipt = await txResponse.wait()
        subscriptionId = txReceipt.logs[0].args.subId
        await vrfCoordinatorV2_5Mock.fundSubscription(subscriptionId, FUND_AMOUNT) // subscriptionId = networkConfig[chainId]["subscriptionId"]
        console.log("subscriptionId:", subscriptionId)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    log("----------------------------------------------------")
    // await storeImage(imagesLocation)

    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const mintFee = networkConfig[chainId]["mintFee"]
    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        gasLane,
        callbackGasLimit,
        tokenUris,
        mintFee,
    ]
    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    log("----------------------------------------------------")

    // resolve the problem which in vrfCoordinatorV2_5Mock named "reverted with custom error 'InvalidConsumer()'"
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(randomIpfsNft.address, args)
    } else {
        const vrfCoordinatorV2_5Mock = await ethers.getContract("VRFCoordinatorV2_5Mock")
        await vrfCoordinatorV2_5Mock.addConsumer(subscriptionId, randomIpfsNft.address)
    }

    async function handleTokenUris() {
        tokenUris = []
        // store the Image in IPFS
        // store the metadata in IPFS
        const { responses: imageUploadResponse, files } = await storeImage(imagesLocation)
        for (let imageUploadResponseIndex in imageUploadResponse) {
            // create metadata
            // upload metadata to IPFS
            let tokenUriMetadata = { ...metadataTemplate }
            tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "")
            tokenUriMetadata.description = `Ad adorable ${tokenUriMetadata.name} pup!`
            tokenUriMetadata.image = `ipfs://${imageUploadResponse[imageUploadResponseIndex].IpfsHash}`
            console.log(`Uploading ${tokenUriMetadata.name}...`)
            // sotre the JSON to pinata IPFS
            const metadataUploadResponse = await storeTokenUrlMetadata(tokenUriMetadata)
            tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
        }
        console.log("Token URIs Uploaded! They are:")
        console.log(tokenUris)
        return tokenUris
    }
}

module.exports.tags = ["all", "randomipfs", "main"]
