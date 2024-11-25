// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.24;

import {Base_TestV1, IHorseStore} from "./Base_TestV1.t.sol";
import {HuffDeployer} from "foundry-huff/HuffDeployer.sol";

contract HorseStoreHuff is Base_TestV1 {
    string public constant HORSE_STORE_HUFF_LOCATION =
        "horseStoreV1/HorseStore";

    function setUp() public override {
        // horseStore = // Huff Edition
        horseStore = IHorseStore(
            HuffDeployer.config().deploy(HORSE_STORE_HUFF_LOCATION)
        );
    }
}
