// ==UserScript==
// @name         自由を！ Enable disabled
// @namespace    http://tampermonkey.net/
// @version      0.1.5
// @description  下記のコード譜歌詞サイトの選択/コピー/右クリック/印刷の禁止を解除する
// @description  Enable disabled select/copy/right-click/print on some japanese sites.
// @author       yobukodori
// @match        http*://music.j-total.net/data/*
// @match        http*://gakufu.gakki.me/m/data/*
// @match        http*://www.ufret.jp/song.php?*
// @match        http*://ja.chordwiki.org/*
// @match        http*://j-lyric.net/artist/*.html
// @match        http*://www.kasi-time.com/item-*.html
// @match        http*://sp.uta-net.com/song/*
// @match        http*://sp.uta-net.com/movie/*
// @match        http*://www.uta-net.com/song/*
// @match        http*://www.uta-net.com/movie/*
// @match        http*://www.kget.jp/lyric/*
// @match        http*://m.www.kget.jp/lyric/*
// @match        https://mojim.com/*.htm
// @match        https://utaten.com/lyric/*
// @match        http*://www.oricon.co.jp/*
// @match        http*://kashinavi.com/*
// @match        http*://rocklyric.jp/*
// @match        https://www.joysound.com/*
// @match        http*://www.utamap.com/*
// @match        http*://sp.utamap.com/*
// @match        http*://www.google.com/*
// @grant        none
// ==/UserScript==

var opt_verbose; // = false;

var site_data = {
	"music.j-total.net": {
		"event": ["selectstart contextmenu"],
		"nonSelectable": []
	},
	"gakufu.gakki.me": {
		"event": ["selectstart copy keydown contextmenu"],
		"nonSelectable": []
	},
	"www.ufret.jp": {
		"pre": function(){
			try {
				if (flag){
					clearInterval(timerID);
					flag = false;
				}
			}catch(x){}
			var fnc = ["autoscroll", "n_noS_shtml", "i_noS_shtml", "bpr_shtml", "cEm_shtml"];
			for (var i = 0 ; i < fnc.length ; i++){
				window[fnc[i]] = function(){};
			}
		},
		"event": ["selectstart copy contextmenu dragstart mousedown beforeprint afterprint"], // v.0.1.4
		"PrintRules": function(){	// v.0.1.4
			console.log("search '@media print' in styleSheets");
			var ss = document.styleSheets;
			for(var  i = 0 ; i < ss.length ; i++){
				var s = ss[i], prefix = "document.styleSheets[" + i + "]", m = "";
				try {
					if (s.media && s.media.length > 0 && s.media.mediaText) {
						m = s.media.mediaText;
						console.log("## "+prefix+" @media " + m);
					}
					else {
						var rr = s.cssRules;
						for (var j = 0 ; j < rr.length ; j++){
							var r = rr[j];
							try {
								if (r.media && r.media.length > 0 && r.media.mediaText){
									if (r.media.mediaText == "print"){
										console.log("  ## "+prefix+".cssRules["+j+"]"+" @media " + r.media.mediaText);
										console.log("    cssText:" + r.cssText);
										m = "print";
									}
								}
							}catch(x){}
						}
					}
				}catch(x){}
				if (m == "print"){
					console.log("  ## disabled " + prefix);
					s.disabled = true;
				}
			}
			return [
					"p.atfolhyds{margin-top:-20px!important;padding-top:10px!important}"
					+ "span.krijcheug{line-height:20px!important}"
					]; // v.0.1.5
		}
	},
	"ja.chordwiki.org": { // v.0.1.5
		"event": ["copy"],
		"PrintRules": ["span.word,span.wordtop{visibility:visible !important}"
							+ "span.chord{top:-1.1em !important}"
							+ "div.main{margin:auto !important;line-height:1.8em !important}"
							]
	},
	"sp.uta-net.com": {
		"expose": ["#kashi_main br:first-of-type"],		// v.0.1.3
		//"expose": ["#kashi_main > br:first-of-type"],  // v.0.1.2
		//"hide": ["#kashi,#kashi_layer"],
		"PrintRules": []
	},
	"www.uta-net.com": {
		"expose": ["#flash_area br:first-of-type"]
		//"hide": ["#flash_area > img,#over_flash"]
	},
	"www.kget.jp": {
		"PrintRules": ["#content{display:block !important}"] // v.0.1.5
	},
	"m.kget.jp": {
		"hide": ["#space_layer"],		// v.0.1.3
		"PrintRules": ["#content{display:block !important}"] // v.0.1.5
	},
	"utaten.com": {
		"PrintRules": [".lyricBody{display:block !important}"] // v.0.1.5
	},
	"www.oricon.co.jp": {
		"nonSelectable": [".all-lyrics"],
		"PrintRules": []
	},
	"kashinavi.com": {
		"PrintRules": [".noprint{display:block !important}"]			// v.0.1.3 // v.0.1.5
	},
	"rocklyric.jp": {
		"event": ["selectstart mousedown mousemove keydown copy cut contextmenu"],
		"PrintRules": []
	},
	"www.utamap.com": {
		"PrintRules": [".noprint{display:block !important}"]			// v.0.1.3
	},
	"sp.utamap.com": {
		"PrintRules": []			// v.0.1.3
	},
	"www.google.com": { // v.0.1.4
		"PrintRules": function(){
			var a = [];
			console.log("traverse css for @media print rules");
			traverse_css(function(rule,indent,prefix){
				try {
					var pa = rule["parentRule"], v;
					if (pa && pa.type == 4 && pa.media.mediaText == "print" && (v = rule.style["display"])){
						console.log(indent+"## "+prefix+"\n  "+indent+"@media print{"+rule.selectorText+" {display:"+v+"}}");
						if (v == "none"){
							a.push(rule.selectorText+"{display:block !important}"); // v.0.1.5
						}
						else if (v == "block"){
							var se = 'div[data-attrid$="lyrics"] ' + rule.selectorText;
							var e = document.querySelector(se);
							if (e){
								console.log(indent + '  remove element "' + se + '"');
								e.parentNode.removeChild(e);
							}
						}
					}
				}catch(x){}
			});
			return a;
		}
	},
	"template": {
		"event": [],
		"nonSelectable": [],
		"expose": [],
		"hide": [],
		"PrintRules": []
	}
};

function e2str(e)
{
	if (e == null)		// v.0.1.4
		return "null";	// v.0.1.4
	var s = e.tagName+(e.id?("#"+e.id):"");
	if (e.className){
		var a = e.className.split(" ");
		for (var i = 0 ; i < a.length ; i++){
			if (a[i])
				s += "." + a[i];
		}
	}
	return s;
}

function prevent_listeners_preventing_usability(sd)
{
	var events = (sd && sd.event) ? sd.event : ["selectstart", "mousedown", "keydown","copy", "contextmenu","touchstart","touchend"];
	for (var i = 0 ; i < events.length ; i++){
		var a = events[i].split(" ");
		for (var j = 0 ; j < a.length ; j++){
			if (a[j]){
				document.addEventListener(a[j], function(event){event.stopImmediatePropagation();}, true);
				console.log("handling " + a[j] + " event");
			}
		}
	}
}

function enable_css_user_select(e, if_val_is_none)
{
	//-webkit-touch-callout:none -> default
	var prop = ["-moz-user-select", "-webkit-user-select", "-ms-user-select", "user-select"];
	for(var i = 0 ; i < prop.length ; i++){
		//cssでe{-moz-user-select:none}と設定してもe.style["-moz-user-select"]は初期値""のまま
		var pr = prop[i];
		if (e.style[pr] != null){
			if (! if_val_is_none || (e.style[prop[i]] && e.style[prop[i]] == "none")){
				var s = '("'+e2str(e)+'").style["'+pr+'"]: "' + e.style[pr] + '" -> "text"';
				console.log(s);
				e.style[pr] = "text";
			}
		}
	}
}

function get_rules(sht, prefix, indent)
{
	var ro = {rules:null, name:"cssRules"};
	try { // test broken sheet
		if (!(ro.rules = sht.cssRules)){
			if (!(ro.rules = sht.rules)){
				console.warn(indent + prefix + " no cssRules/rules");
				return;
			}
			ro.name = "rules";
			console.warn(indent + prefix + " using .rules");
		}
		return ro;
	}
	catch(e){
		console.warn(indent + prefix + " " + e);
	}
}

function traverse_rule_set(ruleSetList, prefix, depth, callback)
{
	var indent = "          ".substr(0, depth*2);
	for(var i = 0 ; i < ruleSetList.length ; i++){
		var o, r = ruleSetList[i], pfx = prefix + "[" + i + "]";
		//console.log(pfx + " type:" + r.type);
		if (r.type == 3){
			var sht = r.styleSheet;
			pfx = pfx + ".styleSheet";
			console.log(indent + pfx + ' @import "' + sht.href + '"');
			if (!(o = get_rules(sht, pfx, indent)))
				continue;
			traverse_rule_set(o.rules, pfx + "." + o.name, depth+1, callback);
			continue;
		}
		else if (r.type == 4){
			if (opt_verbose)console.log(indent + pfx + " @media " + r.media.mediaText);
			if (!(o = get_rules(r, pfx, indent)))
				continue;
			traverse_rule_set(o.rules, pfx + "." + o.name, depth+1, callback);
			continue;
		}
		else if (r.type != 1){
			if (opt_verbose)console.log(indent + pfx + " type:" + r.type + ": skip non-supported type " + r);
			continue;
		}
		//console.log(pfx + ": " + r.selectorText + " {...}");
		callback(r, indent, pfx); // v.0.1.4
	}
}

function traverse_css(callback) // v.0.1.4
{
	var ss = document.styleSheets, i, s, prefix, m, o;
	for(i = 0 ; i < ss.length ; i++){
		s = ss[i];
		prefix = "document.styleSheets[" + i + "]";
		m = "";
		try {
			if (s.href)
				m += " href=" + s.href;
			if (s.media && s.media.mediaText)
				m += " @media " + s.media.mediaText;
		}
		catch(x){
			m += " " + x;
		}
		if (opt_verbose || s.href) console.log("# " + prefix + m);
		if (!(o = get_rules(s, prefix, "")))
			continue;
		traverse_rule_set(o.rules, prefix + "."+o.name, 1, callback);
	}
}

function traverse_css_and_enable_user_select() // v.0.1.4
{
	var prop = ["-moz-user-select", "-webkit-user-select", "-ms-user-select", "user-select"];
	traverse_css(function(rule, indent, prefix){
		var r = rule, pfx = prefix, s;
		for(var i = 0 ; i < prop.length ; i++){
			var pr = prop[i], v = r.style[pr], s;
			if (v != null){
				if (v == "none"){
					s = indent + "## " + pfx + ":\n  " + indent + r.selectorText + " {" + pr +": none}";
					console.log(s);
					var es = document.querySelectorAll(r.selectorText);
					for (var j = 0 ; j < es.length ; j++){
						var e = es[j], ev = e.style[pr];
						s = indent+"  ## "+(j+1)+") ("+e2str(e)+').style["'+pr+'"]: "' + ev + '"';
						if (!(ev && ev == "text")){
							s += ' -> "text"';
							e.style[pr] = "text";
						}
						console.log(s);
					}
				}
			}
		}
	});
}

function is_ascendant(parent, e)
{
	while (e.parentElement){
		if (e.parentElement === parent)
			return true;
		e = e.parentElement;
	}
	return false;
}

function get_zindex(e)
{
	try {
		// getPropertyValue()は"auto"などの文字列を返す場合もある
		// getPropertyValue() may return "auto"
		var z = getComputedStyle(e).getPropertyValue("z-index");
		return ! isNaN(z) ? z : (e.parentElement ? get_zindex(e.parentElement) : 0);
	}
	catch (e){
		console.error("get_zindex " + e);
		return 0;
	}
}

function expose_element(e)
{
    var e1 = e, e2, es, r1, r2, z1, z2, s, i, d = document;

	r1 = e1.getBoundingClientRect();
	z1 = get_zindex(e1);
	console.log("target z-index: " + z1);
	console.log("search overlapped elements");
	es = d.body.getElementsByTagName("*");
	for (i = 0 ; i < es.length ; i++){
		e2 = es[i];
		if (e2.hidden)
			continue;
		r2 = e2.getBoundingClientRect();
		z2 = get_zindex(e2);
		s = i + ") " + e2str(e2) + " z-index:" + z2;
		if (!(r1.left < r2.left || r1.right > r2.right || r1.top < r2.top || r1.bottom > r2.bottom)){
			if (is_ascendant(e2, e1)){
				s += " (ascendant)";
				console.log(s);
				continue;
			}
			else if (e2 === e1){
				//console.log("skip same element " + e2str(e2));
				s += " (target parent:'" + e2str(e2.parentElement) + "')";
				console.log(s);
				continue;
			}
			s = " hide " + s;
			if (is_ascendant(e1,e2))
				s += " (descendant)";
			else if (e1.parentElement === e2.parentElement)
				s += " (sibling parent:'" + e2str(e2.parentElement) + "')";
			else
				s += " (parent:'" + e2str(e2.parentElement) + "')";
			if (! isNaN(z1) && ! isNaN(z2) && z2 > z1)
				s = "Got shield!" + s;
			else
				s = "Suspicious!" + s;
			console.log("## " + s);
			e2.style.display = "none";
		}
	}
}

(function() {
    'use strict';
    var e, i, sd, sa, j, d = document;

    console.log("we got " + d.location);
	sd = site_data[d.location.host.toLowerCase()];

	// v.0.1.5
	if (sd && sd["pre"]){ 
		sd["pre"]();
	}

	prevent_listeners_preventing_usability(sd);

	//d.body.style.cursor = "";

	if (sd && (sa = sd.nonSelectable) && sa.length){ // v.0.1.3
		for (i = 0 ; i  < sa.length ; i++){
			console.log("# query non-selectable '" + sa[i] + "'");
			e = d.querySelectorAll(sa[i]);
			for (j = 0 ; j < e.length ; j++){
				console.log("# clear non-selectable '" + e2str(e[j]) + "'");
				enable_css_user_select(e[j]);
			}
		}
	}
	else {
		enable_css_user_select(d.body);

		console.log("search *user-select:none in all elements");
		e = d.body.getElementsByTagName("*");
		for (i = 0 ; i < e.length ; i++)
			enable_css_user_select(e[i], true);

		console.log("search (-x-)user-select:none in css");
		traverse_css_and_enable_user_select();  // v.0.1.4
	}

	if (sd && (sa = sd.expose)){
		for (i = 0 ; i  < sa.length ; i++){
			console.log("query expose '" + sa[i] + "'");
			e = d.querySelectorAll(sa[i]);
			for (j = 0 ; j < e.length ; j++){
				console.log("expose '" + e2str(e[j]) + "'");
				expose_element(e[j]);
			}
		}
	}

	if (sd && (sa = sd.hide)){
		for (i = 0 ; i  < sa.length ; i++){
			console.log("query hide '" + sa[i] + "'");
			e = d.querySelectorAll(sa[i]);
			for (j = 0 ; j < e.length ; j++){
				console.log("## hide '" + e2str(e[j]) + "'");
				e[j].style.display = "none";
			}
		}
	}

	// display:initial not work on ie. use block
	sa = sd && sd.PrintRules ? sd.PrintRules : ["body{display:block !important}"];
	if (typeof sa == "function") 	// v.0.1.4
		sa = sa();							// v.0.1.4
	if (sa.length > 0){ // v.0.1.5
		var rules = "";
		for (i = 0 ; i  < sa.length ; i++){
			rules += sa[i];
		}
		e = d.createElement("style");
		e.type = "text/css";
		e.innerHTML = "@media print{" + rules + "}";
		console.log('append <style type="text/css">'+e.innerHTML+'</style> to the end of head');
		d.getElementsByTagName("head")[0].appendChild(e);
	}

	// v.0.1.4
	if (sd && sd["more"]){ 
		sd["more"]();
	}

	console.log("# end #");
})();