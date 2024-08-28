// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {Test, console} from "forge-std/Test.sol";
import {FundMe} from "../../src/FundMe.sol";
import {DeployFundMe} from "../../script/DeployFundMe.sol";
import {FundFundMe, WithdrawFundMe} from "../../script/Interactions.sol";

contract InteractionsTest is Test {

    FundMe fundMe;

    address private USER = makeAddr("user");
    uint256 private constant SEND_VALUE = 0.1 ether;
    uint256 private constant STARTING_BALANCE = 1000000 ether;
    uint256 private constant GAS_PRICE = 1;

    function setUp() external {
        DeployFundMe deploy = new DeployFundMe();
        fundMe = deploy.run();
        deal(USER, STARTING_BALANCE);
    }

    function testUserCanFundInteractions() public {
        FundFundMe fundFundMe = new FundFundMe();
        fundFundMe.fundFundMe(address(fundMe));

        WithdrawFundMe withdrawFundMe = new WithdrawFundMe();
        withdrawFundMe.withdrawFundMe(address(fundMe));

        assertEq(address(fundMe).balance, 0);
    }
}
