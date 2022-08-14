const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { expect, assert } = require("chai");
const { constants } = require("ethers");

const minted = ethers.utils.parseEther("100");
let deployer, user1;

describe("Wizard", function () {
  const initialSupply = ethers.utils.parseEther("100000");
  beforeEach(async function () {
    await deployments.fixture(["token"]);
    wizard = await ethers.getContract("Wizard");
    [deployer, user1] = await ethers.getSigners();
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
    // deploy all smart contracts
    await deployments.fixture(["all"]);

    // load the smart contracts
    bank = await ethers.getContract("Bankv2");
    wizard = await ethers.getContract("Wizard");

    // get a couple of accounts for testing
    [deployer, user1] = await ethers.getSigners();

    // definition of global variables to be widely used
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
      // get the stored address in the contract and compare with the input
      const inputToken = wizard.address;
      const setToken = await bank.token();
      assert.equal(setToken.toString(), inputToken);
    });

    it("matches the reward with the tokens deposited to the contract by the owner", async function () {
      // get the stored reward pools in the contract and compare with the input
      const R1 = await bank.getR1();
      const R2 = await bank.getR2();
      const R3 = await bank.getR3();
      const R = R1.add(R2).add(R3);
      assert.equal(R.toString(), this.reward.toString());
    });

    it("matches sets the reward pools correctly", async function () {
      // get the balance of tokens in the contract and compare with the tokens
      // sent by the owner at the contract deployment
      const rewardTokens = await wizard.balanceOf(bank.address);
      assert.equal(this.reward.toString(), rewardTokens.toString());
    });

    it("sets the time interval T correctly", async function () {
      // get the stored time interval and compare with the input
      const inputInterval = "86400";
      const setInterval = await bank.T();
      assert.equal(setInterval.toString(), inputInterval);
    });

    it("records the deployment time", async function () {
      // get the stored deploy timestamp and make sure it is not zero
      await expect(this.deployTime.toNumber()).to.be.greaterThan(
        constants.Zero.toNumber()
      );
    });
  });

  describe("deposit", function () {
    beforeEach(async function () {
      // mint and approve wizard tokens for deposit
      await wizard.mint(user1.address, minted);
      await wizard.connect(user1).approve(bank.address, minted);
    });

    it("should revert if deposit time has passed", async function () {
      // move timestamp to first unlock
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.T.toNumber()],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // check deposit is reverted
      await expect(bank.connect(user1).deposit(minted)).to.be.revertedWith(
        "Deposit period has passed"
      );
    });

    it("increses the amount of tokens in the contract", async function () {
      // get initial balance of tokens in the contract
      const initContractBalance = await wizard.balanceOf(bank.address);

      // deposit tokens
      await bank.connect(user1).deposit(minted);

      // get new balance of tokens in the contract and compare with deposi
      const newContractBalance = await wizard.balanceOf(bank.address);
      const contractBalanceIncrease =
        newContractBalance.sub(initContractBalance);
      assert.equal(contractBalanceIncrease.toString(), minted.toString());
    });

    it("tracks the balance of the user", async function () {
      // get initial user balance of tokens in the contract
      const initUserBalance = await bank.getBalance(user1.address);

      // deposit tokens
      await bank.connect(user1).deposit(minted);

      // get new user balance of tokens in the contract and compare with deposit
      const newUserBalance = await bank.getBalance(user1.address);
      const userBalanceIncrease = newUserBalance.sub(initUserBalance);
      assert.equal(userBalanceIncrease.toString(), minted.toString());
    });

    it("tracks the staked amount of tokens", async function () {
      // get initial amount of stake tokens in the contract
      const initStake = await bank.getStake();

      // deposit tokens
      await bank.connect(user1).deposit(minted);

      // get initial amount of stake tokens in the contract and compare with deposit
      const newStake = await bank.getStake();
      const stakeIncrease = newStake.sub(initStake);
      assert.equal(stakeIncrease.toString(), minted.toString());
    });

    it("emits the Deposit event with args", async function () {
      // check emission of Deposit event
      await expect(bank.connect(user1).deposit(minted))
        .to.emit(bank, "Deposit")
        .withArgs(user1.address, minted);
    });
  });

  describe("withdraw", function () {
    it("reverts if the bank is not in unlock", async function () {
      // check withdraw is reverted
      await expect(bank.connect(user1).withdraw()).to.be.revertedWith(
        "Withdrawals not available yet"
      );
    });

    it("reverts if the user has no deposited tokens", async function () {
      // move timestamp to first unlock
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.firstUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // check withdraw is reverted
      await expect(bank.connect(user1).withdraw()).to.be.revertedWith(
        "No tokens deposited"
      );
    });

    it("reduces R by yield amount", async function () {
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

      // calculate yield tokens (in this case it equals R1) and get R
      const yield = this.R1;
      const initR = await bank.callStatic.getR();

      // withdraw funds
      await bank.connect(user1).withdraw();

      // calculate the decrease in R and compare it with the farmed yield
      const newR = await bank.callStatic.getR();
      const decreaseR = initR.sub(newR);
      assert.equal(decreaseR.toString(), yield.toString());
    });

    it("returns the balance of the user to 0", async function () {
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

      // withdraw funds
      await bank.connect(user1).withdraw();

      // check new balance of tokens of the user is 0
      const newBalance = await bank.getBalance(user1.address);
      assert.equal(newBalance.toString(), "0");
    });

    it("reduces the stake by withdraw amount", async function () {
      // deposit tokens into the contract
      await wizard.mint(user1.address, minted);
      await wizard.connect(user1).approve(bank.address, minted);
      await bank.connect(user1).deposit(minted);

      // get initial amount of staked tokens
      const initStake = await bank.getStake();

      // move timestamp to first unlock
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.firstUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // withdraw funds
      await bank.connect(user1).withdraw();

      // get new amount of staked tokens and compare it with withdrawn funds
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

      // check emission of Withdraw event
      await expect(bank.connect(user1).withdraw())
        .to.emit(bank, "Withdrawal")
        .withArgs(user1.address, minted, this.R1);
    });
  });

  describe("recall", function () {
    it("reverts if the caller is not the owner", async function () {
      // check recall is reverted
      await expect(bank.connect(user1).recall()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("reverts if the bank is not in third unlock period", async function () {
      // check recall is reverted
      await expect(bank.recall()).to.be.revertedWith(
        "Recall not available yet"
      );
    });

    it("reverts if there are staked tokens", async function () {
      // deposit tokens into the contract
      await wizard.mint(user1.address, minted);
      await wizard.connect(user1).approve(bank.address, minted);
      await bank.connect(user1).deposit(minted);

      // move timestamp to third unlock
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.thirdUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // check recall is reverted
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
      const initBalanceOwner = await wizard.balanceOf(deployer.address);

      // call recall function
      await bank.recall();

      // get new amount of tokens in deployer wallet
      const newBalanceOwner = await wizard.balanceOf(deployer.address);

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

      // check emission of Recall event
      await expect(bank.recall()).to.emit(bank, "Recall").withArgs(this.reward);
    });
  });

  describe("getR", function () {
    it("R equals R1 after the first unlock", async function () {
      // move timestamp to first unlock
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.firstUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // get reward tokens R and compare with expected value
      const R = await bank.callStatic.getR();
      assert.equal(R.toString(), this.R1.toString());
    });

    it("R1 equals 0 after the first unlock", async function () {
      // move timestamp to first unlock
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.firstUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // call getR to update value of reward tokens R
      await bank.getR();

      // get amount of tokens in R1 pool and make sure it's 0
      const R1 = await bank.getR1();
      assert.equal(R1.toString(), "0");
    });

    it("R equals R1 + R2 after the second unlock", async function () {
      // move timestamp to second unlock
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.secondUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // get reward tokens R and compare with expected value
      const R = await bank.callStatic.getR();
      assert.equal(R.toString(), this.R1.add(this.R2).toString());
    });

    it("R1 equals 0 after the second unlock", async function () {
      // move timestamp to second unlock
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.secondUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // call getR to update value of reward tokens R
      await bank.getR();

      // get amount of tokens in R1 pool and make sure it's 0
      const R1 = await bank.getR1();
      assert.equal(R1.toString(), "0");
    });

    it("R2 equals 0 after the second unlock", async function () {
      // move timestamp to second unlock
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.secondUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // call getR to update value of reward tokens R
      await bank.getR();

      // get amount of tokens in R2 pool and make sure it's 0
      const R2 = await bank.getR2();
      assert.equal(R2.toString(), "0");
    });

    it("R equals R1 + R2 + R3 during the third unlock", async function () {
      // move timestamp to third unlock
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.thirdUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // get reward tokens R and compare with expected value
      const R = await bank.callStatic.getR();
      assert.equal(R.toString(), this.reward.toString());
    });

    it("R1 equals 0 after the third unlock", async function () {
      // move timestamp to third unlock
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.thirdUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // call getR to update value of reward tokens R
      await bank.getR();

      // get amount of tokens in R1 pool and make sure it's 0
      const R1 = await bank.getR1();
      assert.equal(R1.toString(), "0");
    });

    it("R2 equals 0 after the third unlock", async function () {
      // move timestamp to third unlock
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.thirdUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // call getR to update value of reward tokens R
      await bank.getR();

      // get amount of tokens in R2 pool and make sure it's 0
      const R2 = await bank.getR2();
      assert.equal(R2.toString(), "0");
    });

    it("R3 equals 0 after the third unlock", async function () {
      // move timestamp to third unlock
      await network.provider.request({
        method: "evm_increaseTime",
        params: [this.thirdUnlock],
      });
      await network.provider.request({ method: "evm_mine", params: [] });

      // call getR to update value of reward tokens R
      await bank.getR();

      // get amount of tokens in R3 pool and make sure it's 0
      const R3 = await bank.getR3();
      assert.equal(R3.toString(), "0");
    });
  });
});
