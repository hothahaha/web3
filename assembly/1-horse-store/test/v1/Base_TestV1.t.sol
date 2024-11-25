// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {IHorseStore} from "../../src/horseStoreV1/IHorseStore.sol";
import {HorseStore} from "../../src/horseStoreV1/HorseStore.sol";

abstract contract Base_TestV1 is Test {
    IHorseStore public horseStore;

    function setUp() public virtual {
        horseStore = IHorseStore(address(new HorseStore()));
    }

    function testReadNumberOfHorses() public view {
        uint256 expected = 0;
        uint256 actual = horseStore.readNumberOfHorses();
        assertEq(actual, expected);
    }

    function testWriteNumberOfHorses(uint256 newNumber) public {
        // uint256 newNumber = 888;
        horseStore.updateHorseNumber(newNumber);
        uint256 actual = horseStore.readNumberOfHorses();
        assertEq(actual, newNumber);
    }
}
