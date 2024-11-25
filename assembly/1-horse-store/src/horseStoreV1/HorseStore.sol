// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.24;

contract HorseStore {
    uint256 numberOfHorses;

    function updateHorseNumber(uint256 newNumber) external {
        numberOfHorses = newNumber;
    }

    function readNumberOfHorses() external view returns (uint256) {
        return numberOfHorses;
    }
}
