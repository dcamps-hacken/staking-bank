// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Bank {

    uint256 immutable T;
    uint256 immutable t0;
    uint256 /* immutable */ R1;
    uint256 /* immutable */ R2;
    uint256 /* immutable */ R3;
    mapping(address => uint256) public balances;

    address immutable token;



    constructor(uint256 _period, uint256 _reward, address _token){
        T = _period;
        t0 = block.timestamp;
        
        // Make sure all are whole numbers!!
        R = _reward;
        R1 = R*2/10;
        R2 = R*3/10;
        R3 = R*5/10;

        //IERC20(token).transfer(address(this), _amount);
        token = _token;


    }

    fallback() external payable {}

    function deposit(uint256 _amount) external {
        require(block.timestamp <= (t0 + T), "Deposit period has passed!");
        //IERC20(token).transfer(address(this), _amount);
        balances[msg.sender] += _amount;
    }

    function withdraw() external {
        require(block.timestamp > (t0 + 2*T), "Lock period still active!");
        // use enum for time periods?
    }

    function recall() external onlyOwner {
        IERC20(token).transfer(msg.sender, R);
    }
}
