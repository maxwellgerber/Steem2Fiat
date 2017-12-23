function BuildFoo(convert_rate, symbol) {
	return function() {
			// var imgurl = chrome.extension.getURL("steem_icon.png");
			var imgurl = "https://steemit-production-imageproxy-upload.s3.amazonaws.com/DQmPBTSoFeabenhqLDu3oYa2sxZCpCGn6dQPvaqBuwZSdyA";
			$("span.FormattedAsset").each(function() {
			  var orig_sbd = parseFloat(this.textContent.replace(",", "").replace("$", ""));
			  var usd = (orig_sbd*convert_rate).toFixed(2);
			  var sbd = orig_sbd.toFixed(2);
			  var innerHTML = `
			  <span>
			    ${symbol}${usd}&nbsp;<img src="${imgurl}" height=16.29 width=16.29 style="margin: -2px 1px 0 0">${sbd}
			  </span>
			  `;
			  $(this).removeClass("FormattedAsset");
			  $(this).html(innerHTML);
		});
	}
}

chrome.runtime.sendMessage({msg: "request_display_info"}, function(response) {
	console.log(response)
	var foo = BuildFoo(response.rate, response.symbol);
	foo();
	window.addEventListener("scroll", foo);
});