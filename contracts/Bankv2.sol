// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Bankv2 is Ownable, ReentrancyGuard {
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
    event Recall(uint256 indexed amount);

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

    // manage direct tokens/eth sent to the contract.
    fallback() external payable {}

    receive() external payable {}

    //requires user approval
    function deposit(uint256 _amount) external nonReentrant {
        require(block.timestamp < t0 + T, "Deposit period has passed");
        IERC20(token).transferFrom(msg.sender, address(this), _amount);
        balances[msg.sender] += _amount;
        stake += balances[msg.sender];
        emit Deposit(msg.sender, _amount);
    }

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

    function recall() external onlyOwner {
        require(block.timestamp >= t0 + 4 * T, "Recall not available yet");
        require(stake == 0, "Tokens still staked"); // can it actually be 0?
        uint256 recallAmount = getR();
        IERC20(token).transfer(msg.sender, recallAmount);
        emit Recall(recallAmount);
    }

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
