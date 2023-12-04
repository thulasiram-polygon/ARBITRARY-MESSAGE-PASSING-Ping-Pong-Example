/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if, import/no-dynamic-require, global-require */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved, no-restricted-syntax */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { ethers } = require("hardhat");

const networkIDChildChain = 1;

const pathPingPongOutput = path.join(
  __dirname,
  "../deployment/pingPong_output.json"
);
const pingSenderContractAddress =
  require(pathPingPongOutput).pingSenderContract;

async function main() {
  // Load deployer

  // Load providers for both networks
  let rootchainProvider = new ethers.providers.JsonRpcProvider(
    process.env.ROOTCHAIN_URL
  );

  // Get deployers for both networks
  let deployerRootchain;

  if (process.env.PRIVATE_KEY_ROOTCHAIN && process.env.PRIVATE_KEY_CHILDCHAIN) {
    // Load deployer
    deployerRootchain = new ethers.Wallet(
      process.env.PRIVATE_KEY_ROOTCHAIN,
      rootchainProvider
    );
    console.log(`Deployer Rootchain: ${deployerRootchain.address}`);
  } else {
    throw new Error("PRIVATE_KEY not found in .env file");
  }

  const nftBridgeFactory = await ethers.getContractFactory(
    "PingSender",
    deployerRootchain
  );
  const nftBridgeContract = nftBridgeFactory.attach(pingSenderContractAddress);

  const forceUpdateGlobalExitRoot = true; // fast bridge
  const pingValue = 69420; // Feel free to change this value with whatever you want
  const tx = await nftBridgeContract.bridgePingMessage(
    networkIDChildChain, // Send to the CDK
    forceUpdateGlobalExitRoot,
    pingValue
  );

  console.log(await tx.wait());

  console.log("Bridge done succesfully. Tx Hash:", tx.hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
