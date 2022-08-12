module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments;
  let deployer;
  [deployer] = await ethers.getSigners();

  wizard = await ethers.getContract("Wizard");

  interval = "86400"; //24h
  reward = ethers.utils.parseEther("10000");
  token = wizard.address;
  const bank = await deploy("Bank", {
    from: deployer.address,
    log: true,
    args: [interval, reward, token],
  });
  await wizard.transfer(bank.address, reward);
};
module.exports.tags = ["all", "bank"];
