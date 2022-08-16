# Bank smart contract

- Anyone can deposit any amount of wizard ($WZD) ERC20 tokens to their savings (staking) account. <br>
- The Bank contract contains an additional token reward pool of `R` $WZD tokens. <br>
- A staking reward is generated for the users, depending on the time passed before token withrawal. <br>

## Contract dynamics

### DEPLOYMENT

- The contract is deployed at `t0` <br>
- The Bank owner sets a time period constant `T`, used for reward calculation. <br>
- The owner also deposits an amount `R` of reward tokens, split into 3 subpools: <br>
  `R1 = 20% of R`, available after `2T` has passed since contract deployment <br>
  `R2 = 30% of R`, available after `3T` has passed since contract deployment <br>
  `R3 = 50% of R`, available after `4T` has passed since contract deployment <br>

### DEPOSIT

> The deposit period goes from t0 to t0 + T.

During this period, users can use the `deposit` method to save their $WZD tokens into the contract. After `T` has passed, no more deposits are allowed.
<br>

### LOCK

> This period goes from moment t0+T to t0+2T

Users cannot withdraw their tokens (If the user tries to remove tokens before `T` time has elapsed since they have deposited, the transaction will fail). <br>

### WITHRAW

After `2T` has passed since contract deployment, the users can withdraw their tokens. However, the longer they wait, the bigger the reward they get. The amount of tokens each user receives will be proportional to their stake in the contract relative to the total staking for every time period.

There are three withdraw periods:

> First Unlock --> from t0 + 2T to t0 + 3T <br>

A user withdrawing during the first unlock will collect an additional amount of $WZD tokens from `R1`.

> Second Unlock --> from t0 + 3T to t0 + 4T <br>

A user withdrawing during the second unlock will collect an additional amount of $WZD tokens from `R1 + R2`.

> Third Unlock --> from t0 + 4T <br>

A user withdrawing during the second unlock will collect an additional amount of $WZD tokens from `R1 + R2 + R3`.

### RETRIEVE

If no user waits for the third unlock to withdraw their tokens, the remaining tokens on the contract can be withdrawn by the bank (contract owner). In no other situation can the bank owner remove tokens from the contract.
<br>

# QUICKSTART 🚀

Download the Hardhat repo and play around with tests, tasks or your own scripts:

```
git clone https://github.com/fields93/tracelabs.git
```

### Networks

This project can run in: <br>
🥇Hardhat Network <br>
🥈Hardhat Localhost Testnet <br>
🥉Ethereum Rinkeby Testnet <br>
<br>
In the following sections, the different available interactions with each network wil be explained.

## 🥇 Hardhat Network

This network is used for testing. <br>

### Deploy your contracts:

```
yarn deploy
```

### Test your contracts:

```
yarn test
```

Check the test coverage with the plugin _Solidity Coverage_:

```
yarn coverage
```

## 🥈Hardhat Localhost Testnet

In order to interact with this network, you will first need to start a Hardhat Node in a different terminal:

```
yarn hardhat node
```

### Deploy your contracts:

```
yarn deploy-localhost
```

### Test your contracts:

```
yarn test-localhost
```

## 🥉 Ethereum Rinkeby Testnet

Both the _Bank_ and the _Wizard_ (ERC20 token) contracts have been already deployed and verified on Rinkebyscan at:

- Bank: `0xC3476d21cb44914C3AB457F4BB2F47841024bd65`
- Wizard: `0x609fB1523F468e6d4e0Cd7B0F9DcCcc6E4a0B62c`

However, if you wish to deploy new contracts from your account and verify them, you can do it by running:

```
yarn deploy-rinkeby
```

```
yarn verify
```

### Interact with the Rinkeby-deployed contracts

In this case, there are no available tests. Instead, some tasks have been added to the project in order to interact with the contracts deployed on Rinkeby. The available tasks are: <br>

Get the balance of $WZD tokens in your wallet:

```
yarn task-balance
```

Mint tokens:

```
yarn task-mint AMOUNT
```

Deposit tokens:

```
yarn task-deposit AMOUNT
```

Withdraw tokens:

```
yarn task-withdraw AMOUNT
```

Retrieve tokens:

```
yarn task-retrieve AMOUNT
```
