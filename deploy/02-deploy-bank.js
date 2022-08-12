module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments;
  let deployer;
  [deployer] = await ethers.getSigners();

  wizard = await ethers.getContract("Wizard");

  token = wizard.address;
  reward = ethers.utils.parseEther("10000");
  interval = "86400"; //24h

  const bank = await deploy("Bankv2", {
    from: deployer.address,
    log: true,
    args: [token, reward, interval],
  });
  await wizard.transfer(bank.address, reward);
};
module.exports.tags = ["all", "bank"];
