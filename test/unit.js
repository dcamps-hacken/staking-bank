const { expect, assert } = require("chai");
const { BigNumber, constants } = require("ethers");
const { ethers } = require("hardhat");

describe("Wizard", function () {
  let totalSupply = constants.Zero;
  const initialSupply = BigNumber.from("10000000000000000000000000000");
  const minted = BigNumber.from("1000000000000000000");
  let deployer, user;
  beforeEach(async function () {
    await deployments.fixture(["token"]);
    wizard = await ethers.getContract("Wizard");
    deployer = (await getNamedAccounts()).deployer;
    user = (await getNamedAccounts()).user1;
  });
  describe("constructor", async function () {
    it("Mints initial supply of tokens", async function () {
      const deployerBalance = await wizard.balanceOf(deployer);
      assert.equal(deployerBalance.toString(), initialSupply.toString());
    });
  });
  describe("mint", async function () {
    it("Should mint additional tokens on demand", async function () {
      const userBalance = await wizard.balanceOf(user);
      const mint = await wizard.mint(user, "1");
      await mint.wait(); // wait until the transaction is mined
      const newBalance = await wizard.balanceOf(user);
      const calculatedNewBalance = userBalance.add(minted);
      assert.equal(newBalance.toString(), calculatedNewBalance.toString());
    });
  });
});

describe("Bank", function () {
  const interval = "100";
  const reward = ethers.utils.parseEther("10000");
  let deployer, user1, user2;
  beforeEach(async function () {
    await deployments.fixture(["all"]);
    bank = await ethers.getContract("Bank");
    wizard = await ethers.getContract("Wizard");
    deployer = (await getNamedAccounts()).deployer;
    user1 = (await getNamedAccounts()).user1;
    user2 = (await getNamedAccounts()).user2;
  });
  describe("constructor", async function () {
    it("sends reward tokens to the contract", async function () {
      await wizard.approve(bank.address);
      /* const rewardTokens = await wizard.balanceOf(bank.address); */
      /* assert.equal(reward, rewardTokens); */
    });
  });
  describe("deposit", async function () {
    it("should revert if the status of the bank is not DEPOSIT", async function () {
      //await expect(deposit("100")).to.be.reverted.with("Deposit period not active!")
    });
    it("increses he amount of tokens in the contract");
  });
});
