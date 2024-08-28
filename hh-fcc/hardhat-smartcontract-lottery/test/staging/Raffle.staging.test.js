const { assert, expect } = require("chai")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { ethers, network, deployments, getNamedAccounts } = require("hardhat")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", () => {
          let raffle, raffleEntranceFee, deployer, accounts, provider
          const chainId = network.config.chainId

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee() // 获取入场费
          })

          describe("fulfillRandomWords", () => {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async () => {
                  const startingTimeStamp = await raffle.getLatestTimeStamp() // 获取上一次抽奖的时间戳
                  const accounts = await ethers.getSigners()

                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              // add our asserts here
                              const winner = await raffle.getWinner() // 获取抽奖结果
                              const raffleState = await raffle.getRaffleState() // 获取抽奖状态
                              const winnerEndingBalance = await accounts[0].getBalance() // 获取抽奖结果的账户余额
                              const endingTimeStamp = await raffle.getLatestTimeStamp() // 获取本次抽奖的时间戳

                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(winner.toString(), accounts[0].address)
                              assert.equal(raffleState.toString(), "0")
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  (winnerStartingBalance + raffleEntranceFee).toString(),
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      // Then entering the raffle
                      await raffle.enterRaffle({ value: raffleEntranceFee }) // 参与抽奖
                      const winnerStartingBalance = await accounts[0].getBalance() // 获取参与抽奖的账户余额
                      // and this code WONT complete until our listener has finished listening!
                  })
              })
          })
      })
