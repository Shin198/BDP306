pragma solidity 0.4.17;

import "./Reserve.sol";
import {TestToken} from "./TestToken.sol";

contract Exchange {
    address public owner;
    address public constant ETH_ADDRESS =
        0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;
    mapping(address => address) public listReserve;
    uint256 private constant inWei = 10 ** 18;
    bool public trade = true;

    function Exchange() public {
        owner = msg.sender;
    }

    function addReserve(
        address _reserve,
        address _token,
        bool _isAdd
    ) public onlyOwner returns (bool) {
        if (_isAdd) {
            listReserve[_token] = _reserve;
            TestToken token = TestToken(_token);
            token.approve(_reserve, 100 * 1e18);
            return true;
        } else {
            delete listReserve[_token];
            return true;
        }
    }

    function getExchangeRate(
        address _srcToken,
        address _destToken,
        uint256 _srcAmmount
    ) public view returns (uint256) {
        //if _srcToken = ETH => buy token
        if (_srcToken == ETH_ADDRESS) {
            Reserve re = Reserve(listReserve[_destToken]);
            return re.getExchangeRate(true, _srcAmmount);
        }
        //else if _destToken = ETH => sell token
        else if (_destToken == ETH_ADDRESS) {
            re = Reserve(listReserve[_srcToken]);
            return re.getExchangeRate(false, _srcAmmount);
        }
        //else exchange token to token
        else {
            Reserve reSrc = Reserve(listReserve[_srcToken]);
            uint256 weiRecieved = reSrc.getExchangeRate(false, _srcAmmount);
            Reserve reDest = Reserve(listReserve[_destToken]);
            return reDest.getExchangeRate(true, weiRecieved);
        }
    }

    function exchangeToken(address _srcToken, address _destToken, uint _srcAmmount) public payable onlyTradable {
        
        TestToken srcTokenContract;
        TestToken destTokenContract;
        Reserve srcReserve;
        Reserve destReserve;
        uint weiRecieved;
        uint tokenReceived;
        
          //if _srcToken = ETH => buy token
          
        if(_srcToken == ETH_ADDRESS){
            
            require(_srcAmmount == msg.value);
            destTokenContract = TestToken(_destToken);
            destReserve = Reserve(listReserve[_destToken]);
            destReserve.exchange.value(msg.value)(true, _srcAmmount);
            tokenReceived = getExchangeRate(ETH_ADDRESS, _destToken, _srcAmmount);
            destTokenContract.transfer(msg.sender, tokenReceived);
            
        } else if (_destToken == ETH_ADDRESS){ //else if _destToken = ETH => sell token
        
            srcTokenContract = TestToken(_srcToken);
            srcReserve = Reserve(listReserve[_srcToken]);
            
            srcTokenContract.approve(address(srcReserve), _srcAmmount);
            srcTokenContract.transferFrom(msg.sender, address(this), _srcAmmount);

            srcReserve.exchange(false, _srcAmmount);
            // weiRecieved = getExchangeRate(_srcToken, ETH_ADDRESS, _srcAmmount);
            // msg.sender.transfer(weiRecieved);
            
        }else { //else exchange token to token
            //sell token
            srcTokenContract = TestToken(_srcToken);
            srcReserve = Reserve(listReserve[_srcToken]);

            srcTokenContract.approve(address(srcReserve), _srcAmmount);
            srcTokenContract.transferFrom(msg.sender, this, _srcAmmount);

            srcReserve.exchange(false, _srcAmmount);
            weiRecieved = getExchangeRate(_srcToken, ETH_ADDRESS, _srcAmmount);
            
            //buy token
            destTokenContract = TestToken(_destToken);
            destReserve = Reserve(listReserve[_destToken]);

            destReserve.exchange.value(weiRecieved)(true, weiRecieved);
            // tokenReceived = getExchangeRate(ETH_ADDRESS, _destToken, weiRecieved);
            // destTokenContract.transfer(msg.sender, tokenReceived);
            
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
