const { verify } = require("../utils/verify");

wizardAddress = "0x609fB1523F468e6d4e0Cd7B0F9DcCcc6E4a0B62c";
bankAddress = "0xC3476d21cb44914C3AB457F4BB2F47841024bd65";
reward = ethers.utils.parseEther("10000");
interval = "86400"; //24h
bankArgs = [wizardAddress, reward, interval];

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
