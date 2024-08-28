// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {DeployOurToken} from "script/DeployOurToken.sol";
import {OurToken} from "src/OurToken.sol";

interface MintableToken {
    function mint(address, uint256) external;
}

contract OurTokenTest is Test {

    OurToken public ourToken;
    DeployOurToken public deployer;

    address bob = makeAddr("bob");
    address alice = makeAddr("alice");

    uint256 private constant STARTING_BALANCE = 100 ether;

    function setUp() public {
        deployer = new DeployOurToken();
        ourToken = deployer.run();

        vm.prank(msg.sender);
        ourToken.transfer(bob, STARTING_BALANCE);
    }

    function testBobBalance() public {
        assertEq(ourToken.balanceOf(bob), STARTING_BALANCE);
    }

    function testAllowanceWorks() public {
        uint256 initialAllowance = 1000;

        // Bob approves Alice to spend tokens on his behalf
        vm.prank(bob);
        ourToken.approve(alice, initialAllowance);

        uint256 transferAmount = 500;
        vm.prank(alice);
        ourToken.transferFrom(bob, alice, transferAmount);

        assertEq(ourToken.balanceOf(alice), transferAmount);
        assertEq(ourToken.balanceOf(bob), STARTING_BALANCE - transferAmount);
    }

    /*function testInitialSupply() public {
        assertEq(ourToken.totalSupply(), deployer.INITIAL_SUPPLY);
    }*/

    function testUsersCantMint() public {
        vm.expectRevert();
        MintableToken(address(ourToken)).mint(address(this), 1);
    }

    function testTransfer() public {
        uint256 initialBalanceAccount1 = ourToken.balanceOf(bob);
        uint256 transferAmount = 100;

        vm.prank(bob);
        ourToken.transfer(alice, transferAmount);

        assertEq(ourToken.balanceOf(bob), initialBalanceAccount1 - transferAmount);
        assertEq(ourToken.balanceOf(alice), transferAmount);
    }

    function testApprove() public {
        uint256 approveAmount = 500;
        vm.prank(bob);
        ourToken.approve(alice, approveAmount);

        assertEq(ourToken.allowance(bob, alice), approveAmount);
    }

    function testTransferFrom() public {
        uint256 approveAmount = 500;
        uint256 transferAmount = 100;
        vm.prank(bob);
        ourToken.approve(address(this), approveAmount);

        uint256 initialBalanceAccount1 = ourToken.balanceOf(bob);
        uint256 initialBalanceAccount2 = ourToken.balanceOf(alice);

        ourToken.transferFrom(bob, alice, transferAmount);

        assertEq(ourToken.balanceOf(bob), initialBalanceAccount1 - transferAmount);
        assertEq(ourToken.balanceOf(alice), initialBalanceAccount2 + transferAmount);
    }

}
