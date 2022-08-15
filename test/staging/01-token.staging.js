const { ethers, network } = require("hardhat");
const { assert } = require("chai");
const developmentChains = ["hardhat", "localhost"];

// definition of global variables
let deployer;
const minted = ethers.utils.parseEther("100");
const wizardAddress = "0x1C14F806244C1E96e5611548ed7961511fE91076";

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Wizard token staging testing", function () {
      beforeEach(async function () {
        // load wizard token smart contract
        wizard = await ethers.getContractAt("Wizard", wizardAddress);

        // get a couple of accounts for testing
        [deployer, user1] = await ethers.getSigners();
      });

      describe("mint", function () {
        it("Should mint additional tokens on demand", async function () {
          // get initial balance of the tokens of user
          const initBalance = await wizard.balanceOf(deployer.address);

          // mint some tokens for the user
          const mint = await wizard.mint(deployer.address, "100");
          await mint.wait();

          // get new balance of the tokens of user and check it matches the minting amount
          const newBalance = await wizard.balanceOf(deployer.address);
          const calculatedNewBalance = initBalance.add(minted);
          assert.equal(newBalance.toString(), calculatedNewBalance.toString());
        });
      });
    });
