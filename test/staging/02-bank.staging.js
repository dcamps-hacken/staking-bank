const { ethers, network } = require("hardhat");
const { expect, assert } = require("chai");
const { constants } = require("ethers");
const developmentChains = ["hardhat", "localhost"];

// definition of global variables
let deployer;
const minted = ethers.utils.parseEther("100");
const reward = ethers.utils.parseEther("10000");
const wizardAddress = "0x1C14F806244C1E96e5611548ed7961511fE91076";
const bankAddress = "0x19Db9FaDCaE1f7B06d266a370BabDCA669828de4";

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Bank staging testing", function () {
      beforeEach(async function () {
        // load the smart contracts
        bank = await ethers.getContract("Bank", bankAddress);
        wizard = await ethers.getContractAt("Wizard", wizardAddress, deployer);

        // get a couple of accounts for testing
        [deployer] = await ethers.getSigners();
      });

      describe("deposit of reward tokens", function () {
        it("matches the reward with the tokens deposited to the contract by the owner", async function () {
          // get the balance of tokens in the contract and compare with the tokens
          // sent by the owner at the contract deployment
          const rewardTokens = await wizard.balanceOf(bank.address);
          assert.equal(reward.toString(), rewardTokens.toString());
        });
      });

      describe("constructor", function () {
        it("sets the token correctly", async function () {
          // get the stored address in the contract and compare with the input
          const inputToken = wizard.address;
          const setToken = await bank.token();
          assert.equal(setToken.toString(), inputToken);
        });

        it("sets the reward pools correctly", async function () {
          // get the stored reward pools in the contract and compare with the input
          const R1 = await bank.getR1();
          const R2 = await bank.getR2();
          const R3 = await bank.getR3();
          const R = R1.add(R2).add(R3);
          assert.equal(R.toString(), reward.toString());
        });

        it("sets the time interval T correctly", async function () {
          // get the stored time interval and compare with the input
          const inputInterval = "86400";
          const setInterval = await bank.T();
          assert.equal(setInterval.toString(), inputInterval);
        });

        it("records the deployment time", async function () {
          // get the stored deploy timestamp and make sure it is not zero
          const deployTime = await bank.t0();
          await expect(deployTime.toNumber()).to.be.greaterThan(
            constants.Zero.toNumber()
          );
        });
      });

      describe("deposit", function () {
        it("increses the amount of tokens in the contract", async function () {
          // mint and approve wizard tokens for deposit
          const newMint = ethers.utils.parseEther("300");
          const mint = await wizard.mint(deployer.address, newMint);
          await mint.wait();
          const approve = await wizard
            .connect(deployer)
            .approve(bank.address, newMint);
          await approve.wait();

          // get initial balance of tokens in the contract
          const initContractBalance = await wizard.balanceOf(bank.address);

          // deposit tokens
          const deposit = await bank.connect(deployer).deposit(minted);
          await deposit.wait();

          // get new balance of tokens in the contract and compare with deposi
          const newContractBalance = await wizard.balanceOf(bank.address);
          const contractBalanceIncrease =
            newContractBalance.sub(initContractBalance);
          console.log(
            initContractBalance.toString(),
            newContractBalance.toString()
          );
          assert.equal(contractBalanceIncrease.toString(), minted.toString());
        });

        it("tracks the balance of the user", async function () {
          // get initial user balance of tokens in the contract
          const initUserBalance = await bank.getBalance(deployer.address);

          // deposit tokens
          await bank.connect(deployer).deposit(minted);

          // get new user balance of tokens in the contract and compare with deposit
          const newUserBalance = await bank.getBalance(deployer.address);
          const userBalanceIncrease = newUserBalance.sub(initUserBalance);
          assert.equal(userBalanceIncrease.toString(), minted.toString());
        });

        it("tracks the staked amount of tokens", async function () {
          // get initial amount of stake tokens in the contract
          const initStake = await bank.getStake();

          // deposit tokens
          await bank.connect(deployer).deposit(minted);

          // get initial amount of stake tokens in the contract and compare with deposit
          const newStake = await bank.getStake();
          const stakeIncrease = newStake.sub(initStake);
          assert.equal(stakeIncrease.toString(), minted.toString());
        });

        it("emits the Deposit event with args", async function () {
          // check emission of Deposit event
          await expect(bank.connect(deployer).deposit(minted))
            .to.emit(bank, "Deposit")
            .withArgs(deployer.address, minted);
        });
      });

      /* describe("withdraw", function () {
        it("reverts if the bank is not in unlock", async function () {
          // check withdraw is reverted
          await expect(bank.connect(deployer).withdraw()).to.be.revertedWith(
            "Withdrawals not available yet"
          );
        });
      });

      describe("retrieve", function () {
        it("reverts if the caller is not the owner", async function () {
          // check retrieve is reverted
          await expect(bank.connect(user1).retrieve()).to.be.revertedWith(
            "Ownable: caller is not the owner"
          );
        });
      }); */
    });
