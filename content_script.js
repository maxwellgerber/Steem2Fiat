
var settings = {}

function crawlPage() {
	// var imgurl = chrome.extension.getURL("steem_icon.png");
	var imgurl = "https://steemit-production-imageproxy-upload.s3.amazonaws.com/DQmPBTSoFeabenhqLDu3oYa2sxZCpCGn6dQPvaqBuwZSdyA";
	$("span.FormattedAsset").each(function() {
		var payout = this.dataset.s2f;
		if (payout === undefined) {
			payout = parseFloat(this.textContent.replace(",", "").replace("$", ""));
			this.dataset.s2f = payout;
		}
		payout = Number(payout);
	  var fiat = (payout*settings.convert_rate).toFixed(2);
	  var payout = payout.toFixed(2);
	  var innerHTML = `
	  <span>
	    ${settings.symbol}${fiat}&nbsp;<img src="${imgurl}" height=16.29 width=16.29 style="margin: -2px 1px 0 0">${payout}
	  </span>
	  `;
	  // $(this).removeClass("FormattedAsset");
	  $(this).html(innerHTML);
	});
}

function init() {
	chrome.runtime.sendMessage({msg: "request_display_info"}, function(response) {
		console.log(response)
		settings.convert_rate = response.rate
		settings.symbol = response.symbol;
		crawlPage();
		// Idempotent
		window.addEventListener("scroll", crawlPage);
	});
}
init();

chrome.extension.onMessage.addListener(init);