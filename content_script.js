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
	$.when(
		$.getJSON(`https://api.coinmarketcap.com/v1/ticker/STEEM/?convert=${response.chosen_fiat}`),
		$.getJSON(`https://api.coinmarketcap.com/v1/ticker/STEEM-dollars/?convert=${response.chosen_fiat}`),
		$.ready
	).done(function(steem, sbd){
		var steem_price = Number(steem[0][0][`price_${response.chosen_fiat.toLowerCase()}`]);
		var sbd_price = Number(sbd[0][0][`price_${response.chosen_fiat.toLowerCase()}`]);
		var foo = BuildFoo(steem_price/3 + sbd_price*2/3, response.symbol);
		foo();
		window.addEventListener("scroll", foo);
	}); 
});

