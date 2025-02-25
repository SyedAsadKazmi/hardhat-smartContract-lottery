const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

const VRF_SUB_FUND_AMOUNT = ethers.parseEther("100");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  let vrfCoordinatorV2_5Address, subscriptionId, vrfCoordinatorV2_5Mock;
  const entranceFee = networkConfig[network.config.chainId]["entranceFee"];
  const keyHash = networkConfig[network.config.chainId]["keyHash"];
  const callBackGasLimit =
    networkConfig[network.config.chainId]["callBackGasLimit"];
  const interval = networkConfig[network.config.chainId]["interval"];
  if (developmentChains.includes(network.name)) {
    let signer = await ethers.getSigner(deployer);
    vrfCoordinatorV2_5Mock = await ethers.getContractAt(
      "VRFCoordinatorV2_5Mock",
      (
        await deployments.get("VRFCoordinatorV2_5Mock")
      ).address,
      signer
    );
    vrfCoordinatorV2_5Address = vrfCoordinatorV2_5Mock.target;
    const transactionResponse = await vrfCoordinatorV2_5Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait(1);
    subscriptionId = transactionReceipt.logs[0].args.subId;
    await vrfCoordinatorV2_5Mock.fundSubscription(
      subscriptionId,
      VRF_SUB_FUND_AMOUNT
    );
  } else {
    vrfCoordinatorV2_5Address =
      networkConfig[network.config.chainId]["vrfCoordinatorV2"];
    console.log("vrfCoordinatorV2_5Address", vrfCoordinatorV2_5Address);
    subscriptionId = networkConfig[network.config.chainId]["subscriptionId"];
  }
  args = [
    vrfCoordinatorV2_5Address,
    entranceFee,
    keyHash,
    subscriptionId,
    callBackGasLimit,
    interval,
  ];
  const raffle = await deploy("Raffle", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying ...");
    await verify(raffle.address, args);
  }
  log("---------------------------------");
};

module.exports.tags = ["all", "raffle"];
