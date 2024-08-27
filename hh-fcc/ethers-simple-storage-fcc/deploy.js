const ethers_ = require("ethers");
const fs_ = require("fs-extra");
require("dotenv").config();

async function main() {
  const provider = new ethers_.JsonRpcProvider(process.env.RPC_URL);
  const encryptedJson = fs_.readFileSync("./.encryptedKey.json", "utf8");
  let wallet = ethers_.Wallet.fromEncryptedJsonSync(
    encryptedJson,
    process.env.PRIVATE_KEY_PASSWORD,
  );
  wallet = await wallet.connect(provider);
  const abi = fs_.readFileSync("./SimpleStorage_sol_SimpleStorage.abi", "utf8");
  const binary = fs_.readFileSync(
    "./SimpleStorage_sol_SimpleStorage.bin",
    "utf8",
  );
  const contractFactory = new ethers_.ContractFactory(abi, binary, wallet);
  console.log("Deploying, please wait...");
  const contract = await contractFactory.deploy();
  await contract.waitForDeployment();

  const currentFavoriteNumber = await contract.retrieve;
  console.log(`Current Favorite Number: ${currentFavoriteNumber.toString()}`);
  // const tansactionResponse = await contract.store("7");
  const tansactionResponse = await contract.store("7");
  // await tansactionResponse.wait(1);
  // const updateFavoriteNumber = await contract.retrieve();
  const updateFavoriteNumber = await contract.retrieve();
  console.log(`Update Favorite Number: ${updateFavoriteNumber.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
