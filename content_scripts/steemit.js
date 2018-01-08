var settings = {
    selectors: "span.FormattedAsset",
    css: "height=16.29 width=16.29 style=\"margin: -2px 1px 0 0\"",
    convert_rate: 1,
    symbol: "$"
}
var imgurl = chrome.runtime.getURL("img/steem_icon.png");

function crawlPage() {
    var elements = $(settings.selectors);
    elements.each(function() {
        var payout = this.dataset.s2f;
        if (payout === undefined) {
            payout = parseFloat(this.textContent.replace(",", "").replace("$", ""));
            this.dataset.s2f = payout;
        }
        payout = Number(payout);
        var fiat = (payout * settings.convert_rate).toLocaleString(navigator.language, {
            maximumFractionDigits: 2, minimumFractionDigits: 2
        });
        var payout = payout.toLocaleString(navigator.language, {
            maximumFractionDigits: 2
        });
        var innerHTML = `
	  <span>
	    ${settings.symbol}${fiat}&nbsp;<img src="${imgurl}" ${settings.css}>${payout}
	  </span>
	  `;
        $(this).html(innerHTML);
    });
}

function init() {
    chrome.runtime.sendMessage({
        msg: "request_display_info"
    }, function(response) {
        settings.convert_rate = response.rate
        settings.symbol = response.symbol;
        crawlPage();
    });
}

init();
setInterval(crawlPage, 500);
chrome.extension.onMessage.addListener(init);