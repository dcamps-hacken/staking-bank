//SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/** @title ERC20 token Wizard ($WZD)
 *  @author David Camps Novi
 *  @dev This contract uses ERC20 standard from OpenZeppelin to create and
 *  mint $WZD test token from any address
 */

contract Wizard is ERC20 {
    /**
     *  @notice 10M tokens are minted when the contract is deployed
     */
    constructor() ERC20("Wizard", "WZD") {
        _mint(msg.sender, 1e5 * 10**decimals());
    }

    /**
     *  @notice Use this function to mint any amount of tokens
     *  @dev This method uses the ERC20 _mint() function from OpenZeppelin
     *  and has no minting limit
     *  @param _to is the address that will receive the minted tokens
     */
    function mint(address _to, uint256 _amount) external {
        uint256 amount = _amount * 10**decimals();
        _mint(_to, amount);
    }
}
