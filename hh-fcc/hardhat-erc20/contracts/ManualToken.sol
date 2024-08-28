// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ManualToken {
    uint256 public initialSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // tramsfer tokens
    // substract from address amount and add to to address

    function transfer(
        address _from,
        address _to,
        uint256 _value
    ) public
    returns
    (bool success) {
        require(balanceOf[_from] >= _value);
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
    }

    function transferFrom() public {

    }
}
