pragma solidity 0.4.17;

import {TestToken} from "./TestToken.sol";

contract Reserve {
    struct Fund {
        uint256 ethStored;
        uint256 tokenStored;
    }

    Fund public funds;
    TestToken public reservedToken;

    address public owner;
    uint256 public decimals;
    uint256 private constant inWei = 10 ** 18;
    address public supportToken;
    uint256 public buyRate = 120;
    uint256 public sellRate = 300;
    address private constant ETH_ADDRESS =
        0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;
    bool public trade = true;

    // function Reserve(address _supportToken) public {
    //     owner = msg.sender;
    //     supportToken = _supportToken;
    //     TestToken tokenContract = TestToken(supportToken);
    //     decimals = tokenContract.decimals();
        
    //     funds.ethStored = 0;
    //     funds.tokenStored = 10000000 * (10 ** decimals);
    // }


    function Reserve(string _name, string _symbol, uint _decimals) public {
        owner = msg.sender;
        reservedToken = new TestToken(_name, _symbol, _decimals);
        supportToken = address(reservedToken);
        decimals = reservedToken.decimals();
        funds.ethStored = 0;
        funds.tokenStored = 10000000 * (10 ** decimals);
    }

    function getTokenAddress() public view returns (address) {
        return address(reservedToken);
    }

    function() public payable {
        funds.ethStored += msg.value;
    }

    function withdrawFunds(
        address _token,
        uint256 _amount,
        address _destAddress
    ) public onlyOwner {
        if (_token == ETH_ADDRESS) {
            require(_amount <= funds.ethStored);
            _destAddress.transfer(_amount);
            funds.ethStored -= _amount;
        }
        if (_token == supportToken) {
            require(_amount <= funds.tokenStored);
            TestToken tokenContract = TestToken(supportToken);
            tokenContract.transfer(_destAddress, _amount);
            funds.tokenStored -= _amount;
        }
    }

    function setExchangeRates(
        uint256 _buyRate,
        uint256 _sellRate
    ) public onlyOwner {
        buyRate = _buyRate;
        sellRate = _sellRate;
    }

    function getExchangeRate(
        bool _isBuy,
        uint256 _srcAmount
    ) public view returns (uint256) {
        return _isBuy ? buyRate * _srcAmount : _srcAmount / sellRate;
        // if (_isBuy) {
        //     if (funds.tokenStored > 0) {
        //         return (((_srcAmount * (10**decimals) * (10**decimals)) /
        //             inWei) / buyRate);
        //     }
        //     return 0;
        // } else {
        //     if (funds.ethStored > 0) {
        //         return
        //             ((_srcAmount * (10**decimals) * inWei)) /
        //             (sellRate * (10**decimals));
        //     }
        //     return 0;
        // }
    }

    function toDecimal(uint256 _value) private view returns (uint256) {
        return _value * (10 ** decimals);
    }

    function exchange(
        bool _isBuy,
        uint256 _srcAmount
    ) public payable onlyTradable {
        TestToken tokenContract = TestToken(supportToken);
        uint256 transferAmount;
        if (_isBuy) {
            require(_srcAmount == msg.value);
            transferAmount = getExchangeRate(true, _srcAmount);
            //check enough token to send back
            require(transferAmount != 0 && funds.tokenStored >= transferAmount);
            tokenContract.transfer(msg.sender, transferAmount);
            funds.tokenStored -= transferAmount;
            funds.ethStored += msg.value;
        } else {
            tokenContract.transferFrom(msg.sender, address(this), _srcAmount);
            transferAmount = getExchangeRate(false, _srcAmount);
            // //check enough ether to send back
            require(transferAmount != 0 && funds.ethStored >= transferAmount);
            // msg.sender.transfer(transferAmount);
            funds.tokenStored += _srcAmount;
            funds.ethStored -= transferAmount;
        }
    }

    function setTradable(bool _flag) public onlyOwner {
        trade = _flag;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyTradable() {
        require(trade == true);
        _;
    }
}
