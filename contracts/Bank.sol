// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Bank is Ownable, ReentrancyGuard {
    enum BankStatus {
        DEPOSIT,
        LOCK,
        FIRST_UNLOCK,
        SECOND_UNLOCK,
        THIRD_UNLOCK
    }
    BankStatus public status;

    address immutable token;
    uint256 immutable T;
    uint256 immutable t0;
    uint256 immutable reward;

    uint256 private R;
    mapping(address => uint256) public balances;
    uint256 public stake;

    constructor(
        uint256 _period,
        uint256 _reward,
        address _token
    ) {
        T = _period;
        t0 = block.timestamp;
        reward = _reward;
        R = 0;
        token = _token;
        IERC20(token).transfer(address(this), reward);
    }

    fallback() external payable {}

    receive() external payable {}

    function deposit(uint256 _amount) external nonReentrant {
        require(status == BankStatus.DEPOSIT, "Deposit period has passed!");
        IERC20(token).transfer(address(this), _amount);
        balances[msg.sender] += _amount;
        stake += balances[msg.sender];
    }

    function withdraw() external nonReentrant {
        require(
            status != BankStatus(0) && status != BankStatus(1),
            "Withdrawals not available yet!"
        );
        require(balances[msg.sender] > 0, "No tokens to withdraw!");
        uint256 yield = R * (balances[msg.sender] / stake);
        stake -= balances[msg.sender];
        balances[msg.sender] = 0;
        IERC20(token).transfer(msg.sender, balances[msg.sender] + yield);
    }

    function recall() external onlyOwner {
        require(status == BankStatus.THIRD_UNLOCK);
        require(stake == 0);
        IERC20(token).transfer(msg.sender, R);
    }

    function updateStatus() public onlyOwner {
        // Make sure all are whole numbers!!
        if (block.timestamp < (t0 + T)) {
            status = BankStatus.LOCK;
        } else if (block.timestamp > (t0 + 2 * T)) {
            status = BankStatus.FIRST_UNLOCK;
            R += (reward * 2) / 10;
        } else if (block.timestamp > (t0 + 3 * T)) {
            status = BankStatus.SECOND_UNLOCK;
            R += (reward * 3) / 10;
        } else if (block.timestamp > (t0 + 4 * T)) {
            status = BankStatus.THIRD_UNLOCK;
            R += (reward * 5) / 10;
        }
    }
}
