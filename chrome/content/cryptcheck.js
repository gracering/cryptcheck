/*
* TODO
* 1. messge detection -> scan for incoming message/hang onto alert
* 2. messge parsing -> parse new message to see if it's encrypted
* 		a) in message header: info about pgp encryption
	ex: encrypted message
		Content-Type: multipart/encrypted;
		 protocol="application/pgp-encrypted";
		 boundary="FzpOhr4ITduE8BF3KCYcp2XgW0TJZJfGw"

		This is an OpenPGP/MIME encrypted message (RFC 4880 and 3156)
		--FzpOhr4ITduE8BF3KCYcp2XgW0TJZJfGw
		Content-Type: application/pgp-encrypted
		Content-Description: PGP/MIME version identification

		ex: unencrypted message
			Content-Type: multipart/alternative;
		 boundary="------------AC8AB5A1F2824CB90CC05A3D"
		Content-Language: en-USmsgHdr = aMsgHdrs.queryElementAt(i, Components.interfaces.nsIMsgDBHdr);	

		This is a multi-part message in MIME format.
		--------------AC8AB5A1F2824CB90CC05A3D
		Content-Type: text/plain; charset=utf-8
		Content-Transfer-Encoding: 7bit
* 		
* 3. check encryption against protocol to determine if auto-reply should be sent
*		a) sender is point3 address
*			i) email is not forwarded -> proceed to 5
*			ii) email is forwarded -> end process for this email
			ex: X-Forwarded-Message-Id: <129711b9-bebc-f135-8c94-2701cec696f7@gmail.com>
			    not-forwarded messages wont have this field
			iii) mean email has not already been sent
			iv) what about messages with multiple recipients?
*		b) recipient has public key of sender (how do we access this data)?
*		c) else end process
* 5. record result -> where should this be stored?
*		a) create file in thunderbird source files? hook up to database? later
* 4. compose new message with appropriate information/"you messsed up" message
* 5. send message to sender -> it looks like we'll need the tbirdstdlib funcs for this
* 6. alert end user that a message was sent (attach alert/generate new message?)
*
* Once basic codework is complete, go through and add security features before debugging:
* 1. sanitize input from metadata, sanitize input from email address
* 2. minimize connection between content of email and function of cryptcheck
* 3. ensure that tampered metadata doesn't result in email being sent to the wrong address
* 4. in use case where no action is taken, make sure input cannot be manipulated/function doesnt
* do anything unintended 
* 
* Also:
* - add whitelist functionality
* - customizable/useful beyond pt3: ex, emails from [var] address must be encrypted 
* - add formal documentation
* - case where email sent to self renders infinite loop
* - should these emails be encrypted?
* - messages that come in when thunderbird isn't up/on
* - checking for a message thread?
*/

console.log('CryptCheck: running');

//TODO: it might be a good idea to pop these in their own file (see: mail alert vars)
//defining inocoming mail object
if (typeof(IncomingMail) == "undefined"){
	var IncomingMail = {}
}

IncomingMail.messageQueue = {};
IncomingMail.messageQueue.entries = new Array();
IncomingMail.messageQueue.timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
//TODO: add to prefs
IncomingMail.messageQueue.interval = 10000; // in ms
IncomingMail.messageQueue.event = {
	notify: function(timer){
		while (IncomingMail.messageQueue.entries.length != 0){
			console.log('new mail');
			cryptCheck();
		}
		console.log('ping');
		timer.initWithCallback(IncomingMail.messageQueue.event, 
			IncomingMail.messageQueue.interval, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
	}
}
IncomingMail.messageQueue.startup = function (){
    IncomingMail.messageQueue.event.notify(IncomingMail.messageQueue.timer);
}

IncomingMail.messageQueue.startup();


//adapted from mailboxalert
IncomingMail.getInterface = function (item, iff){
	var interface = item.QueryInterface(iff);
	return interface;
}


IncomingMail.filter_action =
	{
	id: "cryptcheck@point3.net#filter", 
	name: "CryptCheck", 
		apply: function(aMsgHdrs, aActionValue, aListener, aType, aMsgWindow)
		{
		console.log('log from filter action');
		for (var i = 0; i < aMsgHdrs.length; i++)
			{
				console.log('inside filter if statememt');
				var msgHdr = aMsgHdrs.queryElementAt(i, Components.interfaces.nsIMsgDBHdr);	
				if (!msgHdr.isRead)
				{
					console.log('inside filter if statememt');
				}
			}
		},
	isValidForType: function(type, scope)
		{

		return true;
		}, 
	validateActionValue: function(value, folder, type)
		{
		//??????
		return null;
		},
	allowDuplicates: true,
	needsBody: false //maybe
	};


IncomingMail.getFolder = function()
{
	try
	{
		var folderResource = GetFirstSelectedMsgFolder(); 
		if (folderResource){
			var msgFolder = IncomingMail.getInterface(folderResource, Components.interfaces.nsIMsgFolder);
			return msgFolder;
		}
	} catch{
		console.log('something bad happened in IncomingMail.getFolder');
	}
	return null;
}


IncomingMail.FolderListener = function(){}

IncomingMail.FolderListener.prototype = 
{
	OnItemAdded: function(parentItem, item) //?
	{
        const MSG_FOLDER_FLAG_OFFLINE = 0x8000000; //????
        var folder = IncomingMail.getInterface(parentItem, Components.interfaces.nsIMsgFolder);        
        if (parentItem.name == "Inbox"){
        	try{

        	item.QueryInterface(Components.interfaces.nsIMsgDBHdr, message);
        	var incomingMsgHdr = item.QueryInterface(Components.interfaces.nsIMsgDBHdr);
        	console.log('message id: ' + incomingMsgHdr.messageID);
        	console.log('message key: ' + incomingMsgHdr.messageKey);
        	console.log('thread id: ' + incomingMsgHdr.threadId);

        	var newMessage = {
        		key: incomingMsgHdr.messageKey,
        		folder: incomingMsgHdr.folder
        	};

        	IncomingMail.messageQueue.entries.push(newMessage);

       		} catch (e) {
        	console.log ('something bad happened in the listener');
       		console.log(e);
       		}
       }
	}
}

IncomingMail.onLoad = function ()
{
	console.log('onload function');
	removeEventListener("load", IncomingMail.onLoad, true);
	Components.classes["@mozilla.org/messenger/services/session;1"]
	    .getService(Components.interfaces.nsIMsgMailSession)
	    .AddFolderListener(new IncomingMail.FolderListener(),
	    Components.interfaces.nsIFolderListener.all);

    var filterService = Components.classes["@mozilla.org/messenger/services/filters;1"]
                    .getService(Components.interfaces.nsIMsgFilterService); //idk what this does
    filterService.addCustomAction(IncomingMail.filter_action);
}

addEventListener("load", IncomingMail.onLoad, true);


//logic functions
function cryptCheck() 
	{ 
		//TODO: fix hard coded company name
		console.log('cryptcheck function');
		var why = "";
		//TODO: implement array of whitelisted addresses to be editable in settings. for now:
		var whitelist = ["customersupport@point3.net", "info@point3.net"];
		var companyDomain = "@point3.net";
		var newMessage = IncomingMail.messageQueue.entries.pop();
		var folder = newMessage.folder;
		var msgHdr = folder.GetMessageHeader(newMessage.key)

		if (isEncrypted(msgHdr)){
			console.log("encrypted message recieved");
			return false;
		}
		console.log("unencrypted message recieved");

		if (!msgHdr.mime2DecodedAuthor.includes(companyDomain)){ 
			return false;
		}
		//TODO: check w/ enigmail to see if we have recipients public key		
		//TODO: access forward or not in header data-> make this a preference?
		if (msgHdr.mime2DecodedSubject.includes("Fwd:")){
			return false;
		}
		var i = 0;
		while (i < whitelist.length){
			if (msgHdr.mime2DecodedAuthor.includes(whitelist[i])){
				return false;
			}else{
				i++;
			}
		}

		//msg breaks protocol
		composeAutoReply(msgHdr);
	}

function isEncrypted(msgHdr)
	{
		var msgUri = msgHdr.folder.getUriForMsg(msgHdr);
		var msgService = messenger.messageServiceFromURI(msgUri);
		var scriptableInputStream = Components.classes["@mozilla.org/scriptableinputstream;1"].
		  createInstance(Components.interfaces.nsIScriptableInputStream);
		var syncStreamListener = Components.classes["@mozilla.org/network/sync-stream-listener;1"].
		  createInstance(Components.interfaces.nsISyncStreamListener);
		scriptableInputStream.init(syncStreamListener);
		var messageUri = msgService.streamHeaders(msgUri, syncStreamListener, null /*urlListener*/);
		var data = new String();
		var count = scriptableInputStream.available();
		while (count) {
		  data = data + scriptableInputStream.read(count);
		  count = scriptableInputStream.available();
		}
		scriptableInputStream.close();
		var re = new RegExp("Content-Type: (.*)");
		var m = data.match(re);
		var type = m && m[1];
		
		type = type.toString();
		console.log(type);
		return type.includes("encrypted");
	}


//returns bool of whether recipient has senders public key or not
//this should affect the message sent: aka why it broke protocol
//how do we access key list?
function hasPublicKey(/*something*/)
	{

	}

//return if forwarded or not
function isForwarded(/*something*/)
	{

	}

 
 /*
	  * This creates the message that is sent to whoever broke protocol. At this
	  * point in code flow, it has already worked through the logic to determine
	  * whether the message is bad or not, so any msgHdr that comes in is verified 
	  * bad. It might have to be sent manually, but this should at least create the 
	  * message.
  */


 function composeAutoReply(msgHdr){
 	var composeParams = {};
 	var recipients = msgHdr.mime2DecodedRecipients;
 	var inSub = msgHdr.mime2DecodedSubject;
 	var composeParams;
 	composeParams.to = msgHdr.mime2DecodedAuthor;
 	//TODO: add date and time
 	//TODO: make this more formal/prettier
 	composeParams.body = 
 	"This is an automatically generated nastygram to let you know you should have encrypted your email "
 		+ '\"' + inSub + '\"'
 		+ " sent to " + recipients + ". This is a security company, for Turing's sake!" 
 		+ '\n' + "-CryptBot"
 		+ '\n' + '\n' + "P.S. This is an automatically composed email sent by the Thunderbird CryptCheck extension. "
 		+ "If you think this email is a mistake, please let grace at point3 dot net know.";
 //	browser.beginNew(composeParams);
	console.log(composeParams.body);

 }
 