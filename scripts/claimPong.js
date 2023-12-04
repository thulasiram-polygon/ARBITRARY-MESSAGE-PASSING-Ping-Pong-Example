/* eslint-disable no-await-in-loop */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const { ethers } = require("hardhat");
const AXIOS = require("axios");
const mekrleProofString = "/merkle-proof";
const getClaimsFromAcc = "/bridges/";

const pathPingPongOutput = path.join(
  __dirname,
  "../deployment/pingPong_output.json"
);
const pingReceiverContractAddress =
  require(pathPingPongOutput).pingReceiverContract;

async function main() {
  // bridge address
  let BRIDGE_ADDRESS = process.env.BRIDGE_ADDRESS;
  const CHILD_CHAIN_BRIDGE_URL = process.env.CHILD_CHAIN_BRIDGE_API_URL;

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

  const axios = await AXIOS.default.create({
    baseURL: CHILD_CHAIN_BRIDGE_URL,
  });

  const bridgeChildChainFactory = await ethers.getContractFactory(
    "PolygonZkEVMBridge",
    deployerChildChain
  );
  const bridgeContractChildchain =
    bridgeChildChainFactory.attach(BRIDGE_ADDRESS);

  const depositAxions = await axios.get(
    getClaimsFromAcc + pingReceiverContractAddress,
    { params: { limit: 100, offset: 0 } }
  );
  console.log("depositAxions: ", depositAxions.data);
  const depositsArray = depositAxions.data.deposits;

  if (depositsArray.length === 0) {
    console.log("Not ready yet!");
    return;
  }

  for (let i = 0; i < depositsArray.length; i++) {
    const currentDeposit = depositsArray[i];
    if (currentDeposit.ready_for_claim) {
      const proofAxios = await axios.get(mekrleProofString, {
        params: {
          deposit_cnt: currentDeposit.deposit_cnt,
          net_id: currentDeposit.orig_net,
        },
      });

      const { proof } = proofAxios.data;
      const claimTx = await bridgeContractChildchain.claimMessage(
        proof.merkle_proof,
        currentDeposit.deposit_cnt,
        proof.main_exit_root,
        proof.rollup_exit_root,
        currentDeposit.orig_net,
        currentDeposit.orig_addr,
        currentDeposit.dest_net,
        currentDeposit.dest_addr,
        currentDeposit.amount,
        currentDeposit.metadata
      );
      console.log("claim message succesfully send: ", claimTx.hash);
      await claimTx.wait();
      console.log("claim message succesfully mined");
    } else {
      console.log("bridge not ready for claim");
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
