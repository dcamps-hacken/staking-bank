const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
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
  describe("constructor", function () {
    it("Mints initial supply of tokens", async function () {
      const deployerBalance = await wizard.balanceOf(deployer.address);
      assert.equal(deployerBalance.toString(), initialSupply.toString());
    });
  });
  describe("mint", function () {
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
  beforeEach(async function () {
    await deployments.fixture(["all"]);
    bank = await ethers.getContract("Bank");
    wizard = await ethers.getContract("Wizard");
    [deployer, user1, user2] = await ethers.getSigners();
    const mint = await wizard.mint(user1.address, minted);
    await mint.wait();
  });

  describe("constructor", function () {
    it("sends reward tokens to the contract", async function () {
      const rewardTokens = await wizard.balanceOf(bank.address);
      assert.equal(reward.toString(), rewardTokens.toString());
    });

    it("initializes the bank status correctly", async function () {
      const bankStatus = await bank.getStatus();
      assert.equal(bankStatus.toString(), "0");
    });

    it("sets the time interval T correctly", async function () {
      const inputInterval = "86400";
      const setInterval = await bank.getInterval();
      assert.equal(inputInterval.toString(), inputInterval);
    });
  });

  describe("deposit", function () {
    beforeEach(async function () {
      this.initContractBalance = await wizard.balanceOf(bank.address);
      this.initUserBalance = await bank.getBalance(user1.address);
      this.initStake = await bank.getStake();
      await wizard.connect(user1).approve(bank.address, minted);
    });

    it("should revert if the status of the bank is not DEPOSIT", async function () {
      console.log(await bank.status());
      await network.provider.send("evm_increaseTime", [
        this.interval.toNumber() + 1,
      ]);
      await network.provider.send("evm_mine", []);
      console.log(await bank.status());
      /* await expect(bank.deposit(depositAmount)).to.be.revertedWith(
        "Deposit period not active!"
      ); */
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
    it("reverts if the bank is not in an unlock period", async function () {
      await expect(bank.connect(user1).withdraw()).to.be.revertedWith(
        "Withdrawals not available yet!"
      );
    });
  });

  describe("recall", function () {
    it("reverts if the caller is not the owner", async function () {
      await expect(bank.connect(user1).recall()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    /* it("reverts if the status is not THIRD_UNLOCK", async function () {
      await expect(bank.recall()).to.be.revertedWith(
        "Recall not available yet"
      );
    }); */

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
});
