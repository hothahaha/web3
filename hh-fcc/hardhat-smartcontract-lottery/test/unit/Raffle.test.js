const { assert, expect } = require("chai")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { ethers, network, deployments, getNamedAccounts } = require("hardhat")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", () => {
          let raffle,
              raffleContract,
              vrfCoordinatorV2Mock,
              raffleEntranceFee,
              player,
              interval,
              accounts,
              provider
          const chainId = network.config.chainId

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              provider = ethers.provider
              // deployer = accounts[0]
              player = accounts[1]
              await deployments.fixture(["all"])
              raffleContract = await ethers.getContract("Raffle")
              raffle = raffleContract.connect(player)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
              raffleEntranceFee = await raffle.getEntranceFee() // 获取入场费
              interval = await raffle.getInterval() // 获取抽奖时间间隔
          })
          describe("constructor", () => {
              it("initializes the raffle correctly", async () => {
                  const raffleState = await raffle.getRaffleState()
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(interval.toString(), networkConfig[chainId]["interval"])
              })
          })
          describe("enterRaffle", () => {
              it("reverts when you don't pay enough", async () => {
                  await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(
                      raffle,
                      "Raffle__NotEnoughETHEntered",
                  )
              })
              it("records players when they enter", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  console.log(`player======> ${player.address}`)
                  const playerFromContract = await raffle.getPlayer(0)
                  assert.equal(playerFromContract, player.address)
              })
              /**
               * test event
               */
              it("emits event on enter", async () => {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
                      raffle,
                      "RaffleEnter",
                  )
              })
              it("does not allow entrance when raffle is calculating", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  await raffle.performUpkeep("0x")
                  await expect(
                      raffle.enterRaffle({ value: raffleEntranceFee }),
                  ).to.be.revertedWithCustomError(raffle, "Raffle__NotOpen")
              })
          })
          describe("checkUpkeep", () => {
              it("returns false if people haven't sent any ETH", async () => {
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x")
                  assert(!upkeepNeeded)
              })
              it("returns false if raffle is not open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  await raffle.performUpkeep("0x")
                  const raffleState = await raffle.getRaffleState()
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x")
                  assert.equal(raffleState.toString(), "1")
                  assert.equal(upkeepNeeded, false)
              })
              it("returns false if enough time hasn't passed", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) - 5])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x")
                  console.log(`upkeepNeeded======> ${upkeepNeeded}`)
                  assert(!upkeepNeeded)
              })
              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall("0x")
                  assert(upkeepNeeded)
              })
          })
          describe("performUpkeep", () => {
              it("it can only run if checkupkeep is true", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const tx = await raffle.performUpkeep("0x")
                  assert(tx)
              })
              it("reverts if checkupkeep is false", async () => {
                  await expect(raffle.performUpkeep("0x")).to.be.revertedWithCustomError(
                      raffle,
                      "Raffle_UpkeepNotNeeded",
                  )
              })
              it("updates the raffle state, emits and event, and calls the vrf coordinator", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const tx = await raffle.performUpkeep("0x")
                  const txReceipt = await tx.wait(1)
                  const raffleState = await raffle.getRaffleState()
                  const requestId = txReceipt.logs[1].topics[1]
                  assert(Number(requestId) > 0)
                  assert(raffleState.toString() === "1")
              })
          })
          describe("fulfillRandomWords", () => {
              beforeEach(async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [Number(interval) + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
              })
              it("can only be called after performUpkeep", async () => {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.target),
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.target),
                  ).to.be.revertedWith("nonexistent request")
              })
              // Wayyyyy to big
              it("picks a winner, resets the lottery, and sends money", async () => {
                  const additonalEntrants = 3n // add 3 more entrants to make sure there are enough to win
                  const startingAccountIndex = 1n // deployer is at index 0
                  let winnerStartingBalance
                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additonalEntrants;
                      i++
                  ) {
                      const accountConnectedRaffle = raffle.connect(accounts[i])
                      await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee })
                  }
                  const startingTimeStamp = await raffle.getLatestTimeStamp()

                  // performUpkeep (mock being Chainlink keepers
                  // fulfillRandomWords (mock being Chainlink VRF)
                  // We will have to wait for the fulfillRandomWords to be called
                  await new Promise(async (resolve, reject) => {
                      // setTimeout(resolve, 5000)
                      // listen for fulfillRandomWords event 'WinnerPicked'
                      console.log("Found the event!")
                      raffle.once("WinnerPicked", async () => {
                          try {
                              const winner = await raffle.getWinner()
                              console.log(`winner======> ${winner}`)
                              console.log(accounts[2].address)
                              console.log(accounts[0].address)
                              console.log(accounts[1].address)
                              console.log(accounts[3].address)
                              const raffleState = await raffle.getRaffleState()
                              const endingTimeStamp = await raffle.getLatestTimeStamp()
                              const numPlayers = await raffle.getNumberOfPlayers()
                              const winnerEndingBalance = await provider.getBalance(
                                  accounts[1].address,
                              )

                              assert.equal(winner.toString(), accounts[1].address)
                              assert.equal(numPlayers.toString(), "0")
                              assert.equal(raffleState.toString(), "0")
                              assert(endingTimeStamp > startingTimeStamp)

                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  (
                                      winnerStartingBalance +
                                      (raffleEntranceFee * additonalEntrants + raffleEntranceFee)
                                  ).toString(),
                              )
                              resolve()
                          } catch (e) {
                              reject(e)
                          }
                      })
                      // Setting up the listener
                      // below, we will fire the event, and the listener will pick it up, and resolve
                      const tx = await raffle.performUpkeep("0x")
                      const txReceipt = await tx.wait(1)
                      winnerStartingBalance = await provider.getBalance(accounts[1].address)
                      // winnerStartingBalance = await accounts[1].getBalance()
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.logs[1].topics[1],
                          raffle.target,
                      )
                  })
              })
          })
      })
