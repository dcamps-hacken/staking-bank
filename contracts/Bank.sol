// SPDX-License-Identifier: MIT

pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/** @title EVM wallet generator
 *  @author David Camps Novi
 *  @dev This contract uses a factory pattern to deploy a new wallet for each user
 */
contract Bank is Ownable, ReentrancyGuard {
    address public immutable token;
    uint256 public immutable T;
    uint256 public immutable t0;

    /* Reward pools */
    uint256 private R;
    uint256 private R1;
    uint256 private R2;
    uint256 private R3;

    /* Staking */
    mapping(address => uint256) private balances;
    uint256 private stake;

    event Deposit(address indexed user, uint256 indexed amount);
    event Withdrawal(
        address indexed user,
        uint256 indexed amount,
        uint256 yieldTokens
    );
    event Retrieve(uint256 indexed amount);

    /**
     *  @param _token address of the token used in this bank
     *  @param _reward amount of tokens sent in this contract by the owner as a reward for the users
     *  @param _interval time (in seconds) that sets T to calculate the rewards for users
     */
    constructor(
        address _token,
        uint256 _reward,
        uint256 _interval
    ) {
        token = _token;
        T = _interval;
        t0 = block.timestamp;
        R1 = (_reward * 2) / 10;
        R2 = (_reward * 3) / 10;
        R3 = (_reward * 5) / 10;
    }

    /**
     *  @notice Use this function to deposit any amount of tokens
     *  @notice This function is only available before T has passed since contract deployment
     *  @dev Deposit requires a previous approval of the ERC20 token to be spent by this bank,
     *  it thus cannot be called directly but after the approval in a previous transaction
     */

    function deposit(uint256 _amount) external nonReentrant {
        require(block.timestamp < t0 + T, "Deposit period has passed");
        IERC20(token).transferFrom(msg.sender, address(this), _amount);
        balances[msg.sender] += _amount;
        stake += balances[msg.sender];
        emit Deposit(msg.sender, _amount);
    }

    /**
     *  @notice Use this method to withdraw all your tokens from the bank
     *  @notice This function is only available after 2T has passed since contract deployment
     *  @notice An additional reward of tokens will be obtained depending on the staking time
     */
    function withdraw() external nonReentrant {
        require(block.timestamp >= t0 + 2 * T, "Withdrawals not available yet");
        require(balances[msg.sender] > 0, "No tokens deposited");
        uint256 balance = balances[msg.sender];
        uint256 yield = getR() * (balance / stake);
        R -= yield;
        balances[msg.sender] = 0;
        stake -= balance;
        IERC20(token).transfer(msg.sender, balance + yield);
        emit Withdrawal(msg.sender, balance, yield);
    }

    /**
     *  @notice Retrieve is only available for the contract owner to be called
     *  @notice This function can only be called after 4T has passed if all users have withdrawn their tokens
     *  @notice Use this method to recover all tokens deposited in this contract to reward users
     */
    function retrieve() external onlyOwner {
        require(block.timestamp >= t0 + 4 * T, "Retrieve not available yet");
        require(stake == 0, "Tokens still staked"); // can it actually be 0?
        uint256 retrieveAmount = getR();
        IERC20(token).transfer(msg.sender, retrieveAmount);
        emit Retrieve(retrieveAmount);
    }

    /**
     *  @dev This function is only called to update the reward pools R, R1, R2, R3
     *  depending on the timestamp it is called
     */
    function getR() public returns (uint256) {
        // Make sure all are whole numbers!!
        if (block.timestamp < t0 + 3 * T) {
            R += R1;
            R1 = 0;
        } else if (
            block.timestamp >= t0 + 3 * T && block.timestamp < t0 + 4 * T
        ) {
            R += R1 + R2;
            R1 = 0;
            R2 = 0;
        } else {
            R += R1 + R2 + R3;
            R1 = 0;
            R2 = 0;
            R3 = 0;
        }
        return R;
    }

    function getStake() public view returns (uint256) {
        return stake;
    }

    function getBalance(address _user) public view returns (uint256 balance) {
        balance = balances[_user];
        return balance;
    }

    function getR1() public view returns (uint256) {
        return R1;
    }

    function getR2() public view returns (uint256) {
        return R2;
    }

    function getR3() public view returns (uint256) {
        return R3;
    }
}
