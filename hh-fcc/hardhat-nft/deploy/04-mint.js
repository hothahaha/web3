const { ethers, network } = require("hardhat")

module.exports = async ({ getNamedAccounts }) => {
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    // Basic NFT
    const basicNft = await ethers.getContract("BasicNft", deployer)
    const basicMintTx = await basicNft.mintNft()
    await basicMintTx.wait(1)
    console.log(`Basic NFT index 0 has tokenURI: ${await basicNft.tokenURI(0)}`)

    // Random IPFS NFT
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = await randomIpfsNft.getMintFee()
    if (chainId === 31337) {
        const subscriptionId = await randomIpfsNft.getSubscriptionId()
        const vrfCoordinatorV2_5Mock = await ethers.getContract("VRFCoordinatorV2_5Mock")
        await vrfCoordinatorV2_5Mock.addConsumer(subscriptionId, randomIpfsNft.target)
    }

    const randomIpfsNftMintTx = await randomIpfsNft.requestNft({
        value: mintFee.toString(),
    })
    const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1)
    await new Promise(async (resolve, reject) => {
        setTimeout(() => reject("Timeout: 'NFTMinted' event did not fire"), 300000) // 5 minutes
        await randomIpfsNft.once("NftMinted", async () => {
            console.log(`Random IPFS NFT index 0 tokenURI: ${await randomIpfsNft.tokenURI(0)}`)
            resolve()
        })
        if (chainId === 31337) {
            const requestId = randomIpfsNftMintTxReceipt.logs[1].topics[1].toString()
            const vrfCoordinatorV2_5Mock = await ethers.getContract(
                "VRFCoordinatorV2_5Mock",
                deployer,
            )
            await vrfCoordinatorV2_5Mock.fulfillRandomWords(requestId, randomIpfsNft.target)
        }
    })

    // Dynamic SVG NFT
    const highValue = ethers.parseEther("4000")
    const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
    const dynamicSvgMintTx = await dynamicSvgNft.mintNft(highValue.toString())
    await dynamicSvgMintTx.wait(1)
    console.log(`Dynamic SVG NFT index 0 has tokenURI: ${await dynamicSvgNft.tokenURI(0)}`)
}

module.exports.tags = ["all", "mint"]
