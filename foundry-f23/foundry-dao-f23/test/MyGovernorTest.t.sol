// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {Box} from "../src/Box.sol";
import {GovToken} from "../src/GovToken.sol";
import {MyGovernor} from "../src/MyGovernor.sol";
import {TimeLock} from "../src/TimeLock.sol";

contract MyGovernorTest is Test {
    Box box;
    GovToken govToken;
    MyGovernor myGovernor;
    TimeLock timeLock;

    address public USER = makeAddr("user");
    uint256 public constant INITIAL_SUPPLY = 100 ether;

    address[] proposers;
    address[] executors;
    
    address[] targets;
    uint256[] values;
    bytes[] calldatas;

    uint256 public constant MIN_DELAY = 3600; // 1 hour
    uint256 public constant VOTING_DELAY = 1; // 1个区块
    uint256 public constant VOTING_PERIOD = 50400;

    function setUp() public {
        govToken = new GovToken();
        govToken.mint(USER, INITIAL_SUPPLY);

        vm.startPrank(USER);
        govToken.delegate(USER);
        timeLock = new TimeLock(MIN_DELAY, proposers, executors);
        myGovernor = new MyGovernor(govToken, timeLock);

        bytes32 proposerRole = timeLock.PROPOSER_ROLE();
        bytes32 executorRole = timeLock.EXECUTOR_ROLE();
        bytes32 adminRole = timeLock.DEFAULT_ADMIN_ROLE();

        timeLock.grantRole(proposerRole, address(myGovernor));
        timeLock.grantRole(executorRole, address(0));
        timeLock.revokeRole(adminRole, msg.sender);
        vm.stopPrank();

        box = new Box();
        box.transferOwnership(address(timeLock));
    }

    function testCantUpdateBoxWithoutGovernance() public {
        vm.expectRevert();
        box.store(123);
    }
    
    function testGovernanceUpdatesBox() public {
        uint256 valueToStore = 888;
        string memory description = "store 1 in Box";
        bytes memory encodedFunctionCall = abi.encodeWithSignature("store(uint256)", valueToStore);
        values.push(0);
        calldatas.push(encodedFunctionCall);
        targets.push(address(box));
        
        // 1. 提议
        uint256 proposalId = myGovernor.propose(targets, values, calldatas, description);
        
        // 查看提议状态
        console.log("Proposal State: ", uint256(myGovernor.state(proposalId)));
        
        vm.warp(block.timestamp + VOTING_DELAY + 1);
        vm.roll(block.number + VOTING_DELAY + 1);
        
        console.log(myGovernor.proposalSnapshot(proposalId));
        console.log(myGovernor.proposalDeadline(proposalId));
        console.log(myGovernor.clock());
        console.log("Proposal State: ", uint256(myGovernor.state(proposalId)));
        
        // 2. 投票
        string memory reason = "I approve";
        
        uint8 voteWay = 1; // voting yes
        vm.prank(USER);
        myGovernor.castVoteWithReason(proposalId, voteWay, reason);
        
        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        vm.roll(block.number + VOTING_PERIOD + 1);
        
        // 3. TX排队
        bytes32 descriptionHash = keccak256(abi.encodePacked(description));
        myGovernor.queue(targets, values, calldatas, descriptionHash);
        
        vm.warp(block.timestamp + MIN_DELAY + 1);
        vm.roll(block.number + MIN_DELAY + 1);
        
        // 4. 执行
        myGovernor.execute(targets, values, calldatas, descriptionHash);
        
        assertEq(box.getNumber(), valueToStore);
        console.log("Box number: ", box.getNumber());
    }
}
