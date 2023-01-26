// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Multicall.sol)

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

/**
 * @dev Provides a function to batch together multiple calls in a single external call.
 *
 * _Available since v4.1._
 */
abstract contract MulticallWithForwarder is ERC2771Context {
    /**
     * @dev Receives and executes a batch of function calls on this contract.
     */
    function multicall(bytes[] calldata data) external returns (bytes[] memory results) {
        address sender = _msgSender();
        results = new bytes[](data.length);
        for (uint256 i = 0; i < data.length; i++) {
            results[i] = Address.functionDelegateCall(address(this), abi.encodePacked(data[i], sender));
        }
        return results;
    }
}
