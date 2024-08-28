// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {ZkSyncChainChecker} from "foundry-devops/ZkSyncChainChecker.sol";
import {FoundryZkSyncChecker} from "foundry-devops/FoundryZkSyncChecker.sol";

contract ZkSyncDevOps is Test, ZkSyncChainChecker, FoundryZkSyncChecker {
    // Remove the `skipZkSync`, then run `forge test --mt testZkSyncChainFails --zksync` and this will fail!
    function testZkSyncChainFails() public skipZkSync {
        address ripemd = address(uint160(3));

        bool success;
        // Don't worry about what this "assembly" thing is for now
        assembly {
            success := call(gas(), ripemd, 0, 0, 0, 0, 0)
        }
        assert(success);
    }

    // You'll need `ffi=true` in your foundry.toml to run this test
    // // Remove the `onlyVanillaFoundry`, then run `foundryup-zksync` and then
    // // `forge test --mt testZkSyncFoundryFails --zksync`
    // // and this will fail!
    // function testZkSyncFoundryFails() public onlyVanillaFoundry {
    //     bool exists = vm.keyExistsJson('{"hi": "true"}', ".hi");
    //     assert(exists);
    // }
}
