pragma solidity 0.4.17;

import {TestToken} from "./TestToken.sol";

contract Reserve {
    // using SafeMath for uint;
    struct Fund {
        uint256 ethStored;
        uint256 tokenStored;
    }

    Fund public funds;

    address public owner;
    address public supportToken;
    uint256 public buyRate = 10;
    uint256 public sellRate = 10;
    address public constant ETH_ADDRESS =
        0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;

    function Reserve(address _supportToken) public {
        owner = msg.sender;
        supportToken = _supportToken;
    }

    function withdrawFunds(
        address token,
        uint256 amount,
        address destAddress
    ) public onlyOwner {}

    function setExchangeRates(uint256 _buyRate, uint256 _sellRate)
        public
        onlyOwner
    {
        require(_buyRate >= 0 && _sellRate >= 0);
        buyRate = _buyRate;
        sellRate = _sellRate;
    }

    function getExchangeRate(bool _isBuy, uint256 _srcAmount)
        public
        view
        returns (uint256)
    {
        return _isBuy ? buyRate * _srcAmount : _srcAmount / sellRate;
    }
// 
    function getToken() public view returns (TestToken) {
        return TestToken(supportToken);
    }

    function getTotalByRate(uint256 _srcAmount) public view returns (uint256) {
        return _srcAmount * buyRate;
    }

    function exchange(bool _isBuy, uint256 _srcAmount) public payable {
        TestToken tokenContract = TestToken(supportToken);
        if (_isBuy) {
            // bool result = TestToken(supportToken).transfer(this, _srcAmount * buyRate);
            bool result = tokenContract.transfer(this, 50000000000);
            if (!result) {
                revert;
            }
        } else {
            TestToken(supportToken).transferFrom(msg.sender, this, _srcAmount);
            (msg.sender).transfer(((_srcAmount) / sellRate));
        }
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
}
