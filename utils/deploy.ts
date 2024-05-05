/* eslint-disable arrow-parens */
import { ethers } from "ethers";
import { ethers as hhEthers } from "hardhat";
import DeployHelper from "./deploys";
import { ether } from "./common";
import { ADDRESS_ZERO } from "./constants";
import { setTokenAbi } from "./abi";

async function main() {
  console.log("Starting deployment script...");

  // Connect to the Hardhat network provider
  const provider = hhEthers.provider;

  // Create a new random wallet and connect it with provider
  const randomWallet = new ethers.Wallet(
    "0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d",
  );
  const owner = randomWallet.connect(provider);

  const deployer = new DeployHelper(owner);

  console.log(`Protocol Owner & Fee Recipient: ${owner.address}`);

  // Deploy Controller
  const controller = await deployer.core.deployController(owner.address);
  console.log(`Controller deployed to address: ${controller.address}`);

  // Deploy SetTokenCreator
  const setTokenCreator = await deployer.core.deploySetTokenCreator(controller.address);
  console.log(`SetTokenCreator deployed to address: ${setTokenCreator.address}`);

  // Deploy BasicIssuanceModule
  const basicIssuanceModule = await deployer.modules.deployBasicIssuanceModule(controller.address);
  //   await controller.addModule(basicIssuanceModule.address);
  console.log(`BasicIssuanceModule deployed to address: ${basicIssuanceModule.address}`);

  // Initialize Controller with SetTokenCreator and BasicIssuanceModule
  await controller
    .connect(owner)
    .initialize([setTokenCreator.address], [basicIssuanceModule.address], [], []);

  console.log("Deployment and initialization complete.");

  // SET TOKEN CREATION

  const firstComponent = await deployer.mocks.deployTokenMock(owner.address);
  const firstComponentUnits = ether(1);
  const secondComponent = await deployer.mocks.deployTokenMock(owner.address);
  const secondComponentUnits = ether(1);

  console.log(`First Component Deploy Address: ${firstComponent.address}`);
  console.log(`First Component Units: ${firstComponentUnits}`);
  console.log(`Second Component Deploy Address: ${secondComponent.address}`);
  console.log(`Second Component Deploy Units: ${secondComponentUnits}`);

  await setTokenCreator.create(
    [firstComponent.address, secondComponent.address],
    [firstComponentUnits, secondComponentUnits],
    [basicIssuanceModule.address],
    owner.address,
    "TestSetToken",
    "SET",
  );

  // START: EXTRACT DEPLOYED CONTRACT ADDRESS FROM EVENT

  const abi = [
    "event SetTokenCreated(address indexed _setToken, address _manager, string _name, string _symbol)",
  ];
  const iface = new ethers.utils.Interface(abi);

  const topic = ethers.utils.id("SetTokenCreated(address,address,string,string)");
  const logs = await provider.getLogs({
    fromBlock: "latest",
    toBlock: "latest",
    topics: [topic],
  });

  const parsed = iface.parseLog(logs[logs.length - 1]);

  const setTokenAddress = parsed.args._setToken;

  // END: EXTRACT DEPLOYED CONTRACT ADDRESS FROM EVENT

  const setToken = new ethers.Contract(setTokenAddress, setTokenAbi, provider);

  console.log(`Set Token Address: ${setToken.address}`);

  const isTokenEnabled = await controller.isSet(setToken.address);

  console.log(`Set Token Enabled Check: ${isTokenEnabled}`);

  await basicIssuanceModule.connect(owner).initialize(setToken.address, ADDRESS_ZERO);

  const isModuleEnabled = await setToken.isInitializedModule(basicIssuanceModule.address);

  console.log(`Basic Issuance Module Enabled Check: ${isModuleEnabled}`);

  // ISSUE TOKEN

  await firstComponent.connect(owner).mint(owner.address, ether(1));
  await secondComponent.connect(owner).mint(owner.address, ether(1));

  await firstComponent.connect(owner).approve(basicIssuanceModule.address, ether(1));
  await secondComponent.connect(owner).approve(basicIssuanceModule.address, ether(1));

  await basicIssuanceModule.connect(owner).issue(setToken.address, ether(1), owner.address);

  console.log("TOKEN ISSUED!!!!");

  let balance = await setToken.balanceOf(owner.address);
  console.log(`Owner Account Balance: ${balance}`);

  // REDEEM TOKEN

  await basicIssuanceModule.connect(owner).redeem(setToken.address, ether(1), owner.address);

  console.log("TOKEN REDEEMED!!!!");

  balance = await setToken.balanceOf(owner.address);
  console.log(`Owner Account Balance: ${balance}`);
}

main().catch((error) => {
  console.error("Error in deployment script", error);
  process.exit(1);
});
