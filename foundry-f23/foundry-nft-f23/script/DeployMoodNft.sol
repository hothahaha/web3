// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {MoodNft} from "src/MoodNft.sol";
import {Base64} from "lib/openzeppelin-contracts/contracts/utils/Base64.sol";

contract DeployMoodNft is Script {
    function run() public returns (MoodNft) {
        string memory sadSvg = vm.readFile("./img/dynamicNft/sad.svg");
        string memory happySvg = vm.readFile("./img/dynamicNft/happy.svg");

        vm.startBroadcast();
        MoodNft moodNft = new MoodNft(svgToImageURI(sadSvg), svgToImageURI(happySvg));
        vm.stopBroadcast();
        return moodNft;
    }

    function svgToImageURI(string memory svg) public pure returns (string memory) {
        string memory baseURL = "data:image/svg+xml;base64,";
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        return string(abi.encodePacked(baseURL, svgBase64Encoded));
    }
}
