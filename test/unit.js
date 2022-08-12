const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { expect, assert } = require("chai");

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
    const mint = await wizard.mint(user1.address, minted);
    this.reward = ethers.utils.parseEther("10000");
    this.deployTime = await bank.t0();
  });

  describe("constructor", function () {
    it("sets the token correctly", async function () {
      const inputToken = wizard.address;
      const setToken = await bank.token();
      assert.equal(setToken.toString(), inputToken);
    });

    it("matches the reward pools with the tokens deposited to the contract by the owner", async function () {
      const pools = await bank.getR1().add(bank.getR2()).add(bank.getR3());
      const rewardTokens = await wizard.balanceOf(bank.address);
      assert.equal(
        this.reward.toString(),
        rewardTokens.toString(),
        pools.toString()
      );
    });

    it("sets the time interval T correctly", async function () {
      const inputInterval = "86400";
      const setInterval = await bank.T();
      assert.equal(setInterval.toString(), inputInterval);
    });

    it("sets the deployment time correctly", async function () {
      const lastTimestamp = await hre.ethers.provider.getBlock("latest")
        .timestamp;
      await assert.equal(bank.t0().toString(), lastTimestamp);
    });
  });

  describe("deposit", function () {
    beforeEach(async function () {
      this.initContractBalance = await wizard.balanceOf(bank.address);
      this.initUserBalance = await bank.getBalance(user1.address);
      this.initStake = await bank.getStake();
      await wizard.connect(user1).approve(bank.address, minted);
    });

    it("should revert if deposit time has passed", async function () {
      await network.provider.send("evm_setNextBlockTimestamp", [
        bank.t0().add(bank.T()),
      ]);
      await network.provider.send("evm_mine");
      await expect(bank.connect(user1).deposit(minted)).to.be.revertedWith(
        "Deposit period has passed"
      );
    });

    it("increses he amount of tokens in the contract", async function () {
      await bank.connect(user1).deposit(minted);
      const newContractBalance = await wizard.balanceOf(bank.address);
      const contractBalanceIncrease = newContractBalance.sub(
        this.initContractBalance
      );
      assert.equal(contractBalanceIncrease.toString(), minted.toString());
    });

    it("tracks the balance of the user", async function () {
      await bank.connect(user1).deposit(minted);
      const newUserBalance = await bank.getBalance(user1.address);
      const userBalanceIncrease = newUserBalance.sub(this.initUserBalance);
      assert.equal(userBalanceIncrease.toString(), minted.toString());
    });

    it("tracks the total staked amount of tokens", async function () {
      await bank.connect(user1).deposit(minted);
      const newStake = await bank.getStake();
      const stakeIncrease = newStake.sub(this.initStake);
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
      await expect(bank.connect(user1).withdraw()).to.be.revertedWith(
        "No tokens deposited"
      );
    });
  });

  describe("recall", function () {
    it("reverts if the caller is not the owner", async function () {
      await expect(bank.connect(user1).recall()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("reverts if there are staked tokens", async function () {
      await wizard.connect(user1).approve(bank.address, minted);
      await bank.connect(user1).deposit(minted);
      await expect(bank.recall()).to.be.revertedWith("Tokens still staked");
    });

    // Required to move blocktime for this to work
    /* it("sends all remaining tokens to the contract owner", async function () {
      const initBalanceOwner = wizard.balanceOf(deployer);
      const remainingTokens = await bank.getReward();
      await bank.recall();
      const newBalanceOwner = wizard.balanceOf(deployer);
      const balanceIncrease = newBalanceOwner.sub(initBalanceOwner);
      console.log(remainingTokens);
      assert.equal(balanceIncrease.toString(), remainingTokens.toString());
    }); */
  });

  describe("getR", function () {
    it("returns R as R1 during the first unlock", async function () {
      this.firstThreshold = (await bank.T())
        .mul(ethers.BigNumber.from("3"))
        .sub(ethers.BigNumber.from("1"))
        .add(this.deployTime);
      await network.provider.send("evm_setNextBlockTimestamp", [
        this.firstThreshold,
      ]);
      await network.provider.send("evm_mine");
      await assert.equal(bank.getR().toString(), bank.R1().toString());
    });
    it("returns R as R1 + R2 during the second unlock", async function () {
      this.secondReward = await bank.getR1().add(bank.getR2());
      this.secondInterval = (await bank.T()).add(this.firstThreshold);
      await network.provider.send("evm_setNextBlockTimestamp", [
        this.secondInterval,
      ]);
      await network.provider.send("evm_mine");
      await assert.equal(bank.getR().toString(), this.secondReward.toString());
    });
    it("returns R as R1 + R2 + R3 during the second unlock", async function () {
      this.thirdReward = await this.secondReward.add(bank.getR3());
      this.thirdInterval = this.secondInterval.add(ethers.BigNumber.from("1"));
      await network.provider.send("evm_setNextBlockTimestamp", [
        this.thirdInterval,
      ]);
      await network.provider.send("evm_mine");
      await assert.equal(bank.getR().toString(), thirdReward.toString());
    });
  });
});
