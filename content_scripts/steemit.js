
var settings = {
	selectors: "span.FormattedAsset",
	css:"height=16.29 width=16.29 style=\"margin: -2px 1px 0 0\""
}

function crawlPage() {
	var imgurl = "https://steemit-production-imageproxy-upload.s3.amazonaws.com/DQmPBTSoFeabenhqLDu3oYa2sxZCpCGn6dQPvaqBuwZSdyA";
	$(settings.selectors).each(function() {
		var payout = this.dataset.s2f;
		if (payout === undefined) {
			payout = parseFloat(this.textContent.replace(",", "").replace("$", ""));
			this.dataset.s2f = payout;
		}
		payout = Number(payout);
	  var fiat = (payout*settings.convert_rate).toLocaleString(navigator.language, {maximumFractionDigits:2});
	  var payout = payout.toLocaleString(navigator.language, {maximumFractionDigits:2});
	  var innerHTML = `
	  <span>
	    ${settings.symbol}${fiat}&nbsp;<img src="${imgurl}" ${settings.css}>${payout}
	  </span>
	  `;
	  $(this).html(innerHTML);
	});
}

function crawlDelay(){
	setTimeout(crawlPage, 350);
};

function init() {
	chrome.runtime.sendMessage({msg: "request_display_info"}, function(response) {
		settings.convert_rate = response.rate
		settings.symbol = response.symbol;
		crawlPage();
		// Idempotent
		window.addEventListener("scroll", crawlDelay);
		$("a").click(crawlDelay);
	});
}
init();

chrome.extension.onMessage.addListener(init);