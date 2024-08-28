// SPDX-License-Identifier: MIT

// Layout of Contract:
// version
// imports
// interfaces, libraries, contracts
// errors
// Type declarations
// State variables
// Events
// Modifiers
// Functions

// Layout of Functions:
// constructor
// receive function (if exists)
// fallback function (if exists)
// external
// public
// internal
// private
// view & pure functions

pragma solidity ^0.8.19;

import {ERC20Burnable, ERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/*
 * @title DecentralizedStableCoin
 * @author Galahad
 * Collateral: Exogenous (ETH & BTC)
 * Minting: Algorithmic
 * Relative Stability: Pegged to USD
 *
 * This is the contract meant to be governed by DSCEngine. This contract is just the ERC20
 implementation of our stablecoin system.
 *
 */
contract DecentralizedStableCoin is ERC20Burnable, Ownable {
    /* Errors */
    error DecentralizedStableCoin__MustBeMoreThanZero();
    error DecentralizedStableCoin__BurnAmountExceedsBalance();
    error DecentralizedStableCoin__NotZeroAddress();

    constructor() ERC20("DecentralizedStableCoin", "DSC") Ownable(msg.sender) {}

    function burn(uint256 amount) public override onlyOwner {
        uint256 balance = balanceOf(msg.sender);
        if (amount <= 0) {
            revert DecentralizedStableCoin__MustBeMoreThanZero();
        }
        if (amount > balance) {
            revert DecentralizedStableCoin__BurnAmountExceedsBalance();
        }
        super.burn(amount);
    }

    function mint(address _to, uint256 _amount) external onlyOwner returns (bool) {
        if (_amount <= 0) {
            revert DecentralizedStableCoin__MustBeMoreThanZero();
        }
        if (_to == address(0)) {
            revert DecentralizedStableCoin__NotZeroAddress();
        }
        _mint(_to, _amount);
        return true;
    }
}
