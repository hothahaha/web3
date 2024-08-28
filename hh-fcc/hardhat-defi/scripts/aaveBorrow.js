const { getWeth, AMOUNT } = require("../scripts/getWeth")
const { ethers } = require("hardhat")

async function main() {
    await getWeth()
    const signer = await ethers.provider.getSigner()
    // Lending Pool Address Provider: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
    const lendingPool = await getLendingPool(signer)
    console.log("Lending Pool Address:", lendingPool.target)

    // deposit!
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    // approve!
    await approveErc20(wethTokenAddress, lendingPool.target, AMOUNT, signer)
    console.log("Depositing...")
    await lendingPool.deposit(wethTokenAddress, AMOUNT, signer, 0)
    console.log("Deposited!")

    let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, signer)
    // availableBorrowsETH ?? What the conversion rate on DAI is?
    const daiPrice = await getDaiPrice()
    const amountDaiToBorrow = (
        availableBorrowsETH.toString() *
        0.95 *
        (1 / Number(daiPrice))
    ).toFixed(6)
    console.log(`You can borrow ${amountDaiToBorrow} DAI.`)
    const amountDaiToBorrowWei = ethers.parseEther(amountDaiToBorrow.toString())
    // How much we have Borrowed, how much we have in collateral, how much we can borrow
    const daiBorrowAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    await borrowDai(daiBorrowAddress, lendingPool, amountDaiToBorrowWei, signer)
    await getBorrowUserData(lendingPool, signer)
    await repay(amountDaiToBorrowWei, daiBorrowAddress, lendingPool, signer)
    await getBorrowUserData(lendingPool, signer)
}

async function getLendingPool(account) {
    const LendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account,
    )
    const lendingPoolAddress = await LendingPoolAddressesProvider.getLendingPool()
    return await ethers.getContractAt("ILendingPool", lendingPoolAddress, account)
}

/**
 * Approve ERC20 token for spending by the Lending Pool
 * @param {string} erc20Address - Address of the ERC20 token
 * @param {string} spenderAddress - Address of the spender
 * @param {number} amountToSpend - Amount of tokens to spend
 * @param {ethers.Signer} account - Signer account
 */
async function approveErc20(erc20Address, spenderAddress, amountToSpend, account) {
    const erc20 = await ethers.getContractAt("IERC20", erc20Address, account)
    const approveTx = await erc20.approve(spenderAddress, amountToSpend)
    await approveTx.wait(1)
    console.log("Approved!")
}

async function getBorrowUserData(lendingPool, account) {
    const {
        totalCollateralETH,
        totalDebtETH,
        availableBorrowsETH,
        currentLiquidationThreshold,
        healthFactor,
    } = await lendingPool.getUserAccountData(account)
    console.log(`You have ${totalCollateralETH} worth of ETH deposited.`)
    console.log(`You have ${totalDebtETH} worth of ETH borrowed.`)
    console.log(`You can borrow ${availableBorrowsETH} worth of ETH.`)
    console.log(`Your current liquidation threshold is ${currentLiquidationThreshold}.`)
    console.log(`Your health factor is ${healthFactor}.`)
    return { availableBorrowsETH, totalDebtETH }
}

async function getDaiPrice() {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616E4d11A78F511299002da57A0a94577F1f4",
    )
    const latestRoundData = await daiEthPriceFeed.latestRoundData()
    const price = (await daiEthPriceFeed.latestRoundData())[1]
    console.log(`The DAI/ETH price is ${price.toString()}`)
    return price
}

async function borrowDai(daiAddress, lendingPool, amountDaiToBorrowWei, account) {
    const borrowTx = await lendingPool.borrow(daiAddress, amountDaiToBorrowWei, 2, 0, account)
    await borrowTx.wait(1)
    console.log("You've borrowed DAI!")
}

async function repay(amountToRepayWei, daiAddress, lendingPool, account) {
    await approveErc20(daiAddress, lendingPool.target, amountToRepayWei, account)
    const repayTx = await lendingPool.repay(daiAddress, amountToRepayWei, 2, account)
    await repayTx.wait(1)
    console.log("You've repaid DAI!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
