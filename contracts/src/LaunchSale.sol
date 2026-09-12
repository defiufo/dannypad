// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {LaunchToken} from "./LaunchToken.sol";

/// @title LaunchSale
/// @notice Fixed-price ETH sale on Base. Tokens are claimable after a successful
///         raise. Failed sales are fully refundable. Creator withdraws ETH minus
///         a protocol fee after success.
contract LaunchSale {
    struct Config {
        address creator;
        address token;
        uint256 tokensForSale;
        uint256 softCap;
        uint256 hardCap;
        uint256 minBuy;
        uint256 maxBuy;
        uint64 startTime;
        uint64 endTime;
        uint16 feeBps;
        address feeRecipient;
    }

    Config public config;

    uint256 public raised;
    bool public finalized;
    bool public successful;
    bool public creatorWithdrawn;

    mapping(address => uint256) public contributed;
    mapping(address => bool) public claimed;

    uint256 private _locked = 1;

    event Contributed(address indexed user, uint256 amount, uint256 totalRaised);
    event Finalized(bool success, uint256 raised);
    event Claimed(address indexed user, uint256 tokens);
    event Refunded(address indexed user, uint256 amount);
    event CreatorWithdrawn(uint256 creatorAmount, uint256 feeAmount);
    event UnsoldTokensWithdrawn(uint256 amount);

    modifier nonReentrant() {
        require(_locked == 1, "REENTRANCY");
        _locked = 2;
        _;
        _locked = 1;
    }

    constructor(Config memory cfg) {
        require(cfg.creator != address(0) && cfg.token != address(0), "ADDR");
        require(cfg.tokensForSale > 0, "TOKENS");
        require(cfg.hardCap >= cfg.softCap && cfg.softCap > 0, "CAPS");
        require(cfg.minBuy > 0 && cfg.maxBuy >= cfg.minBuy, "BUYS");
        require(cfg.endTime > cfg.startTime, "TIME");
        require(cfg.feeBps <= 500, "FEE");
        require(cfg.feeRecipient != address(0), "FEE_TO");
        config = cfg;
    }

    function contribute() external payable nonReentrant {
        Config memory c = config;
        require(block.timestamp >= c.startTime && block.timestamp < c.endTime, "NOT_LIVE");
        require(!finalized, "DONE");
        require(msg.value >= c.minBuy, "MIN");
        require(raised < c.hardCap, "HARDCAP");

        uint256 amount = msg.value;
        uint256 room = c.hardCap - raised;
        uint256 refundExcess;
        if (amount > room) {
            refundExcess = amount - room;
            amount = room;
        }

        uint256 newUserTotal = contributed[msg.sender] + amount;
        require(newUserTotal <= c.maxBuy, "MAX");

        contributed[msg.sender] = newUserTotal;
        raised += amount;
        emit Contributed(msg.sender, amount, raised);

        if (refundExcess > 0) {
            _sendEth(msg.sender, refundExcess);
        }

        if (raised == c.hardCap) {
            _finalize();
        }
    }

    function finalize() external nonReentrant {
        require(!finalized, "DONE");
        Config memory c = config;
        require(block.timestamp >= c.endTime || raised == c.hardCap, "EARLY");
        _finalize();
    }

    function _finalize() internal {
        finalized = true;
        successful = raised >= config.softCap;
        emit Finalized(successful, raised);
    }

    function claim() external nonReentrant {
        require(finalized && successful, "NOT_SUCCESS");
        require(!claimed[msg.sender], "CLAIMED");
        uint256 userContrib = contributed[msg.sender];
        require(userContrib > 0, "NONE");
        claimed[msg.sender] = true;

        uint256 tokens = (userContrib * config.tokensForSale) / config.hardCap;
        require(LaunchToken(config.token).transfer(msg.sender, tokens), "XFER");
        emit Claimed(msg.sender, tokens);
    }

    function refund() external nonReentrant {
        require(finalized && !successful, "NOT_FAIL");
        uint256 userContrib = contributed[msg.sender];
        require(userContrib > 0, "NONE");
        contributed[msg.sender] = 0;
        _sendEth(msg.sender, userContrib);
        emit Refunded(msg.sender, userContrib);
    }

    function withdrawRaised() external nonReentrant {
        require(finalized && successful, "NOT_SUCCESS");
        require(msg.sender == config.creator, "CREATOR");
        require(!creatorWithdrawn, "TAKEN");
        creatorWithdrawn = true;

        uint256 fee = (raised * config.feeBps) / 10_000;
        uint256 toCreator = raised - fee;
        if (fee > 0) _sendEth(config.feeRecipient, fee);
        if (toCreator > 0) _sendEth(config.creator, toCreator);
        emit CreatorWithdrawn(toCreator, fee);
    }

    function withdrawUnsoldTokens() external nonReentrant {
        require(finalized && successful, "NOT_SUCCESS");
        require(msg.sender == config.creator, "CREATOR");
        uint256 sold = (raised * config.tokensForSale) / config.hardCap;
        uint256 unsold = config.tokensForSale - sold;
        if (unsold > 0) {
            require(LaunchToken(config.token).transfer(config.creator, unsold), "XFER");
        }
        emit UnsoldTokensWithdrawn(unsold);
    }

    function tokensOwed(address user) public view returns (uint256) {
        if (contributed[user] == 0) return 0;
        return (contributed[user] * config.tokensForSale) / config.hardCap;
    }

    function status() public view returns (uint8) {
        if (finalized) return successful ? 3 : 4;
        if (block.timestamp < config.startTime) return 0;
        if (block.timestamp >= config.endTime || raised >= config.hardCap) return 2;
        return 1;
    }

    function _sendEth(address to, uint256 amount) internal {
        (bool ok,) = to.call{value: amount}("");
        require(ok, "ETH");
    }

    receive() external payable {
        revert("USE_CONTRIBUTE");
    }
}
