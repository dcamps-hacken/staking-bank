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

    event StatusUpdate(BankStatus newStatus);
    event Deposit(address indexed user, uint256 indexed amount);
    event Withdrawal(
        address indexed user,
        uint256 indexed amount,
        uint256 rewardTokens
    );

    modifier checkStatus() {
        _updateStatus();
        _;
    }

    constructor(
        uint256 _interval,
        uint256 _reward,
        address _token
    ) {
        T = _interval;
        t0 = block.timestamp;
        reward = _reward;
        R = 0;
        token = _token;
        //requires owner approval --> permit?
        /* IERC20(_token).transferFrom(msg.sender, address(this), _reward); */
    }

    // manage direct tokens/eth sent to the contract.
    fallback() external payable {}

    receive() external payable {}

    //requires user approval
    function deposit(uint256 _amount) external nonReentrant checkStatus {
        require(status == BankStatus.DEPOSIT, "Deposit period not active!");
        IERC20(token).transferFrom(msg.sender, address(this), _amount);
        balances[msg.sender] += _amount;
        stake += balances[msg.sender];
        emit Deposit(msg.sender, _amount);
    }

    function withdraw() external nonReentrant checkStatus {
        require(
            status != BankStatus(0) && status != BankStatus(1),
            "Withdrawals not available yet!"
        );
        require(balances[msg.sender] > 0, "No tokens to withdraw!");
        uint256 yield = R * (balances[msg.sender] / stake);
        uint256 balance = balances[msg.sender];
        stake -= balances[msg.sender];
        balances[msg.sender] = 0;
        IERC20(token).transfer(msg.sender, balance + yield);
        emit Withdrawal(msg.sender, balance, yield);
    }

    function recall() external onlyOwner checkStatus {
        require(status == BankStatus.THIRD_UNLOCK);
        require(stake == 0); // can it actually be 0?
        IERC20(token).transfer(msg.sender, R);
    }

    function _updateStatus() private onlyOwner {
        // Make sure all are whole numbers!!
        if (block.timestamp <= (t0 + T)) {
            if (status != BankStatus.LOCK) {
                status = BankStatus.LOCK;
                emit StatusUpdate(status);
            }
        } else if (
            (t0 + 2 * T) <= block.timestamp && block.timestamp < (t0 + 3 * T)
        ) {
            if (status != BankStatus.FIRST_UNLOCK) {
                status = BankStatus.FIRST_UNLOCK;
                emit StatusUpdate(status);
                R += (reward * 2) / 10;
            }
        } else if (
            (t0 + 3 * T) <= block.timestamp && block.timestamp < (t0 + 4 * T)
        ) {
            if (status != BankStatus.SECOND_UNLOCK) {
                status = BankStatus.SECOND_UNLOCK;
                emit StatusUpdate(status);
                R += (reward * 3) / 10;
            }
        } else {
            if (status != BankStatus.THIRD_UNLOCK) {
                status = BankStatus.THIRD_UNLOCK;
                emit StatusUpdate(status);
                R += (reward * 5) / 10;
            }
        }
    }
}
