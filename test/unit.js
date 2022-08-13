const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { expect, assert } = require("chai");
const { constants } = require("ethers");

const minted = ethers.utils.parseEther("100");
let deployer, user1, user2;

describe("Wizard", function () {
  const initialSupply = ethers.utils.parseEther("100000");
  beforeEach(async function () {
    await deployments.fixture(["token"]);
    wizard = await ethers.getContract("Wizard");
    [deployer, user1, user2] = await ethers.getSigners();
  });
  describe("constructor", function () {
    it("Mints initial supply of tokens", async function () {
      const deployerBalance = await wizard.balanceOf(deployer.address);
      assert.equal(deployerBalance.toString(), initialSupply.toString());
    });
  });
  describe("mint", function () {
    it("Should mint additional tokens on demand", async function () {
      const userBalance = await wizard.balanceOf(user1.address);
      await wizard.mint(user1.address, "100");
      const newBalance = await wizard.balanceOf(user1.address);
      const calculatedNewBalance = userBalance.add(minted);
      assert.equal(newBalance.toString(), calculatedNewBalance.toString());
    });
  });
});

describe("Bankv2", function () {
  beforeEach(async function () {
    await deployments.fixture(["all"]);
    bank = await ethers.getContract("Bankv2");
    wizard = await ethers.getContract("Wizard");
    [deployer, user1, user2] = await ethers.getSigners();
    this.reward = ethers.utils.parseEther("10000");
    this.deployTime = await bank.t0();
    this.T = await bank.T();
    this.firstUnlock = 2 * this.T;
    this.secondUnlock = 3 * this.T;
    this.thirdUnlock = 4 * this.T;
    this.R1 = this.reward.mul(2).div(10);
    this.R2 = this.reward.mul(3).div(10);
    this.R3 = this.reward.mul(5).div(10);
  });

  describe("constructor", function () {
    it("sets the token correctly", async function () {
      const inputToken = wizard.address;
      const setToken = await bank.token();
      assert.equal(setToken.toString(), inputToken);
    });

    it("matches the reward with the tokens deposited to the contract by the owner", async function () {
      const R1 = await bank.getR1();
      const R2 = await bank.getR2();
      const R3 = await bank.getR3();
      const R = R1.add(R2).add(R3);
      assert.equal(R.toString(), this.reward.toString());
    });

    it("matches sets the reward pools correctly", async function () {
      const rewardTokens = await wizard.balanceOf(bank.address);
      assert.equal(this.reward.toString(), rewardTokens.toString());
    });

    it("sets the time interval T correctly", async function () {
      const inputInterval = "86400";
      const setInterval = await bank.T();
      assert.equal(setInterval.toString(), inputInterval);
    });

    it("records the deployment time", async function () {
      await expect(this.deployTime.toNumber()).to.be.greaterThan(
        constants.Zero.toNumber()
      );
    });
  });

  describe("deposit", function () {
    beforeEach(async function () {
      await wizard.mint(user1.address, minted);
      await wizard.connect(user1).approve(bank.address, minted);
    });

    it("should revert if deposit time has passed", async function () {
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.T.toNumber()],
      });
      await network.provider.request({ method: "evm_mine", params: [] });
      await expect(bank.connect(user1).deposit(minted)).to.be.revertedWith(
        "Deposit period has passed"
      );
    });

    it("increses the amount of tokens in the contract", async function () {
      const initContractBalance = await wizard.balanceOf(bank.address);
      await bank.connect(user1).deposit(minted);
      const newContractBalance = await wizard.balanceOf(bank.address);
      const contractBalanceIncrease =
        newContractBalance.sub(initContractBalance);
      assert.equal(contractBalanceIncrease.toString(), minted.toString());
    });

    it("tracks the balance of the user", async function () {
      const initUserBalance = await bank.getBalance(user1.address);
      await bank.connect(user1).deposit(minted);
      const newUserBalance = await bank.getBalance(user1.address);
      const userBalanceIncrease = newUserBalance.sub(initUserBalance);
      assert.equal(userBalanceIncrease.toString(), minted.toString());
    });

    it("tracks the staked amount of tokens", async function () {
      const initStake = await bank.getStake();
      await bank.connect(user1).deposit(minted);
      const newStake = await bank.getStake();
      const stakeIncrease = newStake.sub(initStake);
      assert.equal(stakeIncrease.toString(), minted.toString());
    });

    it("emits the Deposit event with args", async function () {
      await expect(bank.connect(user1).deposit(minted))
        .to.emit(bank, "Deposit")
        .withArgs(user1.address, minted);
    });
  });

  describe("withdraw", function () {
    it("reverts if the bank is not in unlock", async function () {
      await expect(bank.connect(user1).withdraw()).to.be.revertedWith(
        "Withdrawals not available yet"
      );
    });

    it("reverts if the user has no deposited tokens", async function () {
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.firstUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });
      await expect(bank.connect(user1).withdraw()).to.be.revertedWith(
        "No tokens deposited"
      );
    });

    it("reduces R by withdraw amount", async function () {
      await wizard.mint(user1.address, minted);
      await wizard.connect(user1).approve(bank.address, minted);
      await bank.connect(user1).deposit(minted);
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.firstUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });
      const initR = await bank.getR();
      await bank.connect(user1).withdraw();
      const newR = await bank.getR();
      const decreaseR = initR.sub(newR);
      assert.equal(decreaseR.toString(), minted.toString());
    });

    it("returns the balance of the user to 0", async function () {
      await wizard.mint(user1.address, minted);
      await wizard.connect(user1).approve(bank.address, minted);
      await bank.connect(user1).deposit(minted);
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.firstUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });
      await bank.connect(user1).withdraw();
      const newBalance = await bank.getBalance(user1.address);
      assert.equal(newBalance.toString(), "0");
    });

    it("reduces the stake by withdraw amount", async function () {
      await wizard.mint(user1.address, minted);
      await wizard.connect(user1).approve(bank.address, minted);
      await bank.connect(user1).deposit(minted);
      const initStake = await bank.getStake();
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.firstUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });
      await bank.connect(user1).withdraw();
      const newStake = await bank.getStake();
      const stakeReduction = initStake.sub(newStake);
      assert.equal(stakeReduction.toString(), minted.toString());
    });

    it("sends the proper amount of tokens to the user", async function () {
      // deposit tokens into the contract
      await wizard.mint(user1.address, minted);
      await wizard.connect(user1).approve(bank.address, minted);
      await bank.connect(user1).deposit(minted);

      // move timestamp to first unlock
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.firstUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // get tokens in user account and yield tokens
      const initUserBalance = await wizard.balanceOf(user1.address);
      const yield = this.R1;

      // withdraw tokens
      await bank.connect(user1).withdraw();

      // get and calculate increase of tokens in user account after withdraw
      const newUserBalance = await wizard.balanceOf(user1.address);
      const balanceIncrease = newUserBalance.sub(initUserBalance);
      const calculatedBalanceIncrease = minted.add(yield);

      // compare calculated increase amount of tokens matches actual increase
      assert.equal(
        balanceIncrease.toString(),
        calculatedBalanceIncrease.toString()
      );
    });

    it("emits the Withdraw event with args", async function () {
      // deposit tokens into the contract
      await wizard.mint(user1.address, minted);
      await wizard.connect(user1).approve(bank.address, minted);
      await bank.connect(user1).deposit(minted);

      // move timestamp to first unlock
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.firstUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // check withdraw emits Withdraw event
      await expect(bank.connect(user1).withdraw())
        .to.emit(bank, "Withdrawal")
        .withArgs(user1.address, minted, this.R1);
    });
  });

  describe("recall", function () {
    it("reverts if the caller is not the owner", async function () {
      await expect(bank.connect(user1).recall()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("reverts if the bank is not in third unlock period", async function () {
      await expect(bank.recall()).to.be.revertedWith(
        "Recall not available yet"
      );
    });

    it("reverts if there are staked tokens", async function () {
      await wizard.mint(user1.address, minted);
      await wizard.connect(user1).approve(bank.address, minted);
      await bank.connect(user1).deposit(minted);
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.thirdUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });
      await expect(bank.recall()).to.be.revertedWith("Tokens still staked");
    });

    it("sends all remaining tokens to the contract owner", async function () {
      // move the timestamp to third unlock: recall available and R = R1 + R2 + R3
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.thirdUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // get initial amount tokens in deployer wallet
      const initBalanceOwner = wizard.balanceOf(deployer);

      // call recall function
      await bank.recall();

      // get new amount of tokens in deployer wallet
      const newBalanceOwner = wizard.balanceOf(deployer);

      // compare increased amount of tokens in deployer wallet with R
      const balanceIncrease = newBalanceOwner.sub(initBalanceOwner);
      assert.equal(balanceIncrease.toString(), this.reward.toString());
    });

    it("emits the Withdraw event with args", async function () {
      // move the timestamp to third unlock: recall available and R = R1 + R2 + R3
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.thirdUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // check recall emits Recall event
      await expect(bank.recall()).to.emit(bank, "Recall").withArgs(this.reward);
    });
  });

  describe("getR", function () {
    it("R equals R1 after the first unlock", async function () {
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.firstUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });
      const R = await bank.callStatic.getR();
      assert.equal(R.toString(), this.R1.toString());
    });

    it("R1 equals 0 after the first unlock", async function () {
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.firstUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });
      await bank.getR();
      const R1 = await bank.getR1();
      assert.equal(R1.toString(), "0");
    });

    it("R equals R1 + R2 after the second unlock", async function () {
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.secondUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });
      const R = await bank.callStatic.getR();
      assert.equal(R.toString(), this.R1.add(this.R2).toString());
    });

    it("R1 equals 0 after the second unlock", async function () {
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.secondUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });
      await bank.getR();
      const R1 = await bank.getR1();
      assert.equal(R1.toString(), "0");
    });

    it("R2 equals 0 after the second unlock", async function () {
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.secondUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });
      await bank.getR();
      const R2 = await bank.getR2();
      assert.equal(R2.toString(), "0");
    });

    it("R equals R1 + R2 + R3 during the third unlock", async function () {
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.thirdUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });
      const R = await bank.callStatic.getR();
      assert.equal(R.toString(), this.reward.toString());
    });

    it("R1 equals 0 after the second unlock", async function () {
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.thirdUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });
      await bank.getR();
      const R1 = await bank.getR1();
      assert.equal(R1.toString(), "0");
    });

    it("R2 equals 0 after the third unlock", async function () {
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.thirdUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });
      await bank.getR();
      const R2 = await bank.getR2();
      assert.equal(R2.toString(), "0");
    });

    it("R3 equals 0 after the third unlock", async function () {
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.thirdUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });
      await bank.getR();
      const R3 = await bank.getR3();
      assert.equal(R3.toString(), "0");
    });
  });
});
