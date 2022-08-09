module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments;
  const { deployer, user1, user2 } = await getNamedAccounts();

  interval = "60";
  reward = "10000";
  token = "";
  args = [interval, reward, token];
  const bank = await deploy("Bank", {
    from: deployer,
    log: true,
    args: args,
  });
};
module.exports.tags = ["all"];
