var fiat_values = {
  "USD":"$",
  "AUD":"AU$",
  "BRL":"R$",
  "CAD":"C$",
  "CNY":"¥",
  "CZK":"Kč",
  "DKK":"kr",
  "EUR":"€",
  "GBP":"£",
  "IDR":"Rp",
  "ILS":"₪",
  "INR":"₹",
  "JPY":"¥",
  "KRW":"₩",
  "MXN":"$",
  "NZD":"$",
  "PHP":"₱",
  "PKR":"Rp",
  "PLN":"zł",
  "RUB":"₽",
  "SEK":"kr",
  "SGD":"S$",
  "THB":"฿",
  "TRY":"₺",
  "TWD":"NT$",
  "ZAR":"R"
}

var user_defaults = {
  chosen_fiat: "USD",
  datasource: "CoinMarketCap",
  payout_range: "50",
  curator: "true"
}

var application_defaults = {
  api_payout_range: "100"
}

function NotifyTabs(){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {msg: "recalculate"});
  });
}

function GetConversionRate() {
  return $.post("https://gtg.steem.house:8090/rpc", 
    JSON.stringify({
      id:17,
      method:"get_current_median_history_price",
      params:[], 
      jsonrpc:2.0})
    )
}

function InitFiatStores() {

}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log(request);
    if (request.msg == "request_fiats") {
      sendResponse({fiat_values: fiat_values});
    } else if (request.msg == "request_settings") {
      var settings = JSON.parse(localStorage.getItem("settings")) || defaults;
      settings.symbol = fiat_values[settings.chosen_fiat];
      Object.assign(settings, application_defaults);
      sendResponse(settings);
    } else if (request.msg == "save_settings") {
      localStorage.setItem("settings", JSON.stringify(request.settings));
      sendResponse(JSON.parse(localStorage.getItem("settings")) || defaults);
      NotifyTabs();
    }
    // Note: Returning true is required here!
    //  ref: http://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent
    return true; 
  });