const { ethers } = require("hardhat");

module.exports = async () => {
  const { deploy, log } = deployments;
  let deployer;
  [deployer] = await ethers.getSigners();

  await deploy("Wizard", {
    from: deployer.address,
    log: true,
    args: [],
  });
};
module.exports.tags = ["all", "token"];
