// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {UUPSUpgradeable} from "lib/openzeppelin-contracts-upgradeable/contracts/proxy/utils/UUPSUpgradeable.sol";

contract BoxV2 is UUPSUpgradeable{
    uint256 internal number;

    function setNumber(uint256 _number) external {
        number = _number;
    }

    function getNumber() external view returns (uint256) {
        return number;
    }

    function getVersion() external pure returns (uint256) {
        return 2;
    }

    function _authorizeUpgrade(address newImplementation) internal override {}
}
