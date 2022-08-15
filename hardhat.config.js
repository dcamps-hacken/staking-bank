require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-deploy");
require("@nomiclabs/hardhat-solhint");
require("./tasks/task");

module.exports = {
  solidity: {
    compilers: [{ version: "0.8.7" }],
  },
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337,
    },
    rinkeby: {
      url: process.env.RINKEBY_RPC_URL,
      accounts: [process.env.DEPLOYER, process.env.USER1],
      chainId: 4,
      blockConfirmations: 10,
      gas: 30000000,
      gasPrice: 100000000000,
      blockGasLimit: 1000000000,
    },
  },
  etherscan: {
    apiKey: {
      rinkeby: process.env.ETHERSCAN_API_KEY,
    },
  },
};
