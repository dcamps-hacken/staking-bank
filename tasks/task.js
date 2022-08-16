const { task } = require("hardhat/config");

let deployer;
const wizardAddress = "0x609fB1523F468e6d4e0Cd7B0F9DcCcc6E4a0B62c";
const bankAddress = "0xC3476d21cb44914C3AB457F4BB2F47841024bd65";

task("balance", "returns the balance of Wizard test tokens").setAction(
  async () => {
    console.log("Reading token balance...");
    [deployer] = await ethers.getSigners();
    bank = await ethers.getContract("Bank", bankAddress);
    wizard = await ethers.getContractAt("Wizard", wizardAddress, deployer);

    const weiBalance = (await wizard.balanceOf(deployer.address)).toString();
    const balance = ethers.utils.formatEther(weiBalance);
    console.log(`=> your balance of Wizard tokens is now ${balance}`);
  }
);

task("mint", "mints Wizard test tokens")
  .addParam("amount", "amount of tokens to mint")
  .setAction(async (taskArgs) => {
    console.log("Minting tokens...");
    [deployer] = await ethers.getSigners();
    bank = await ethers.getContract("Bank", bankAddress);
    wizard = await ethers.getContractAt("Wizard", wizardAddress, deployer);

    const amount = taskArgs.amount.toString();
    const mint = await wizard.mint(deployer.address, amount);
    await mint.wait();

    const weiBalance = (await wizard.balanceOf(deployer.address)).toString();
    const balance = ethers.utils.formatEther(weiBalance);
    console.log(`=> you have successfully minted ${amount} tokens`);
  });

task("deposit", "deposit wizard tokens in the bank")
  .addParam("amount", "amount of tokens to mint")
  .setAction(async (taskArgs) => {
    console.log("Depositing tokens...");
    [deployer] = await ethers.getSigners();
    bank = await ethers.getContract("Bank", bankAddress);
    wizard = await ethers.getContractAt("Wizard", wizardAddress, deployer);
    const amount = taskArgs.amount.toString();
    const approve = await wizard
      .connect(deployer)
      .approve(bank.address, amount);
    await approve.wait();

    // deposit tokens
    const deposit = await bank.connect(deployer).deposit(amount);
    await deposit.wait();
    console.log(`=> you have successfully deposited ${amount} tokens`);
  });

task("withdraw", "withdraw wizard tokens from the bank").setAction(async () => {
  console.log("Withdrawing tokens...");
  [deployer] = await ethers.getSigners();
  bank = await ethers.getContract("Bank", bankAddress);
  wizard = await ethers.getContractAt("Wizard", wizardAddress, deployer);
  const withdraw = await bank.connect(deployer).withdraw();
  await withdraw.wait();
  console.log(`=> you have successfully withdrawn your tokens`);
});

task("retrieve", "recall the deposited reward").setAction(async () => {
  console.log("Retrieving tokens...");
  bank = await ethers.getContract("Bank", bankAddress);
  wizard = await ethers.getContractAt("Wizard", wizardAddress, deployer);
  [deployer] = await ethers.getSigners();
  const retrieve = await bank.connect(deployer).recall();
  await retrieve.wait();
  console.log(`=> you have successfully retrieved your tokens`);
});
