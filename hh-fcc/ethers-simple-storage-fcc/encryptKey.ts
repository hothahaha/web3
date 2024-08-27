// const ethers = require("ethers");
// const fs_ = require("fs-extra");
// require("dotenv").config();

import { ethers as ethers_ } from "ethers";
import fs_ from "fs-extra";
import "dotenv/config";

async function main() {
  const wallet = new ethers_.Wallet(process.env.PRIVATE_KEY!);
  const encryptedJsonKey = fs_.readFileSync("./.encryptedKey.json", "utf8");
  console.log(encryptedJsonKey);
  fs_.writeFileSync("./.encryptedKey.json", encryptedJsonKey);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
