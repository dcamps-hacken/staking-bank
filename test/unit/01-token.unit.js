const { ethers, network } = require("hardhat");
const { assert } = require("chai");
const developmentChains = ["hardhat", "localhost"];

// definition of global variables
let deployer, user1;
const initialSupply = ethers.utils.parseEther("100000");
const minted = ethers.utils.parseEther("100");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Wizard token unit testing", function () {
      beforeEach(async function () {
        // deploy token smart contract
        await deployments.fixture(["token"]);

        // load wizard token smart contract
        wizard = await ethers.getContract("Wizard");

        // get a couple of accounts for testing
        [deployer, user1] = await ethers.getSigners();
      });

      describe("constructor", function () {
        it("Mints initial supply of tokens", async function () {
          // get the balance of the deployer to check it owns the initial minted supply
          const deployerBalance = await wizard.balanceOf(deployer.address);
          assert.equal(deployerBalance.toString(), initialSupply.toString());
        });
      });

      describe("mint", function () {
        it("Should mint additional tokens on demand", async function () {
          // get initial balance of the tokens of user
          const initBalance = await wizard.balanceOf(user1.address);

          // mint some tokens for the user
          await wizard.mint(user1.address, "100");

          // get new balance of the tokens of user and check it matches the minting amount
          const newBalance = await wizard.balanceOf(user1.address);
          const calculatedNewBalance = initBalance.add(minted);
          assert.equal(newBalance.toString(), calculatedNewBalance.toString());
        });
      });
    });
