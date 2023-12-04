/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if, import/no-dynamic-require, global-require */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved, no-restricted-syntax */
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { ethers } = require("hardhat");

async function main() {
  // bridge address
  let BRIDGE_ADDRESS = process.env.BRIDGE_ADDRESS;

  // Load providers for both networks
  let rootchainProvider = new ethers.providers.JsonRpcProvider(
    process.env.ROOTCHAIN_URL
  );
  let childchainProvider = new ethers.providers.JsonRpcProvider(
    process.env.CHILDCHAIN_URL
  );

  // Get deployers for both networks
  let deployerRootchain;
  let deployerChildChain;

  if (process.env.PRIVATE_KEY_ROOTCHAIN && process.env.PRIVATE_KEY_CHILDCHAIN) {
    // Load deployer
    deployerRootchain = new ethers.Wallet(
      process.env.PRIVATE_KEY_ROOTCHAIN,
      rootchainProvider
    );
    deployerChildChain = new ethers.Wallet(
      process.env.PRIVATE_KEY_CHILDCHAIN,
      childchainProvider
    );
    console.log(`Deployer Rootchain: ${deployerRootchain.address}`);
    console.log(`Deployer ChildChain: ${deployerChildChain.address}`);
  } else {
    throw new Error("PRIVATE_KEY not found in .env file");
  }

  // Deploy Ping sender on goerli / zkevm mainnet
  const pingSenderFactory = await ethers.getContractFactory(
    "PingSender",
    deployerRootchain
  );
  const pingSenderContract = await pingSenderFactory.deploy(BRIDGE_ADDRESS);
  await pingSenderContract.deployed();

  console.log("Ping sender deployed on: ", pingSenderContract.address);

  // Deploy Ping receiver on zkevm testnet /zkevm mainnet
  const pingREceiverFactory = await ethers.getContractFactory(
    "PingReceiver",
    deployerChildChain
  );
  const pingReceiverContract = await pingREceiverFactory.deploy(BRIDGE_ADDRESS);
  await pingReceiverContract.deployed();

  // Set address on both networks
  await pingSenderContract.setReceiver(pingReceiverContract.address);
  await pingReceiverContract.setSender(pingSenderContract.address);

  // Write output
  const outputJson = {
    pingSenderContract: pingSenderContract.address,
    pingReceiverContract: pingReceiverContract.address,
  };
  const pathOutputJson = path.join(__dirname, "./pingPong_output.json");
  fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
