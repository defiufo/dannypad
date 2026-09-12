// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {LaunchpadFactory} from "../src/LaunchpadFactory.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address feeTo = vm.envOr("FEE_RECIPIENT", deployer);
        uint16 feeBps = uint16(vm.envOr("FEE_BPS", uint256(100)));
        uint256 creationFee = vm.envOr("CREATION_FEE", uint256(0));

        vm.startBroadcast(pk);
        LaunchpadFactory factory = new LaunchpadFactory(feeTo, feeBps, creationFee);
        vm.stopBroadcast();

        console.log("Deployer", deployer);
        console.log("Factory", address(factory));
        console.log("Fee recipient", feeTo);
        console.log("Fee bps", feeBps);
    }
}
