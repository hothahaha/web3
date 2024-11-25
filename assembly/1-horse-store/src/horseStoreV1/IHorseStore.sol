// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.24;

interface IHorseStore {
    function updateHorseNumber(uint256 newNumber) external;
    function readNumberOfHorses() external view returns (uint256);
}
