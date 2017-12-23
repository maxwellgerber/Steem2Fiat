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
  payout_range: 50,
  curator: "true",
  custom_ratio: "false"
}

const application_defaults = {
  api_payout_range: 78
}

// Invalidate cache entries after 20 minutes
const cache_timeout = 1000 * 60 * 20;


function RPCSteemSbdRatio() {
  return new Promise((resolve, reject) => {
    $.post("https://steemd.steemit.com/rpc", 
      JSON.stringify({
        id:17,
        method:"get_current_median_history_price",
        params:[], 
        jsonrpc:2.0})
      )
    .then(data => {
      resolve(JSON.parse(data));
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


function IsExpired(timestamp) {
  return Date.now() - timestamp > cache_timeout;
}



class SettingsManager{

  get(key, _default) {
    return JSON.parse(localStorage.getItem(key)) || _default; 
  }

  set(key,val) {
    console.log(val);
    console.log(JSON.stringify(val));
    localStorage.setItem(key, JSON.stringify(val)); 
  }

  getSteemSbdRatio() {
    return new Promise((resolve, reject) => {      
      var stored = this.get("steem_sbd_ratio");
      if (stored === undefined || IsExpired(stored.timestamp)) {
        RPCSteemSbdRatio().then(data => {
          console.log(data);
          console.log(typeof data);
          console.log(data.result);
          var temp = data.result.base;
          console.log(temp);
          temp = temp.substring(0, temp.length-4);
          console.log(temp);
          temp = Number(temp);
          console.log(temp);
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
    var key;
    var ExchangeFunc;
    switch(this.get("user_settings", user_defaults).datasource) {
      case "Bittrex":
        key = "rex_data";
        ExchangeFunc = GetCoinMarketCapRates;
        break;
      case "Poloniex":
        key = "polo_data";
        ExchangeFunc = GetCoinMarketCapRates;
        break;
      case "HitBTC":
        key = "hit_data";
        ExchangeFunc = GetCoinMarketCapRates;
        break;
      case "CoinMarketCap":
      default:
        key = "cmc_data";
        ExchangeFunc = GetCoinMarketCapRates;
        break;
    };
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

// function NotifyTabs(){
//   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     chrome.tabs.sendMessage(tabs[0].id, {msg: "recalculate"});
//   });
// }

var Manager = new SettingsManager();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.msg == "request_fiats") {
    sendResponse({fiat_values: fiat_values});
  } else if (request.msg == "request_settings") {
    Manager.getSteemSbdRatio().then(ratio => {
      var settings = Manager.get("user_settings", user_defaults);
      settings.api_payout_range = 100 * ratio/(ratio+1);
      sendResponse(settings);
    })
  } else if (request.msg == "save_settings") {
    Manager.set("user_settings", request.settings);
    sendResponse("ok");
  } else if (request.msg == "request_display_info") {
    $.when(
      Manager.getSteemSbdRatio(),
      Manager.getBitcoinSteemRates(),
      Manager.getBitcoinFiatRates(),
      )
    .done((ratio, bitcoinSteemRates, bitcoinFiatRates) => {
      var user_settings = Manager.get("user_settings", user_defaults);
      var sbd_bias = user_settings.custom_ratio ? user_settings.payout_range : ratio/(ratio+1);
      var in_btc = bitcoinSteemRates.steem_btc * (1 - sbd_bias) + bitcoinSteemRates.sbd_btc * sbd_bias;
      var in_fiat = bitcoinFiatRates[user_settings.chosen_fiat] * in_btc;
      sendResponse({
        rate: in_fiat,
        symbol: fiat_values[user_settings.chosen_fiat]
      });
    });
  }
  // Note: Returning true is required here!
  //  ref: http://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent
  return true; 
});