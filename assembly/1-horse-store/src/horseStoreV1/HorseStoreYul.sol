// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.24;

contract HorseStoreYul {
    uint256 numberOfHorses;

    function updateHorseNumber(uint256 newNumber) external {
        // numberOfHorses = newNumber;
        assembly {
            sstore(numberOfHorses.slot, newNumber)
        }
    }

    function readNumberOfHorses() external view returns (uint256) {
        // return numberOfHorses;
        assembly {
            let value := sload(numberOfHorses.slot)
            mstore(0, value)
            return(0, 0x20)
        }
    }
}
