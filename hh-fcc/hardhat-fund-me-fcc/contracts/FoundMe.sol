// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
import "hardhat/console.sol";

error FundMe__NotOwner();

/**
* @title FundMe
* @author <NAME>
* @notice This contract allows users to fund themselves with ETH and get a share of the total amount funded.
* @dev This contract uses Chainlink Price Feed to get the current ETH/USD price and checks if the user has spent more than the minimum amount required.
*/
contract FundMe {
    using PriceConverter for uint256;

    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;
    AggregatorV3Interface private s_priceFeed;

    // Could we make this constant?  /* hint: no! We should make it immutable! */
    address private immutable i_owner;
    uint256 public constant MINIMUM_USD = 0.000000001 * 10 ** 18;

    modifier onlyOwner {
         require(msg.sender == i_owner, "FundMe__NotOwner");
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    /**
    * @notice This function allows users to fund themselves with ETH and get a share of the total amount funded.
    * @dev This function uses Chainlink Price Feed to get the current ETH/USD price and checks if the user has spent more than the minimum amount required.
    */
    function fund() public payable {
        require(msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD, "You need to spend more ETH!");
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function getVersion() public view returns (uint256){
        // ETH/USD price feed address of Sepolia Network.
//        AggregatorV3Interface priceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        return s_priceFeed.version();
    }

    function withdraw() public onlyOwner {
        for (uint256 funderIndex=0; funderIndex < s_funders.length; funderIndex++){
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        console.log("Total amount withdrawn: %s", address(this).balance);
        (bool callSuccess, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        // mapping can't be in memory, sorry!
        for(uint256 funderIndex=0; funderIndex < funders.length; funderIndex++){
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = i_owner.call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

    function getAddressToAmountFunded(address fundingAddress)
    public
    view
    returns (uint256)
    {
        return s_addressToAmountFunded[fundingAddress];
    }

    // Explainer from: https://solidity-by-example.org/fallback/
    // Ether is sent to contract
    //      is msg.data empty?
    //          /   \
    //         yes  no
    //         /     \
    //    receive()?  fallback()
    //     /   \
    //   yes   no
    //  /        \
    //receive()  fallback()

}

// Concepts we didn't cover yet (will cover in later sections)
// 1. Enum
// 2. Events
// 3. Try / Catch
// 4. Function Selector
// 5. abi.encode / decode
// 6. Hash with keccak256
// 7. Yul / Assembly
