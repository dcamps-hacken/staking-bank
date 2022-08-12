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

    address public immutable token;
    uint256 public immutable T;
    uint256 public immutable t0;
    uint256 public immutable reward;

    uint256 private R;
    mapping(address => uint256) private balances;
    uint256 private stake;

    event StatusUpdate(BankStatus newStatus);
    event Deposit(address indexed user, uint256 indexed amount);
    event Withdrawal(
        address indexed user,
        uint256 indexed amount,
        uint256 rewardTokens
    );
    event Recall(uint256 indexed amount);

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
    function deposit(uint256 _amount)
        external
        nonReentrant /* checkStatus */
    {
        require(status == BankStatus.DEPOSIT, "Deposit period not active!");
        IERC20(token).transferFrom(msg.sender, address(this), _amount);
        balances[msg.sender] += _amount;
        stake += balances[msg.sender];
        emit Deposit(msg.sender, _amount);
    }

    function withdraw()
        external
        nonReentrant /* checkStatus */
    {
        require(
            status != BankStatus.DEPOSIT && status != BankStatus.LOCK,
            "Withdrawals not available yet!"
        );
        require(balances[msg.sender] > 0, "No tokens to withdraw!");
        uint256 balance = balances[msg.sender];
        uint256 yield = R * (balance / stake);
        stake -= balance;
        balances[msg.sender] = 0;
        IERC20(token).transfer(msg.sender, balance + yield);
        emit Withdrawal(msg.sender, balance, yield);
    }

    function recall() external onlyOwner checkStatus {
        //require(status == BankStatus.THIRD_UNLOCK, "Recall not available yet");
        require(stake == 0, "Tokens still staked"); // can it actually be 0?
        IERC20(token).transfer(msg.sender, R);
        emit Recall(R);
    }

    function _updateStatus() private {
        // Make sure all are whole numbers!!
        uint256 interval = T;
        uint256 lockStart = t0 + interval;
        uint256 firstUnlockStart = lockStart + interval;
        uint256 secondUnlockStart = firstUnlockStart + interval;
        uint256 thirdUnlockStart = secondUnlockStart + interval;
        if (block.timestamp <= lockStart) {
            if (status != BankStatus.LOCK) {
                status = BankStatus.LOCK;
                emit StatusUpdate(status);
            }
        } else if (
            firstUnlockStart <= block.timestamp &&
            block.timestamp < secondUnlockStart
        ) {
            if (status != BankStatus.FIRST_UNLOCK) {
                status = BankStatus.FIRST_UNLOCK;
                emit StatusUpdate(status);
                R += (reward * 2) / 10;
            }
        } else if (
            secondUnlockStart <= block.timestamp &&
            block.timestamp < thirdUnlockStart
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

    function getStake() public view returns (uint256) {
        return stake;
    }

    function getBalance(address _user) public view returns (uint256 balance) {
        balance = balances[_user];
        return balance;
    }

    function getReward() public view returns (uint256) {
        return R;
    }
}
