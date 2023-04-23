pragma solidity 0.4.17;

import "./Reserve.sol";
import {TestToken} from "./TestToken.sol";

contract Exchange {
    address public owner;
    address public constant ETH_ADDRESS =
        0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee;
    address public constant DEFAULT_ADDRESS =
        0x0000000000000000000000000000000000000000;
    mapping(address => uint256) spendingReturn;
    mapping(address => address) listReserve;

    function Exchange() public {
        owner = msg.sender;
    }

    function addReserve(
        address _reserve,
        address _token,
        bool _isAdd
    ) public returns (bool) {
        if (_isAdd) {
            listReserve[_token] = _reserve;
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
    ) public returns (uint256) {
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
            uint256 ethRecieved = reSrc.getExchangeRate(false, _srcAmmount);
            Reserve reDest = Reserve(listReserve[_destToken]);
            return reDest.getExchangeRate(true, ethRecieved);
        }
    }

    function exchangeToken(
        address _srcToken,
        address _destToken,
        uint256 _srcAmmount
    ) public payable returns (uint256) {
        TestToken srcTokenContract;
        TestToken destTokenContract;
        Reserve srcReserve;
        Reserve destReserve;
        uint256 ethRecieved;
        uint256 tokenReceived;

        //if _srcToken = ETH => buy token

        if (_srcToken == ETH_ADDRESS) {
            require(_srcAmmount == msg.value);
            // destTokenContract = TestToken(_destToken);
            destReserve = Reserve(listReserve[_destToken]);
            destReserve.exchange.value(msg.value)(true, _srcAmmount);
            tokenReceived = getExchangeRate(
                ETH_ADDRESS,
                _destToken,
                _srcAmmount
            );
            // destTokenContract.transfer(msg.sender, tokenReceived);
        } else if (_destToken == ETH_ADDRESS) {
            //else if _destToken = ETH => sell token

            srcTokenContract = TestToken(_srcToken);
            srcReserve = Reserve(listReserve[_srcToken]);

            srcTokenContract.transferFrom(msg.sender, this, _srcAmmount);
            srcTokenContract.approve(address(srcReserve), _srcAmmount);
            srcReserve.exchange(false, _srcAmmount);
            ethRecieved = getExchangeRate(_srcToken, ETH_ADDRESS, _srcAmmount);
            (msg.sender).transfer(ethRecieved);
        } else {
            //else exchange token to token
            //sell token
            srcTokenContract = TestToken(_srcToken);
            srcReserve = Reserve(listReserve[_srcToken]);
            uint256 approvedAllowence = srcTokenContract.allowance(
                msg.sender,
                this
            );
            require(approvedAllowence == _srcAmmount);
            // srcTokenContract.transferFrom(msg.sender, this, _srcAmmount); //  transfer directly to reserve contract
            // srcTokenContract.approve(address(srcReserve), _srcAmmount);
            // srcReserve.exchange(false, _srcAmmount);
            ethRecieved = getExchangeRate(_srcToken, ETH_ADDRESS, _srcAmmount);

            //buy token
            // destTokenContract = TestToken(_destToken);
            // destReserve = Reserve(listReserve[_destToken]);
            // destReserve.exchange.value(ethRecieved)(true, ethRecieved);
            // tokenReceived = getExchangeRate(
            //     ETH_ADDRESS,
            //     _destToken,
            //     ethRecieved
            // );
            // destTokenContract.transfer(msg.sender, tokenReceived);
        }
    }
}
