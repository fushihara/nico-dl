//コンテキストメニューやローカルストレージ等、実行元ホスト、URLが重要な関数はここ

//バックグラウンドページで実行される
function updateContextMenu(enable){
	chrome.contextMenus.removeAll(function(){});
	if(enable){
		chrome.contextMenus.create({"title":"リンク先のニコニコ動画を保存","contexts":["link"],"targetUrlPatterns":["http://www.nicovideo.jp/watch/*"],"onclick":function(details){
			goMovie(details.linkUrl);
		}});
		chrome.contextMenus.create({"title":"今のページのニコニコ動画を保存","contexts":["page"],"documentUrlPatterns":["http://www.nicovideo.jp/watch/*"],"onclick":function(details){
			goMovie(details.pageUrl);
		}});
	}
}
//DLボタンが有効かどうかreturnする
function enableDlButton(){
	console.log("dlボタンの有効チェックが来ました");
	if(localStorage.getItem("dlButton")=="true"){
		return true;
	}else{
		return false;
	}
}
//変数初期化
debug=true;
urlsObj={};
if(localStorage.getItem("contextMenu")=="true"){
	updateContextMenu(true);
}
chrome.extension.onRequest.addListener(function(message,sender,sendResponse){window[message.action].apply(sender,message.args);});
chrome.webRequest.onHeadersReceived.addListener(
	function(details){
		console.log("webリクエストイベント発火時=%o",details);
		var hasHeader=false;
		var ext,m;
		if(details.url in urlsObj){
			movieTitle=urlsObj[details.url];
			delete urlsObj[details.url];
		}else{
			return;
		}
		for(var i=0;i<details.responseHeaders.length;i++){
			if(details.responseHeaders[i].name=="Content-Disposition"){
				ext="mp4";
				if(m=details.responseHeaders[i].value.match(/.+\.([a-z0-9]+)"$/)){//"
					ext=m[1];
				}
				details.responseHeaders[i].value="attachment; filename=\""+movieTitle+"."+ext+"\"";
				hasHeader=true;
				break;
			}
		}
		if(!hasHeader){
			details.responseHeaders.push({name:"Content-Disposition",value:"attachment; filename=\""+movieTitle+".mp4\""});
		}
		movieUrl="";
		console.log("書き換え後レスポンスヘッダ=%o",details.responseHeaders);
		return {responseHeaders:details.responseHeaders};
	},{
		urls: ["http://*.nicovideo.jp/smile*"],
		types:["main_frame","other"]
	},["responseHeaders","blocking"]
);
chrome.webRequest.onBeforeRequest.addListener(
	function(details){
		if(localStorage.getItem("signalDisable")=="true"){
			return {cancel:true};
		}else{
			return {cancel:false};
		}
	},{
		urls: ["http://res.nimg.jp/swf/system/marquee/default/*","http://flapi.nicovideo.jp/api/getmarquee_new*"],
		types:["object"]
	},["blocking"]
);
function goMovie(vid){
	var ifNm=false;
	var fileNamePatObj={};
	var tags=[];
	var movieTitle="";
	//vidにurlを全部送ってくるバカがいます
	if(vid.match(/watch\/([a-z0-9]+)/)){
		vid=RegExp.$1;
	}
	if(vid.match(/^nm/)){ifNm=true;}
	fileNamePatObj["vid"]=vid;
	fileNamePatObj["v"]=vid;
	//先ずはタイトルを取る
	html2Title(loadTextFile("http://www.nicovideo.jp/watch/"+vid),fileNamePatObj,tags);
	if(fileNamePatObj["title"]==null){
		alert("http://www.nicovideo.jp/watch/"+vid+"\nのタイトルの取得に失敗しました。");
		return false;
	}
	//動画urlを取る
	postP={};
	if(fileNamePatObj["thread"]!=""){
		postP["v"]=fileNamePatObj["thread"];
	}else{
		postP["v"]=fileNamePatObj["v"];
	}
	if(ifNm){
		postP["as3"]="1";
	}
	movieUrl=html2url(loadTextFile("http://flapi.nicovideo.jp/api/getflv",postP),fileNamePatObj);
	if(movieUrl==""){
		alert("http://www.nicovideo.jp/watch/"+vid+"\nの動画URLの取得に失敗しました。");
		return false;
	}else if(movieUrl.match(/^rtmpe\:/)){
		alert("http://www.nicovideo.jp/watch/"+vid+"\nこの動画はストリーミング方式なのでDL出来ません\n\n"+movieUrl);
		return false;
	}
	//ファイル名作成
	//先にタグあれこれ
	console.log("fileNamePatObj=%o",fileNamePatObj);
	console.log("tags=%o",tags);
	movieTitle=localStorage.getItem("saveFilePat");
	movieTitle=movieTitle.replace(/\$tags(.*?)\|/g,function(a,b){
		return tags.join(b);
	});
	movieTitle=movieTitle.replace(/\$([a-zA-Z0-9]+)/g,function(a,b){
		if(fileNamePatObj[b]==null){return "";}
		return fileNamePatObj[b];
	});
	movieTitle=fileNameSafe(movieTitle);
	urlsObj[movieUrl]=movieTitle;
	if(localStorage.getItem("bgDownload")=="true"){
		//ダウンロードバー非表示
		aEle=document.createElementNS("http://www.w3.org/1999/xhtml", "a");
		aEle.href=movieUrl;
		aEle.download="movieUrl";
		aEve=document.createEvent("MouseEvents");
		aEve.initMouseEvent("click",true,false,self,0,0,0,0,0,false,false,false,false,0,null);
		aEle.dispatchEvent(aEve);
	}else{
		//ダウンロードバー表示
		chrome.tabs.create({"url":movieUrl,selected:false},function(detail){
			console.log("DL用タブ=%o",detail);
		});
	}
}
function loadTextFile(url){
	var method="GET",sendStr=null,httpObj=null;
	if(arguments.length>=2 && arguments[1]!=null){
		method="POST";
		sendStr=[];
		for(var i in arguments[1]){
			sendStr.push(i+"="+encodeURIComponent(arguments[1][i]));
		}
		sendStr=sendStr.join("&");
	}
	httpObj= new XMLHttpRequest();
	httpObj.open(method,url,false);
	if(method=="POST"){
		httpObj.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
	}
	httpObj.send(sendStr);
	return httpObj.responseText.replace(/(\r|\n|\t)+/g,"").replace(/( |　)+/g," ");
}
function removeHtmlTag(str){
	try{
		return (str+"").replace(/<.*?>/g,"");
	}catch(e){
		console.log(str);
		return "";
	}
}
function html2url(html,fileNamePatObj){
	var ret="";
	try{ret=decodeURIComponent(/url=([^&]+)/.exec(html)[1]);}catch(e){}
	try{fileNamePatObj["thread"]=decodeURIComponent(/thread_id=([^&]+)/.exec(html)[1]);}catch(e){}
	return ret;
}
function html2Title(html,fileNamePatObj,tags){
	var dateObj,match,zero={};
	// title postYear postMonth postMonth2 postDate postDate2 postDay postDayEng postDayEng2
	// postHour postHour2 postMin postMin2 postSec postSec2 postUser postUserId category description tags v thread
	// try{fileNamePatObj["postMin"]    =removeHtmlTag(/<p id="video_date">.+?(\d+)年(\d+)月(\d+)日 (\d+):(\d+)/.exec(html)[5]*1+"");}catch(e){}
	//初期化
	fileNamePatObj["title"]="";
	fileNamePatObj["postYear"]="1970";
	fileNamePatObj["postMonth"] ="1";
	fileNamePatObj["postMonth2"]="01";
	fileNamePatObj["postDate"]  ="1";
	fileNamePatObj["postDate2"] ="01";
	fileNamePatObj["postDay"]    ="木";
	fileNamePatObj["postDayEng"] ="Thr";
	fileNamePatObj["postDayEng2"]="Thursday";
	fileNamePatObj["postHour"]   ="0";
	fileNamePatObj["postHour2"]  ="00";
	fileNamePatObj["postMin"]    ="0";
	fileNamePatObj["postMin2"]   ="00";
	fileNamePatObj["postSec2"]   ="00";
	fileNamePatObj["postSec"]    ="0";
	fileNamePatObj["postUser"]   ="";
	fileNamePatObj["postUserId"] ="0";
	fileNamePatObj["category"]   ="";
	fileNamePatObj["description"]="";
//	tags=[]; //←有効にすると、tagsがローカルスコープになる
	fileNamePatObj["v"]="";
	fileNamePatObj["thread"]="";
	//各バージョン処理
	if(match=html.match(/<div id="watchAPIDataContainer" style="display:none">(.+?)<\/div>/)){
		document. querySelector("#inner").innerHTML=match[1];
		zero=JSON.parse(document. querySelector("#inner").innerText);
		console.log("zero=%o",zero);
		//       
		//         tags v
		fileNamePatObj["title"]=zero.videoDetail.title;
		match=zero.videoDetail.postedAt.match(/(\d+)\/(\d+)\/(\d+) (\d+):(\d+):(\d+)/);
		fileNamePatObj["postYear"]=match[1];
		fileNamePatObj["postMonth2"]=match[2];
		fileNamePatObj["postDate2"]=match[3];
		fileNamePatObj["postHour2"]=match[4];
		fileNamePatObj["postMin2"]=match[5];
		fileNamePatObj["postSec2"]=match[6];

		fileNamePatObj["postMonth"]=match[2]*1;
		fileNamePatObj["postDate"]=match[3]*1;
		fileNamePatObj["postHour"]=match[4]*1;
		fileNamePatObj["postMin"]=match[5]*1;
		fileNamePatObj["postSec"]=match[6]*1;

		dateObj=new Date();
		dateObj.setFullYear(fileNamePatObj["postYear"]);
		dateObj.setMonth(fileNamePatObj["postMonth"]-1);
		dateObj.setDate(fileNamePatObj["postDate"]);
		fileNamePatObj["postDay"]    =["日","月","火","水","木","金","土"][dateObj.getDay()];
		fileNamePatObj["postDayEng"] =["Sun","Mon","Thu","Wed","Thu","Fri","Sat"][dateObj.getDay()];
		fileNamePatObj["postDayEng2"]=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dateObj.getDay()];
		if(zero.uploaderInfo){
			fileNamePatObj["postUser"]  =zero.uploaderInfo.nickname;
			fileNamePatObj["postUserId"]=zero.uploaderInfo.id;
		}else if(zero.videoDetail.community_name){
			fileNamePatObj["postUser"]  =zero.videoDetail.community_name;
			fileNamePatObj["postUserId"]="ch"+zero.videoDetail.channelId;
		}
		fileNamePatObj["category"]=zero.videoDetail.category;
		fileNamePatObj["description"]=zero.videoDetail.description;
		if(zero.videoDetail.tagList){
			for(var i=0;i<zero.videoDetail.tagList.length;i++){
				tags.push(zero.videoDetail.tagList[i].tag);
			}
		}
		fileNamePatObj["v"]=zero.videoDetail.id;
		fileNamePatObj["thread"]=zero.videoDetail.thread_id;
	}else{
		try{fileNamePatObj["title"]=removeHtmlTag(/<p id="video_title"><!-- google_ad_section_start -->(.+?)<!-- google_ad_section_end -->/.exec(html)[1]);}catch(e){}
		try{fileNamePatObj["postYear"]=removeHtmlTag(/<p id="video_date">.+?(\d+)年(\d+)月(\d+)日 (\d+):(\d+)/.exec(html)[1]);}catch(e){}
		try{fileNamePatObj["postMonth"] =removeHtmlTag(/<p id="video_date">.+?(\d+)年(\d+)月(\d+)日 (\d+):(\d+)/.exec(html)[2]*1+"");}catch(e){}
		try{fileNamePatObj["postMonth2"]=removeHtmlTag(/<p id="video_date">.+?(\d+)年(\d+)月(\d+)日 (\d+):(\d+)/.exec(html)[2]);}catch(e){}
		try{fileNamePatObj["postDate"]  =removeHtmlTag(/<p id="video_date">.+?(\d+)年(\d+)月(\d+)日 (\d+):(\d+)/.exec(html)[3]*1+"");}catch(e){}
		try{fileNamePatObj["postDate2"] =removeHtmlTag(/<p id="video_date">.+?(\d+)年(\d+)月(\d+)日 (\d+):(\d+)/.exec(html)[3]);}catch(e){}
		//曜日
		try{
			html.match(/<p id="video_date">.+?(\d+)年(\d+)月(\d+)日 (\d+):(\d+)/);
			dateObj=new Date();
			dateObj.setFullYear(RegExp.$1);
			dateObj.setMonth(RegExp.$2-1);
			dateObj.setDate(RegExp.$3);
			fileNamePatObj["postDay"]    =["日","月","火","水","木","金","土"][dateObj.getDay()];
			fileNamePatObj["postDayEng"] =["Sun","Mon","Thu","Wed","Thu","Fri","Sat"][dateObj.getDay()];
			fileNamePatObj["postDayEng2"]=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dateObj.getDay()];
		}catch(e){}
		try{fileNamePatObj["postHour"]   =removeHtmlTag(/<p id="video_date">.+?(\d+)年(\d+)月(\d+)日 (\d+):(\d+)/.exec(html)[4]*1+"");}catch(e){}
		try{fileNamePatObj["postHour2"]  =removeHtmlTag(/<p id="video_date">.+?(\d+)年(\d+)月(\d+)日 (\d+):(\d+)/.exec(html)[4]);}catch(e){}
		try{fileNamePatObj["postMin"]    =removeHtmlTag(/<p id="video_date">.+?(\d+)年(\d+)月(\d+)日 (\d+):(\d+)/.exec(html)[5]*1+"");}catch(e){}
		try{fileNamePatObj["postMin2"]   =removeHtmlTag(/<p id="video_date">.+?(\d+)年(\d+)月(\d+)日 (\d+):(\d+)/.exec(html)[5]);}catch(e){}
		//投稿者名 又はチャンネル名
		try{fileNamePatObj["postUser"]   =removeHtmlTag(/<p class="font12"><a href="user\/(\d+)"><strong>(.+?)<\/strong>/.exec(html)[2]);}catch(e){}
		try{fileNamePatObj["postUser"]   =removeHtmlTag(/<p class="font12"><a href="http:\/\/ch\.nicovideo\.jp\/channel\/(.+?)"><strong>(.+?)<\/strong>/.exec(html)[2]);}catch(e){}
		//投稿者ID 又はチャンネルID
		try{fileNamePatObj["postUserId"] =removeHtmlTag(/<p class="font12"><a href="user\/(\d+)"><strong>(.+?)<\/strong>/.exec(html)[1]);}catch(e){}
		try{fileNamePatObj["postUserId"]   =removeHtmlTag(/<p class="font12"><a href="http:\/\/ch\.nicovideo\.jp\/channel\/(.+?)"><strong>(.+?)<\/strong>/.exec(html)[1]);}catch(e){}
		try{fileNamePatObj["category"]   =removeHtmlTag(/<span style="color:#C9CFCF;">…<\/span> <strong style="color:#393F3F;">(.+?)</.exec(html)[1]);}catch(e){}
		try{fileNamePatObj["description"]=removeHtmlTag(/<div id="itab_description" class="info in"><p class="font12" style="padding:4px;"><!-- google_ad_section_start -->(.+?)<!-- google_ad_section_end -->/.exec(html)[1]);}catch(e){}
		//タグ
		try{
			var h,h2;
			h=html.match(/<nobr>(<img.+?>)?<a href="tag\/.+?" rel="tag" class="nicopedia">(.+?)<\/a>/g);
			for(var i=0;i<h.length;i++){
				h[i].match(/<a href="tag\/.+?" rel="tag" class="nicopedia">(.+?)<\/a>/);
				tags.push(RegExp.$1);
			}
		}catch(e){}
		//v
		try{fileNamePatObj["v"]=removeHtmlTag(/v:.*?'([a-z0-9]+)'/.exec(html)[1]);}catch(e){}
	}
	for(i in fileNamePatObj){
		fileNamePatObj[i]=removeHtmlTag(fileNamePatObj[i]);
	}
}
function fileNameSafe(str){
	str=str.replace(/\\/g,"￥");
	str=str.replace(/\//g,"／");
	str=str.replace(/:/g,"：");
	str=str.replace(/\*/g,"＊");
	str=str.replace(/\?/g,"？");
	str=str.replace(/\"/g,"”");//"
	str=str.replace(/</g,"＜");
	str=str.replace(/>/g,"＞");
	str=str.replace(/\|/g,"｜");
	return str;
}
