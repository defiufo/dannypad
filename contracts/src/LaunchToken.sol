// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title LaunchToken
/// @notice Fixed-supply ERC-20. Entire supply is minted once at construction.
///         No owner, no mint, no pause, no blacklist, no tax.
contract LaunchToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public immutable totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory name_, string memory symbol_, uint256 supply_, address recipient) {
        require(bytes(name_).length > 0 && bytes(symbol_).length > 0, "TOKEN_META");
        require(supply_ > 0 && recipient != address(0), "TOKEN_ARGS");
        name = name_;
        symbol = symbol_;
        totalSupply = supply_;
        balanceOf[recipient] = supply_;
        emit Transfer(address(0), recipient, supply_);
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= value, "ALLOWANCE");
            unchecked {
                allowance[from][msg.sender] = allowed - value;
            }
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "ZERO");
        uint256 bal = balanceOf[from];
        require(bal >= value, "BALANCE");
        unchecked {
            balanceOf[from] = bal - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }
}
