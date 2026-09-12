// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {LaunchToken} from "./LaunchToken.sol";
import {LaunchSale} from "./LaunchSale.sol";

/// @title LaunchpadFactory
/// @notice Permissionless factory: one transaction deploys a fixed-supply token
///         and an ETH sale pool on Base.
contract LaunchpadFactory {
    struct CreateParams {
        string name;
        string symbol;
        uint256 totalSupply;
        uint256 tokensForSale;
        uint256 softCap;
        uint256 hardCap;
        uint256 minBuy;
        uint256 maxBuy;
        uint64 startTime;
        uint64 endTime;
    }

    address public owner;
    address public feeRecipient;
    uint16 public feeBps;
    uint256 public creationFee;

    address[] public launches;
    mapping(address => bool) public isLaunch;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event FeesUpdated(uint16 feeBps, address feeRecipient, uint256 creationFee);
    event LaunchCreated(
        address indexed creator,
        address indexed sale,
        address indexed token,
        string name,
        string symbol,
        uint256 tokensForSale,
        uint256 hardCap,
        uint64 startTime,
        uint64 endTime
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "OWNER");
        _;
    }

    constructor(address feeRecipient_, uint16 feeBps_, uint256 creationFee_) {
        require(feeRecipient_ != address(0), "FEE_TO");
        require(feeBps_ <= 500, "FEE");
        owner = msg.sender;
        feeRecipient = feeRecipient_;
        feeBps = feeBps_;
        creationFee = creationFee_;
        emit OwnershipTransferred(address(0), msg.sender);
        emit FeesUpdated(feeBps_, feeRecipient_, creationFee_);
    }

    function createLaunch(CreateParams calldata p) external payable returns (address sale, address token) {
        require(msg.value >= creationFee, "CREATE_FEE");
        require(bytes(p.name).length > 0 && bytes(p.name).length <= 32, "NAME");
        require(bytes(p.symbol).length > 0 && bytes(p.symbol).length <= 12, "SYMBOL");
        require(p.totalSupply >= p.tokensForSale && p.tokensForSale > 0, "SUPPLY");
        require(p.startTime + 120 >= block.timestamp, "START");
        require(p.endTime > p.startTime && p.endTime - p.startTime <= 30 days, "DURATION");

        LaunchToken t = new LaunchToken(p.name, p.symbol, p.totalSupply, address(this));

        LaunchSale.Config memory cfg = LaunchSale.Config({
            creator: msg.sender,
            token: address(t),
            tokensForSale: p.tokensForSale,
            softCap: p.softCap,
            hardCap: p.hardCap,
            minBuy: p.minBuy,
            maxBuy: p.maxBuy,
            startTime: p.startTime,
            endTime: p.endTime,
            feeBps: feeBps,
            feeRecipient: feeRecipient
        });

        LaunchSale s = new LaunchSale(cfg);

        require(t.transfer(address(s), p.tokensForSale), "SALE_TOKENS");
        uint256 remainder = p.totalSupply - p.tokensForSale;
        if (remainder > 0) {
            require(t.transfer(msg.sender, remainder), "CREATOR_TOKENS");
        }

        sale = address(s);
        token = address(t);
        launches.push(sale);
        isLaunch[sale] = true;

        if (creationFee > 0) {
            (bool ok,) = owner.call{value: creationFee}("");
            require(ok, "FEE_PAY");
        }
        if (msg.value > creationFee) {
            (bool ok2,) = msg.sender.call{value: msg.value - creationFee}("");
            require(ok2, "REFUND");
        }

        emit LaunchCreated(
            msg.sender, sale, token, p.name, p.symbol, p.tokensForSale, p.hardCap, p.startTime, p.endTime
        );
    }

    function launchCount() external view returns (uint256) {
        return launches.length;
    }

    function getLaunches(uint256 offset, uint256 limit) external view returns (address[] memory out) {
        uint256 n = launches.length;
        if (offset >= n) return new address[](0);
        uint256 end = offset + limit;
        if (end > n) end = n;
        out = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            out[i - offset] = launches[i];
        }
    }

    function setFees(uint16 feeBps_, address feeRecipient_, uint256 creationFee_) external onlyOwner {
        require(feeBps_ <= 500, "FEE");
        require(feeRecipient_ != address(0), "FEE_TO");
        feeBps = feeBps_;
        feeRecipient = feeRecipient_;
        creationFee = creationFee_;
        emit FeesUpdated(feeBps_, feeRecipient_, creationFee_);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
