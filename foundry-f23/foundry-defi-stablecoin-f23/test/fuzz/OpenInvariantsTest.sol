//// SPDX-License-Identifier: MIT
//
//// Have our invariant aka properties
//
//
//pragma solidity ^0.8.19;
//
//import {Test} from "forge-std/Test.sol";
//import {StdInvariant} from "forge-std/StdInvariant.sol";
//import {DeployDSC} from "script/DeployDSC.sol";
//import {DSCEngine} from "src/DSCEngine.sol";
//import {DecentralizedStableCoin} from "src/DecentralizedStableCoin.sol";
//import {HelperConfig} from "script/HelperConfig.sol";
//import {IERC20} from "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
//
//contract OpenInvariantsTest is StdInvariant, Test {
//
//    DeployDSC public deployer;
//    DSCEngine public dsce;
//    DecentralizedStableCoin public dsc;
//    HelperConfig public config;
//    address public weth;
//    address public wbtc;
//
//    function setUp() external {
//        deployer = new DeployDSC();
//        (dsc, dsce, config) = deployer.run();
//        (,, weth, wbtc,) = config.activeNetworkConfig();
//        targetContract(address(dsce));
//    }
//
//    function invariant_protocolMustHaveMoreValueThanTotalSupply() public view {
//        // get the value of collateral in the protocol
//        // compare it to all the debt (dsc)
//        uint256 totalSupply = dsc.totalSupply();
//        uint256 totalWethDeposited = IERC20(weth).balanceOf(address(dsce));
//        uint256 totalWbtcDeposited = IERC20(wbtc).balanceOf(address(dsce));
//
//        uint256 wethValue = dsce.getUsdValue(weth, totalWethDeposited);
//        uint256 wbtcValue = dsce.getUsdValue(wbtc, totalWbtcDeposited);
//        assert(wethValue + wbtcValue >= totalSupply);
//    }
//
//}
