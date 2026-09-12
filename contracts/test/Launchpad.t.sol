// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {LaunchpadFactory} from "../src/LaunchpadFactory.sol";
import {LaunchSale} from "../src/LaunchSale.sol";
import {LaunchToken} from "../src/LaunchToken.sol";

contract LaunchpadTest is Test {
    LaunchpadFactory factory;
    address creator = address(0xA11CE);
    address alice = address(0xB0B);
    address bob = address(0xB0B2);
    address feeTo = address(0xFEE);

    function setUp() public {
        factory = new LaunchpadFactory(feeTo, 100, 0);
        vm.deal(creator, 10 ether);
        vm.deal(alice, 50 ether);
        vm.deal(bob, 50 ether);
    }

    function _params() internal view returns (LaunchpadFactory.CreateParams memory p) {
        p = LaunchpadFactory.CreateParams({
            name: "Danny Coin",
            symbol: "DANN",
            totalSupply: 1_000_000_000 ether,
            tokensForSale: 400_000_000 ether,
            softCap: 5 ether,
            hardCap: 10 ether,
            minBuy: 0.01 ether,
            maxBuy: 5 ether,
            startTime: uint64(block.timestamp + 1),
            endTime: uint64(block.timestamp + 1 days)
        });
    }

    function testCreateAndSuccessfulSale() public {
        vm.prank(creator);
        (address saleAddr, address tokenAddr) = factory.createLaunch(_params());
        LaunchSale sale = LaunchSale(payable(saleAddr));
        LaunchToken token = LaunchToken(tokenAddr);

        assertEq(token.balanceOf(saleAddr), 400_000_000 ether);
        assertEq(token.balanceOf(creator), 600_000_000 ether);
        assertEq(factory.launchCount(), 1);

        vm.warp(block.timestamp + 2);

        vm.prank(alice);
        sale.contribute{value: 5 ether}();
        vm.prank(bob);
        sale.contribute{value: 5 ether}();

        assertEq(sale.raised(), 10 ether);
        assertTrue(sale.finalized());
        assertTrue(sale.successful());

        vm.prank(alice);
        sale.claim();
        assertEq(token.balanceOf(alice), 200_000_000 ether);

        vm.prank(bob);
        sale.claim();
        assertEq(token.balanceOf(bob), 200_000_000 ether);

        uint256 creatorBefore = creator.balance;
        vm.prank(creator);
        sale.withdrawRaised();
        assertEq(feeTo.balance, 0.1 ether);
        assertEq(creator.balance - creatorBefore, 9.9 ether);
    }

    function test_FailedSaleRefund() public {
        vm.prank(creator);
        (address saleAddr,) = factory.createLaunch(_params());
        LaunchSale sale = LaunchSale(payable(saleAddr));

        vm.warp(block.timestamp + 2);
        vm.prank(alice);
        sale.contribute{value: 1 ether}();

        vm.warp(block.timestamp + 2 days);
        sale.finalize();
        assertFalse(sale.successful());

        uint256 before = alice.balance;
        vm.prank(alice);
        sale.refund();
        assertEq(alice.balance - before, 1 ether);
    }

    function testRejectOverMaxBuy() public {
        vm.prank(creator);
        (address saleAddr,) = factory.createLaunch(_params());
        LaunchSale sale = LaunchSale(payable(saleAddr));
        vm.warp(block.timestamp + 2);
        vm.prank(alice);
        vm.expectRevert(bytes("MAX"));
        sale.contribute{value: 5.01 ether}();
    }
}
