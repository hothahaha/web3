// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {DeployBox} from "script/DeployBox.sol";
import {UpgradeBox} from "script/UpgradeBox.sol";
import {BoxV1} from "src/BoxV1.sol";
import {BoxV2} from "src/BoxV2.sol";

contract DeployAndUpgradeTest is Test {

    DeployBox public deployer;
    UpgradeBox public upgrader;
    address public owner = makeAddr("owner");

    address public proxy;

    function setUp() public {
        deployer = new DeployBox();
        upgrader = new UpgradeBox();
        proxy = deployer.run();
    }

    function testProxyStartsAsBoxV1() public {
        vm.expectRevert();
        BoxV2(proxy).setNumber(7);
    }

    function testUpgrades() public {
        BoxV2 boxV2 = new BoxV2();
        upgrader.upgradeBox(proxy, address(boxV2));
        uint256 expectedValue = 2;
        assertEq(expectedValue, BoxV2(proxy).getVersion());

        BoxV2(proxy).setNumber(7);
        assertEq(7, BoxV2(proxy).getNumber());
    }

}
