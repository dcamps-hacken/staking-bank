module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  wizard = await ethers.getContract("Wizard");

  interval = "60";
  reward = ethers.utils.parseEther("10000");
  token = wizard.address;
  const bank = await deploy("Bank", {
    from: deployer,
    log: true,
    args: [interval, reward, token],
  });
  wizard.transfer(bank.address, reward, { from: deployer });
};
module.exports.tags = ["all", "bank"];
