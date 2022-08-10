module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const wizard = await deploy("Wizard", {
    from: deployer,
    log: true,
    args: [],
  });
};
module.exports.tags = ["all", "token"];
