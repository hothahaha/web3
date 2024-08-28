// imports
import { ethers, run, network } from "hardhat"

// async main
async function main() {
    const SimpleStorageFactory = await ethers.getContractFactory(
        "SimpleStorage"
    )
    console.log("Deploying SimpleStorage...")
    const simpleStorage = await SimpleStorageFactory.deploy()
    console.log(`Deployed contract to : ${simpleStorage.target}`)
    if(network.config.chainId === 11155111 && process.env.ETHERSCAN_API_KEY) {
        console.log("Block...")
        // @ts-ignore
        await simpleStorage.deploymentTransaction().wait(6)
        console.log("Preparing to verify...")
        await verfiy(typeof simpleStorage.target === "string" ? simpleStorage.target : "", [])
    }

    const currentValue = await simpleStorage.retrieve();
    console.log(`Current value: ${currentValue}`)

    // Update the current value
    const transcationResponse = await simpleStorage.store(7)
    await transcationResponse.wait(1)
    const updatedValue = await simpleStorage.retrieve();
    console.log(`Updated value: ${updatedValue}`)
}

async function verfiy(contractAddress: string, args: any[] ) {
    console.log("Verifying contract...")
    try{
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    }catch (e: any) {
        if(e.message.toLowerCase().includes("already verified")) {
            console.log("Contract already verified")
        }else{
            console.error(e)
        }
    }

}

// main
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
