# CDK Message bridge example

This folder provides an example on how to **Message Passing: Ping-Pong** using the message layer that `polygonZKEVMBridge` implements

## Requirements

- node version: >= 14.x
- npm version: >= 7.x

## Deployment ARBITRARY-MESSAGE-PASSING-BRIDGE(Ping-Pong example)

### Deployment

In project root execute:

```
npm i
cp .env.example .env
```

Fill `.env` with your

```
PRIVATE_KEY_ROOTCHAIN="Your-RootChain-private key"
PRIVATE_KEY_CHILDCHAIN="Your CDK private key"
ROOTCHAIN_URL="Root chain JSON rpc url"
CHILDCHAIN_URL="Child chain JSON rpc url"
BRIDGE_ADDRESS="CDK Bridge address"
CHILD_CHAIN_BRIDGE_API_URL="CDK Bridge API url"
```

To deploy use:`deploy:pingPong`

As example for `goerli`(or geth as root chain)/`polygonZKEVMTestnet or CDK`(as child chain) testnets:
This script will deploy on both networks the same contract using the deterministic deployment:

Once the deployment is finished, we will find the results on `pingPong_output.json`

## Using the pingpong bridge

In order to use the bridge, some scripts are provided:

```
npm run bridge:bridgePing
```

- Now we have to wait until the message is forwarded to L2, there is a final script that will check it if the claim is ready. If it is ready, it will actually claim the erc20 in the other layer:

```
npm run claim:claimPong
```
