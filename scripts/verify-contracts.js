const { verify } = require("../utils/verify");

wizardAddress = "0x1C14F806244C1E96e5611548ed7961511fE91076";
bankAddress = "0x19Db9FaDCaE1f7B06d266a370BabDCA669828de4";
reward = ethers.utils.parseEther("10000");
interval = "86400"; //24h
bankArgs = [token, reward, interval];

async function main() {
  await verify(wizardAddress, [], "contracts/Wizard.sol:Wizard");
  await verify(bankAddress, bankArgs, "contracts/Bank.sol:Bank");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
