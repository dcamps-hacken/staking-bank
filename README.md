# Bank smart contract task

## remember to check getContract vs getContractAt or whatever when dealing with ATRAC!

Your task is to create a bank smart contract which will enable anyone to deposit an amount X of XYZ
ERC20 tokens to their savings (staking) account. The bank smart contract also contains an additional
token reward pool of R XYZ tokens, deposited to the contract by the contract owner (bank owner) at
contract deployment. At deployment the bank owner sets a time period constant T, to be used for reward
calculation.

Contract dynamics (example illustrated below):

✅ The smart contract is deployed at t0
✅ The reward pool R is split into 3 subpools
✅ R1 = 20% of R, available after 2T has passed since contract deployment
✅ R2 = 30% of R, available after 3T has passed since contract deployment
✅ R3 = 50% of R, available after 4T has passed since contract deployment
✅ Deposit period: During the first period of T time the users can deposit tokens. After T has
passed, no more deposits are allowed.
✅ Lock period: From moment t0+T to t0+2T, users cannot withdraw their tokens (If the user tries to
remove tokens before T time has elapsed since they have deposited, the transaction should
fail).
✅ Withdraw periods: After T2 has passed since contract deployment, the users can withdraw their
tokens. However, the longer they wait, the bigger the reward they get
✅ If a user withdraws tokens during the period t0+2T to t0+3T, they collect a proportional
amount of the reward pool R1, according to the ratio of the number of tokens they have
staked compared to the total number of tokens staked on the contract (by all users).
✅ If a user withdraws tokens during the period t0+3T to t0+4T, they collect a proportional
amount of the remaining reward pool R1 and R2, according to the proportion of the
number of tokens they have staked compared to the total number of tokens staked on
the contract (by all users)
✅ If the user withdraws tokens after 4T has passed since contract deployment, they can
receive the full reward of R (R1+R2+R3) proportionally to their ratio of tokens in the
total pool
✅ If no user waits for the last period (for 4T to pass), the remaining tokens on the
contract can be withdrawn by the bank (contract owner). In no other situation can the
bank owner remove tokens from the contract.
