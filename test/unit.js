const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { expect, assert } = require("chai");
const { constants } = require("ethers");

const minted = ethers.utils.parseEther("100");
let deployer, user1, user2;

describe("Wizard", function () {
  let totalSupply = constants.Zero;
  const initialSupply = ethers.utils.parseEther("100000");
  beforeEach(async function () {
    await deployments.fixture(["token"]);
    wizard = await ethers.getContract("Wizard");
    [deployer, user1, user2] = await ethers.getSigners();
  });
  describe("constructor", async function () {
    it("Mints initial supply of tokens", async function () {
      const deployerBalance = await wizard.balanceOf(deployer.address);
      assert.equal(deployerBalance.toString(), initialSupply.toString());
    });
  });
  describe("mint", async function () {
    it("Should mint additional tokens on demand", async function () {
      const userBalance = await wizard.balanceOf(user1.address);
      const mint = await wizard.mint(user1.address, minted);
      await mint.wait(); // wait until the transaction is mined
      const newBalance = await wizard.balanceOf(user1.address);
      const calculatedNewBalance = userBalance.add(minted);
      assert.equal(newBalance.toString(), calculatedNewBalance.toString());
    });
  });
});

describe.only("Bank", function () {
  const interval = "100";
  const reward = ethers.utils.parseEther("10000");
  beforeEach(async function () {
    await deployments.fixture(["all"]);
    bank = await ethers.getContract("Bank");
    wizard = await ethers.getContract("Wizard");
    [deployer, user1, user2] = await ethers.getSigners();
    const mint = await wizard.mint(user1.address, minted);
    await mint.wait();
  });
  describe("constructor", async function () {
    it("sends reward tokens to the contract", async function () {
      const rewardTokens = await wizard.balanceOf(bank.address);
      assert.equal(reward.toString(), rewardTokens.toString());
    });
  });
  describe("deposit", async function () {
    beforeEach(async function () {
      this.initContractBalance = await wizard.balanceOf(bank.address);
      this.initUserBalance = await bank.getBalance(user1.address);
      this.initStake = await bank.getStake();
      await wizard.connect(user1).approve(bank.address, minted);
      await bank.connect(user1).deposit(minted);
    });
    /* it("should revert if the status of the bank is not DEPOSIT", async function () {
      console.log(await bank.status());
      await expect(bank.deposit(depositAmount)).to.be.revertedWith(
        "Deposit period not active!"
      );
    }); */
    it("increses he amount of tokens in the contract", async function () {
      const newContractBalance = await wizard.balanceOf(bank.address);
      const contractBalanceIncrease = newContractBalance.sub(
        this.initContractBalance
      );
      assert.equal(contractBalanceIncrease.toString(), minted.toString());
    });
    it("tracks the balance of the user", async function () {
      const newUserBalance = await bank.getBalance(user1.address);
      const userBalanceIncrease = newUserBalance.sub(this.initUserBalance);
      assert.equal(userBalanceIncrease.toString(), minted.toString());
    });
    it("tracks the total staked amount of tokens", async function () {
      const newStake = await bank.getStake();
      const stakeIncrease = newStake.sub(this.initStake);
      assert.equal(stakeIncrease.toString(), minted.toString());
    });
  });
});
