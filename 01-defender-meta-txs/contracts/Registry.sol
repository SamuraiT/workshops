// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";
import "./MulticallWithForwarder.sol";


contract Registry is ERC2771Context, MulticallWithForwarder {
    event Registered(address indexed who, string name);

    mapping(address => string) public names;
    mapping(string => address) public owners;

    constructor(
        MinimalForwarder forwarder // Initialize trusted forwarder
    ) ERC2771Context(address(forwarder)) {}

    function register(string memory name) public {
        require(owners[name] == address(0), "Name taken");
        address owner = _msgSender(); // Changed from msg.sender
        owners[name] = owner;
        names[owner] = name;
        emit Registered(owner, name);
    }
}
