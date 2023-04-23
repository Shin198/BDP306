import * as networkService from "./services/networkService";
import EnvConfig from "./configs/env";
import swal from "sweetalert";

$(function () {
  const numberRegex = /^\s*[+-]?(\d+|\.\d+|\d+\.\d+|\d+\.)(e[+-]?\d+)?\s*$/;
  const isValidNumber = function (s) {
    return numberRegex.test(s);
  };

  let exChangeRate = 0;

  initiateProject();

  function initiateProject() {
    const defaultSrcSymbol = EnvConfig.TOKENS[0].symbol;
    const defaultDestSymbol = EnvConfig.TOKENS[1].symbol;

    initiateDropdown();
    initiateSelectedToken(defaultSrcSymbol, defaultDestSymbol);
    initiateDefaultRate(defaultSrcSymbol, defaultDestSymbol);
    initBalances();
    getAccount();
  }

  setInterval(() => {
    initBalances();
  }, 10000);

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", (accounts) => {
      window.location.reload();
      return;
    });
  }

  async function getAccount() {
    try {
      let accounts = await networkService.getAccountAddress();
      $("#account__address").text("Account : " + accounts[0]);
    } catch (err) {
      console.log(err);
    }
  }

  function initiateDropdown() {
    let dropdownTokens = "";

    EnvConfig.TOKENS.forEach((token) => {
      dropdownTokens += `<div class="dropdown__item">${token.symbol}</div>`;
    });

    $(".dropdown__content").html(dropdownTokens);
  }

  function initiateSelectedToken(srcSymbol, destSymbol) {
    $("#selected-src-symbol").html(srcSymbol);
    $("#selected-dest-symbol").html(destSymbol);
    $("#rate-src-symbol").html(srcSymbol);
    $("#rate-dest-symbol").html(destSymbol);
    $("#selected-transfer-token").html(srcSymbol);
  }

  async function initBalances() {
    try {
      let token0Balance = await networkService.getTokenBalances(
        EnvConfig.TOKENS[0].address
      );
      $("#balance__tka").html("token a : " + token0Balance);
    } catch (err) {
      $("#balance__tka").html("token a : " + 0);
      console.error(err);
    }
    networkService
      .getTokenBalances(EnvConfig.TOKENS[1].address)
      .then((result) => {
        const balance = result;
        $("#balance__tkb").html("token b : " + balance);
      })
      .catch((error) => {
        $("#balance__tkb").html("token b : " + 0);
      });
    networkService
      .getTokenBalances(EnvConfig.TOKENS[2].address)
      .then((result) => {
        const balance = result / 1e18;
        $("#balance__eth").html("tomo : " + balance);
      })
      .catch((error) => {
        $("#balance__eth").html("tomo : " + 0);
      });
  }

  async function initiateDefaultRate(srcSymbol, destSymbol) {
    const value = $("#swap-source-amount").val();
    if (srcSymbol == destSymbol) {
      $("#exchange-rate").html(1);
      exChangeRate = 1;
      if (isValidNumber(value)) {
        $(".input-placeholder").html(exChangeRate * value);
      }
      return;
    }

    const srctoken = findTokenBySymbol(srcSymbol);
    const desttoken = findTokenBySymbol(destSymbol);

    const defaultSrcAmount = (1e18).toString();

    try {
      let rate = await networkService.getExchangeRate(
        srctoken.address,
        desttoken.address,
        defaultSrcAmount
      );
      console.log(rate)
      rate /= 1e18;
      console.log(rate)

      $("#exchange-rate").html(rate);
      exChangeRate = rate;
      if (isValidNumber(value)) {
        $(".input-placeholder").html(exChangeRate * value);
      }
    } catch (err) {
      $("#exchange-rate").html(0);
      exChangeRate = 0;
      if (isValidNumber(value)) {
        $(".input-placeholder").html(exChangeRate * value);
      }
    }
  }

  async function swapToken(srcToken, destToken, value) {
    let gas = await networkService.estimateGasSwapToken(
      srcToken,
      destToken,
      Number(value)
    );
    //confirm
    swal({
      title: "Are you sure?",
      text: `
              Swap
              From: ${value} ${srcToken.symbol} 
              To: ${value * exChangeRate} ${destToken.symbol}
              Estimated gas: ${gas}
              `,
      icon: "warning",
      buttons: true,
    }).then(async (isOk) => {
      if (isOk) {
        swal.close();
        try {
          let swapRes = await networkService.swapToken(
            srcToken,
            destToken,
            value
          );
          if (swapRes.status) {
            swal("Transact successed!", {
              icon: "success",
              timer: 3000,
            });
            initBalances();
          } else {
            //failed
            swal("Transact failed!", {
              icon: "error",
              timer: 3000,
            });
          }
        } catch (err) {
          alertNetworkError();
        }
      }
    });
  }

  function findTokenBySymbol(symbol) {
    return EnvConfig.TOKENS.find((token) => token.symbol === symbol);
  }

  $(document).on("click", ".swap__icon", function () {
    const srctoken = $("#selected-src-symbol").text();
    const desttoken = $("#selected-dest-symbol").text();
    initiateSelectedToken(desttoken, srctoken);
    initiateDefaultRate(desttoken, srctoken);
  });

  // on changing token from dropdown.
  $(document).on("click", ".dropdown__item", function (event) {
    const selectedsymbol = $(this).html();
    const selectedtarget = $(this)
      .parent()
      .siblings(".dropdown__trigger")
      .find(".selected-target");
    if (selectedtarget.attr("id") == "selected-transfer-token") {
      $("#selected-transfer-token").text(selectedsymbol);
      return;
    }
    $(selectedtarget).text(selectedsymbol);
    /* todo: implement changing rate for source and dest token here. */
    const srctoken = $("#selected-src-symbol").text();
    const desttoken = $("#selected-dest-symbol").text();
    initiateSelectedToken(srctoken, desttoken);
    initiateDefaultRate(srctoken, desttoken);
  });

  async function approve(value) {
    const srcTokenSym = $("#selected-src-symbol").text();
    const srcToken = findTokenBySymbol(srcTokenSym);

    try {
      let approveRes = await networkService.approval(srcToken.address, value);

      if (approveRes.status) {
        swal("Transact successed!", {
          icon: "success",
          timer: 3000,
        });
        initBalances();
        return;
      }
      swal("Transact failed!", {
        icon: "error",
        timer: 3000,
      });
    } catch (err) {
      alertNetworkError();
    }
  }

  // import metamask
  $("#import-metamask").on("click", function () {
    /* todo: importing wallet by metamask goes here. */
    if (window.ethereum) {
      window.ethereum.enable();
    }
  });

  // handle on source amount changed
  $("#swap-source-amount").on("input change", function () {
    /* todo: fetching latest rate with new amount */
    const value = $(this).val();
    if ((!isValidNumber(value) && value != "") || value <= 0) {
      $(".input-error__swap").text("invalid number.");
      return;
    } else {
      $(".input-error__swap").text("");
      /* todo: updating dest amount */
      // const srcTokenSym = $('#selected-src-symbol').text();
      // const destTokenSym = $('#"selected-dest-symbol').text();
      const value = $("#swap-source-amount").val();
      $(".input-placeholder").html(exChangeRate * value);
      console.log(value, exChangeRate);
    }
  });

  $("#transfer-source-amount").on("input change", function () {
    /* TODO: Fetching latest rate with new amount */
    const value = $(this).val();
    if (!isValidNumber(value) && value != "") {
      $(".input-error__transfer-value").text("Invalid number.");
      return;
    } else {
      $(".input-error__transfer-value").text("");
      /* TODO: Updating dest amount */
    }
  });

  $("#transfer-address").on("input change", function () {
    const address = $(this).val();
    networkService.checkValidAddress(address).then((res) => {
      if (res) {
        $(".input-error__transfer-address").text("");
      } else {
        $(".input-error__transfer-address").text("Invalid address.");
      }
    });
  });

  // handle on click token in token dropdown list
  $(".dropdown__item").on("click", function () {
    $(this).parents(".dropdown").removeClass("dropdown--active");
  });
  // handle hidden balance
  $("#hidden-balance").on("click", function () {
    $(".main-balance").slideUp();
    $("#show-balance").removeAttr("hidden");
    $("#show-balance").slideDown();
  });
  $("#show-balance").on("click", function () {
    $(".main-balance").slideDown();
    $("#show-balance").slideUp();
  });
  // handle on swap now button clicked
  $("#swap-button").on("click", function () {
    // const modalid = $(this).data('modal-id');
    // $(`#${modalid}`).addClass('modal--active');

    const srcTokenSym = $("#selected-src-symbol").text();
    const destTokenSym = $("#selected-dest-symbol").text();
    const value = $("#swap-source-amount").val();

    if (!isValidNumber(value)) {
      swal({
        title: "Error",
        text: "Invalid number",
        icon: "error",
      });
      return;
    }

    const srcToken = findTokenBySymbol(srcTokenSym);
    const destToken = findTokenBySymbol(destTokenSym);
    //do transaction
    networkService
      .getTokenBalances(srcToken.address)
      .then((res) => {
        if (value * 1e18 > res) {
          swal("Error", "You do not have enough Token!", "error");
          return;
        }

        if (srcToken.address != EnvConfig.TOKENS[2].address) {
          networkService
            .checkApprove(srcToken.address, value)
            .then((isApproved) => {
              if (isApproved) {
                swapToken(srcToken, destToken, value);
              } else {
                //approve
                swal({
                  title: "Approval",
                  text: `Please approve your token!`,
                  icon: "info",
                  content: {
                    element: "input",
                    attributes: {
                      placeholder: "Type your ammount",
                      type: "number",
                    },
                  },
                  buttons: true,
                }).then((value) => {
                  if (value) {
                    approve(value);
                  }
                });

                return;
              }
            });
        } else {
          swapToken(srcToken, destToken, value);
        }
      })
      .catch((error) => {
        alertNetworkError();
      });
  });

  // tab processing
  $(".tab__item").on("click", function () {
    const contentid = $(this).data("content-id");
    $(".tab__item").removeClass("tab__item--active");
    $(this).addClass("tab__item--active");
    if (contentid === "swap") {
      $("#swap").addClass("active");
      $("#transfer").removeClass("active");
    } else {
      $("#transfer").addClass("active");
      $("#swap").removeClass("active");
    }
  });

  // dropdown processing
  $(".dropdown__trigger").on("click", function () {
    $(this).parent().toggleClass("dropdown--active");
  });

  // close modal
  $(".modal").on("click", function (e) {
    if (e.target !== this) return;
    $(this).removeClass("modal--active");
  });

  $("#btn-transfer").on("click", function () {
    const tokenSym = $("#selected-transfer-token").text();
    const inputValue = $("#transfer-source-amount").val();
    if (!isValidNumber(inputValue)) {
      swal({
        title: "Error",
        text: "Invalid number",
        icon: "error",
      });
      return;
    }

    const destAddress = $("#transfer-address").val();
    const token = findTokenBySymbol(tokenSym);
    const value = Number(inputValue);

    networkService
      .getTokenBalances(token.address)
      .then((res) => {
        if (value * 1e18 > res) {
          swal("Error", "You do not have enough Token!", "error");
          return;
        } else {
          networkService.checkValidAddress(destAddress).then((res) => {
            if (res) {
              networkService
                .estimgateGasTransfer(token.address, destAddress, value)
                .then((res) => {
                  //confirm
                  swal({
                    title: "Are you sure?",
                    text: `
                  Transfer
                  Value: ${value} ${tokenSym} 
                  To: ${destAddress}
                  Estimated gas: ${res}
                  `,
                    icon: "warning",
                    buttons: true,
                  }).then((isOk) => {
                    if (isOk) {
                      swal.close();
                      networkService
                        .transferToken(token.address, destAddress, value)
                        .then((res) => {
                          //success
                          if (res.status) {
                            swal("Transact successed!", {
                              icon: "success",
                              timer: 3000,
                            });
                          } else {
                            //failed
                            swal("Transact failed!", {
                              icon: "error",
                              timer: 3000,
                            });
                          }
                        })
                        .catch((err) => {
                          alertNetworkError();
                        });
                    }
                    return;
                  });
                })
                .catch((err) => {
                  alertNetworkError();
                });
            } else {
              swal("Error", "Invalid address!", "error");
              return;
            }
          });
          return;
        }
      })
      .catch((error) => {
        alertNetworkError();
      });
  });

  function alertNetworkError() {
    swal("Something went wrong on the network! Please try later!", {
      icon: "error",
      button: true,
      timer: 5000,
    });
  }

  function getBalanceByToken(token) { }
});
