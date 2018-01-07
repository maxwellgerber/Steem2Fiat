const fiat_values = {
  "USD":"$",
  "AUD":"AU$",
  "BRL":"R$",
  "CAD":"C$",
  "CNY":"¥",
  // "CZK":"Kč",
  "DKK":"kr",
  "EUR":"€",
  "GBP":"£",
  "HKD":"$",
  // "IDR":"Rp",
  // "ILS":"₪",
  // "INR":"₹",
  "JPY":"¥",
  "KRW":"₩",
  // "MXN":"$",
  "NZD":"$",
  // "PHP":"₱",
  // "PKR":"Rp",
  "PLN":"zł",
  "RUB":"₽",
  "SEK":"kr",
  "SGD":"S$",
  "THB":"฿",
  // "TRY":"₺",
  "TWD":"NT$",
  // "ZAR":"R"
}

const user_defaults = {
  chosen_fiat: "USD",
  datasource: "CoinMarketCap",
  curator: "false"
}

const exchanges = {
  CoinMarketCap: GetCoinMarketCapRates,
  Bittrex: GetBittrexRates,
  Poloniex: GetPoloniexRates,
  HitBTC: GetHitBTCRates
}

const rpc_endpoints = [
  "https://steemd.steemit.com/rpc",
  "https://steemd.minnowsupportproject.org/rpc",
  "https://steemd.privex.io/rpc",
  "https://rpc.steemliberator.com/rpc",
  "https://gtg.steem.house:8090"
]

// Invalidate cache entries after 20 minutes
const cache_timeout = 1000 * 60 * 20;

// https://github.com/m0ppers/promise-any/blob/23d2b8ee2c07052a267180c114746ea4e955655b/index.js
function reverse(promise) {
    return new Promise((resolve, reject) => Promise.resolve(promise).then(reject, resolve));
}

function promiseAny(iterable) {
    return reverse(Promise.all([...iterable].map(reverse)));
}

function RPCSteemSbdRatio() {

  var helper = function(endpoint) {
    return $.post(endpoint,
      JSON.stringify({
        id:17,
        method:"get_current_median_history_price",
        params:[], 
        jsonrpc:2.0})
      )
  }

  var promises = rpc_endpoints.map(helper)

  return new Promise((resolve, reject) => {
    promiseAny(promises)
    .then(data => {
      resolve(JSON.parse(data));
    })
    .catch(e => {
      console.log("All RPC servers are down. STEEM probably isn't looking too hot.");
      resolve({
        result: {
          base:"6.431 SBD",
          quote:"1.000 STEEM"
        }
      });
    })
  });
}


function GetBTCFiatExchangeRates() {
  return new Promise((resolve, reject) => {
    $.get("https://blockchain.info/ticker")
      .then(data => {
        var cleaned = {};
        Object.keys(data).forEach(function(key,index) {
          cleaned[key] = data[key].last;
        });
        // $(data).each((k, v) => {
        //   cleaned[k] = v.last;
        // })
        resolve(cleaned);
      })
  });
}

function GetCoinMarketCapRates() {
  return new Promise((resolve, reject) => {
    $.when(
      $.getJSON("https://api.coinmarketcap.com/v1/ticker/STEEM/"),
      $.getJSON("https://api.coinmarketcap.com/v1/ticker/STEEM-dollars/")
    ).done((steemData, sbdData) => {
      resolve({ 
        steem_btc: Number(steemData[0][0]['price_btc']),
        sbd_btc: Number(sbdData[0][0]['price_btc'])
      });
    });
  });
}

function GetBittrexRates() {
  return new Promise((resolve, reject) => {
    $.when(
      $.getJSON("https://bittrex.com/api/v1.1/public/getticker?market=BTC-STEEM"),
      $.getJSON("https://bittrex.com/api/v1.1/public/getticker?market=BTC-SBD")
    ).done((steemData, sbdData) => {
      resolve({ 
        steem_btc: Number(steemData[0].result.Last),
        sbd_btc: Number(sbdData[0].result.Last)
      });
    });
  });
}


function GetPoloniexRates() {
  return new Promise((resolve, reject) => {
    $.getJSON("https://poloniex.com/public?command=returnTicker")
    .then((data) => {
      resolve({ 
        steem_btc: Number(data.BTC_STEEM.last),
        sbd_btc: Number(data.BTC_SBD.last)
      });
    });
  });
}

function GetHitBTCRates() {
  return new Promise((resolve, reject) => {
    $.when(
      $.getJSON("https://api.hitbtc.com/api/2/public/ticker/STEEMBTC"),
      $.getJSON("https://api.hitbtc.com/api/2/public/ticker/SBDBTC")
    ).done((steemData, sbdData) => {
      resolve({ 
        steem_btc: Number(steemData[0].last),
        sbd_btc: Number(sbdData[0].last)
      });
    });
  });
}

function IsExpired(timestamp) {
  return Date.now() - timestamp > cache_timeout;
}


class SettingsManager{

  get(key, _default) {
    return JSON.parse(localStorage.getItem(key)) || _default; 
  }

  set(key,val) {
    localStorage.setItem(key, JSON.stringify(val)); 
  }

  getSteemSbdRatio() {
    return new Promise((resolve, reject) => {      
      var stored = this.get("steem_sbd_ratio");
      if (stored === undefined || IsExpired(stored.timestamp)) {
        RPCSteemSbdRatio().then(data => {
          var temp = data.result.base;
          temp = temp.substring(0, temp.length-4);
          temp = Number(temp);
          var obj = {value: temp, timestamp: Date.now()};
          this.set("steem_sbd_ratio", obj);
          resolve(obj.value); 
        })
      } else {
        resolve(stored.value);
      }
    })
  }

  getBitcoinFiatRates() {
    return new Promise((resolve, reject) => {      
      var stored = this.get("btc_conversion_rates");
      if (stored === undefined || IsExpired(stored.timestamp)) {
        GetBTCFiatExchangeRates().then(data => {
          var obj = {value: data, timestamp: Date.now()};
          this.set("btc_conversion_rates", obj);
          resolve(obj.value); 
        })
      } else {
        resolve(stored.value);
      }
    })
  }

  getBitcoinSteemRates() {
    var datasource = this.get("user_settings", user_defaults).datasource;
    var key = datasource + "_data";
    var ExchangeFunc = exchanges[datasource];
    return new Promise((resolve, reject) => {      
      var stored = this.get(key);
      if (stored === undefined || IsExpired(stored.timestamp)) {
        ExchangeFunc().then(data => {
          var obj = {value: data, timestamp: Date.now()};
          this.set(key, obj);
          resolve(obj.value); 
        })
      } else {
        resolve(stored.value);
      }
    })
  }
}

function CalculateDisplayInfo() {
  return new Promise((resolve, reject) => {
    $.when(
      Manager.getSteemSbdRatio(),
      Manager.getBitcoinSteemRates(),
      Manager.getBitcoinFiatRates(),
      )
    .done((ratio, bitcoinSteemRates, bitcoinFiatRates) => {
      var user_settings = Manager.get("user_settings", user_defaults);
      var sbd_bias = ratio;
      var in_btc = bitcoinSteemRates.steem_btc * .5 / ratio + bitcoinSteemRates.sbd_btc * .5;
      var in_fiat = bitcoinFiatRates[user_settings.chosen_fiat] * in_btc;
      var after_curation = user_settings.curator ? in_fiat * .75 : in_fiat;
      resolve({
        rate: after_curation,
        symbol: fiat_values[user_settings.chosen_fiat],
        sbd_bias: sbd_bias,
        steem_btc: bitcoinSteemRates.steem_btc,
        sbd_btc: bitcoinSteemRates.sbd_btc,
        curator: user_settings.curator,
        btc_fiat: bitcoinFiatRates[user_settings.chosen_fiat],
        source: user_settings.datasource
      });
    });
  });
}

function NotifyTabs(){
  chrome.tabs.query({}, function(tabs) {
    var message = {msg: "recalculate"};
    for (var i=0; i<tabs.length; ++i) {
        chrome.tabs.sendMessage(tabs[i].id, message);
    }
  });
}

var Manager = new SettingsManager();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg == "request_fiats") {
    sendResponse({fiat_values: fiat_values});
  } 
  if (request.msg == "request_exchanges") {
    sendResponse({exchanges: Object.keys(exchanges)});
  } 
  else if (request.msg == "request_settings") {
    Manager.getSteemSbdRatio().then(ratio => {
      var settings = Manager.get("user_settings", user_defaults);
      settings.api_payout_range = 100 * ratio/(ratio+1);
      sendResponse(settings);
    })
  } 
  else if (request.msg == "save_settings") {
    Manager.set("user_settings", request.settings);
    sendResponse("ok");
    NotifyTabs();
  } 
  else if (request.msg == "request_display_info") {
    CalculateDisplayInfo()
      .then(sendResponse);
  }
  // Note: Returning true is required here!
  //  ref: http://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent
  return true; 
})
