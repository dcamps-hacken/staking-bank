// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Bank {

    uint256 immutable T;
    uint256 immutable t0;
    uint256 /* immutable */ R;
    mapping(address => uint256) public balances;

    address immutable token;



    constructor(uint256 _period, uint256 _reward, address _token){
        T = _period;
        t0 = block.timestamp;
        R = _reward;
        //IERC20(token).transfer(address(this), _amount);
        token = _token;


    }

    fallback() external payable {}

    function deposit(uint256 _amount) external {
        require(block.timestamp <= (t0 + T)
        //IERC20(token).transfer(address(this), _amount);
        balances[msg.sender] += _amount;
    }

    function withdraw() external {
        require(block.timestamp > (t0 + 2*T))
    }
}
