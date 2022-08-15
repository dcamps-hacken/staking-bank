module.exports = async ({ deployments }) => {
  const { deploy } = deployments;
  let deployer;
  [deployer] = await ethers.getSigners();

  wizard = await ethers.getContract("Wizard");
  token = wizard.address;
  reward = ethers.utils.parseEther("10000");
  interval = "86400"; //24h

  args = [token, reward, interval];
  const bank = await deploy("Bank", {
    from: deployer.address,
    log: true,
    args: args,
  });
  const depositReward = await wizard.transfer(bank.address, reward);
  await depositReward.wait();
};
module.exports.tags = ["all", "bank"];
