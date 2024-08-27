// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract BoxV2 {
    uint256 internal value;

    event ValueChanged(uint256 newValue);

    function setValue(uint256 _value) public {
        value = _value;
        emit ValueChanged(_value);
    }

    function retrieve() public view returns (uint256) {
        return value;
    }

    function version() public pure returns (uint256) {
        return 2;
    }

    function increment() public {
        value += 1;
        emit ValueChanged(value);
    }
}
