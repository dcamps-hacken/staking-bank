const { verify } = require("../utils/verify");

wizardAddress = "0xA3048A8e2aabbdCe7A47685B8991EE58EeCeE47f";
bankAddress = "0x4B146B7AFcF4f5D74faedb71d6Ab41A7FF5ECa9e";
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
