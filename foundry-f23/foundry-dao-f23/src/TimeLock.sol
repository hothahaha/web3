// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TimelockController} from "lib/openzeppelin-contracts/contracts/governance/TimelockController.sol";

contract TimeLock is TimelockController {
    // minDelay 在execute前，需要等待的时间，单位是秒
    // proposers 提案人列表
    // executors 执行人列表
    constructor(uint256 minDelay, address[] memory proposers, address[] memory executors)
        TimelockController(minDelay, proposers, executors, msg.sender)
    {}
}
