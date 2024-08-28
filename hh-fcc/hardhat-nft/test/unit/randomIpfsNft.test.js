const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random IPFS NFT Unit Tests", function () {
          let accounts, deployer, randomIpfsNft, vrfCoordinatorV2_5Mock

          before(async function () {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["mocks", "randomipfs"])
              randomIpfsNft = await ethers.getContract("RandomIpfsNft")
              vrfCoordinatorV2_5Mock = await ethers.getContract("VRFCoordinatorV2_5Mock")
          })

          describe("constructor", () => {
              it("sets starting values correctly", async () => {
                  const dogTokenUriZero = await randomIpfsNft.getDogTokenUris(0)
                  const isInitialized = await randomIpfsNft.getInitialized()
                  assert(dogTokenUriZero.includes("ipfs://"))
                  assert.equal(isInitialized, true)
              })
          })

          describe("requestNft", () => {
              it("fails if payment isn't sent with the reqeust", async () => {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWithCustomError(
                      randomIpfsNft,
                      "RandomIpfsNft__NeedMoreETHSent",
                  )
              })

              it("reverts if payment amount is less than the mint fee", async () => {
                  const fee = await randomIpfsNft.getMintFee()
                  await expect(
                      randomIpfsNft.requestNft({ value: fee - ethers.parseEther("0.000000001") }),
                  ).to.be.revertedWithCustomError(randomIpfsNft, "RandomIpfsNft__NeedMoreETHSent")
              })

              it("emits an event and kicks off a random word request", async () => {
                  const fee = await randomIpfsNft.getMintFee()
                  const subscriptionId = await randomIpfsNft.getSubscriptionId()
                  const vrfCoordinatorV2_5Mock = await ethers.getContract("VRFCoordinatorV2_5Mock")
                  await vrfCoordinatorV2_5Mock.addConsumer(subscriptionId, randomIpfsNft.target)
                  await expect(randomIpfsNft.requestNft({ value: fee.toString() })).to.emit(
                      randomIpfsNft,
                      "NftRequested",
                  )
              })
          })

          describe("fulfillRandomWords", () => {
              it("mints NFT after random number is returned", async function () {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async (tokenId, breed, minter) => {
                          try {
                              const tokenUri = await randomIpfsNft.tokenURI(tokenId.toString())
                              const tokenCounter = await randomIpfsNft.getTokenCounter()
                              const dogUri = await randomIpfsNft.getDogTokenUris(breed.toString())
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              assert.equal(dogUri.toString(), tokenUri.toString())
                              assert.equal(+tokenCounter.toString(), +tokenId.toString() + 1)
                              assert.equal(minter, deployer.address)
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const fee = await randomIpfsNft.getMintFee()
                          const subscriptionId = await randomIpfsNft.getSubscriptionId()
                          const vrfCoordinatorV2_5Mock =
                              await ethers.getContract("VRFCoordinatorV2_5Mock")
                          await vrfCoordinatorV2_5Mock.addConsumer(
                              subscriptionId,
                              randomIpfsNft.target,
                          )
                          const requestNftResponse = await randomIpfsNft.requestNft({
                              value: fee.toString(),
                          })
                          const requestNftReceipt = await requestNftResponse.wait(1)
                          await vrfCoordinatorV2_5Mock.fulfillRandomWords(
                              requestNftReceipt.logs[1].topics[1],
                              randomIpfsNft.target,
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })

          describe("getBreedFromModdedRng", () => {
              it("should return pug if moddedRng < 10", async function () {
                  const expectedValue = await randomIpfsNft.getBreedFromModdedRng(7)
                  assert.equal(0, expectedValue)
              })
              it("should return shiba-inu if moddedRng is between 10 - 39", async function () {
                  const expectedValue = await randomIpfsNft.getBreedFromModdedRng(21)
                  assert.equal(1, expectedValue)
              })
              it("should return st. bernard if moddedRng is between 40 - 99", async function () {
                  const expectedValue = await randomIpfsNft.getBreedFromModdedRng(77)
                  assert.equal(2, expectedValue)
              })
              it("should revert if moddedRng > 99", async function () {
                  await expect(randomIpfsNft.getBreedFromModdedRng(100)).to.be.revertedWith(
                      "RandomIpfsNft__RangeOutOfBounds",
                  )
              })
          })
      })