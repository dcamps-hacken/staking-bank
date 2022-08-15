const verify = async (contractAddress, args, contractName) => {
  // constructor arguments must be specified in args
  console.log("Verifying contract on Rinkeby Etherscan...");
  try {
    //we use try-cath bc sometimes it says the contract is already verified
    await run("verify:verify", {
      contract: contractName,
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified!");
    } else {
      console.log(e);
    }
  }
};

module.exports = { verify };
