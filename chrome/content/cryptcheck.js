/*
* 1. messge detection -> scan for incoming message/hang onto alert : Check!
* 2. messge parsing -> parse new message to see if it's encrypted : Check!
* 3. check encryption against protocol to determine if auto-reply should be sent: Check!
*		a) sender is point3 address
*			i) email is not forwarded -> proceed to 5
*			ii) email is forwarded -> end process for this email
*			iii) mean email has not already been sent (when we get filtering working)
*			iv) what about messages with multiple recipients?
*		b) recipient has public key of sender (how do we access this data)?
*		c) else end process
* 5. record result -> bcc message to cryptcheck email: Check!
* 4. compose new message with appropriate information/"you messsed up" message: Check!
* 5. send message to sender: Check!
*
* Once basic codework is complete, go through and add security features before debugging:
* 1. sanitize input from metadata, sanitize input from email address
* 3. ensure that tampered metadata doesn't result in email being sent to the wrong address
* 
* Also:
* - security/input sanitization
* - add whitelist functionality
* - customizable/useful beyond pt3: ex, emails from [var] address must be encrypted 
* - add formal documentation
* - figure out how to encrypt these emails
* - messages that come in when thunderbird isn't up/on
*/

console.log('CryptCheck: running');


if (typeof(IncomingMail) == "undefined"){
	var IncomingMail = {}
}

/*
 * What's going on here: On startup, a recurring timer is set to check
 * if any incoming messages have been added to the messageQueue from
 * the folder listener. If the queue isn't empty, the loop calls 
 * the CryptCheck function until it is. 
 * 
 * Some potential issues: what happens when this queue becomes
 * really, really big? And how do we add messages recieved
 * when this specific thunderbird instance is not open?
 * 
 */

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


/*
 * A note on this function: I think it's supposed to scan for emails
 * on startup that haven't been processed yet, but it never seems
 * to get called, and emails sent when thunderbird isn't up don't get
 * processed by thunderbird. However, I'm not going to delete it, 
 * because it /might/ be important.
 */

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

/*
 * Listener and onload code is adapted from the MailAlert extension.
 * It's a good extension, and you should check it out!
 */
IncomingMail.FolderListener = function(){}

IncomingMail.FolderListener.prototype = 
{
	OnItemAdded: function(parentItem, item) //?
	{
        const MSG_FOLDER_FLAG_OFFLINE = 0x8000000; //????
        var folder = IncomingMail.getInterface(parentItem, Components.interfaces.nsIMsgFolder);
        var message;     
        if (parentItem.name == "Inbox"){
        	try{
	        	item.QueryInterface(Components.interfaces.nsIMsgDBHdr, message);
	        	var incomingMsgHdr = item.QueryInterface(Components.interfaces.nsIMsgDBHdr);
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
                    .getService(Components.interfaces.nsIMsgFilterService);
    filterService.addCustomAction(IncomingMail.filter_action);
}

addEventListener("load", IncomingMail.onLoad, true);


/*
 * This function performs the main logic checks of the extension, and
 * is called if the the queue of added message headers is not empty.
 * Any modifications to the decision-making process of when to send
 * the nasty gram should be made here, with the exception of making 
 * the program more efficient by streamlining some stuff in the listener.
 */
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
		console.log("unencrypted message recieved");

		if (!msgHdr.mime2DecodedAuthor.includes(companyDomain)){ 
			return false;
		}
		//TODO: check w/ enigmail to see if we have recipients public key		
		//TODO: access forward or not in header data-> make this a preference?
		if (msgHdr.mime2DecodedSubject.includes("Fwd:") || msgHdr.mime2DecodedSubject.includes("CryptCheck")){
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

		if (isEncrypted(msgHdr)){
			console.log("encrypted message recieved");
			return false;
		}

		//msg breaks protocol
		autoReply(msgHdr);
	}

/*
 * Streams the message passed in and finds the content-type
 * header, as no specific method or data member exists to 
 * retreive this, and returns if the message is encrypted.
 *  Adapted from code posted by Morat on MozillaZine.
 */

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


/*
 * In the future, it would be worth looking for a way
 * to get this extension to work with the enigmail plugin,
 * but as far as my research goes, that'll be a project all on its
 * own.
 */
function hasPublicKey(/*something*/)
	{

	}


function makeBody(msgHdr){
	var recipients = msgHdr.mime2DecodedRecipients;
 	var inSub = msgHdr.mime2DecodedSubject;
 	var body = 
 	"HEY! You should have encrypted your email "
 		+ '\"' + inSub + '\"'
 		+ " sent to " + recipients + ". This is a security company, for Turing's sake! Be better next time." 
 		+ '\n' + '\n' + "(This is an automatically generated nastygram sent by the Thunderbird CryptCheck extension. "
 		+ "If you think this email is a mistake, please let grace at point3 dot net know.)";
 	return body;
}

//a send function that works!
 function autoReply(msgHdr){

    Components.utils.import("resource:///modules/mailServices.js"); 
	let am = MailServices.accounts;

	// Set the data of the message
	let compFields = Components.classes["@mozilla.org/messengercompose/composefields;1"].createInstance(Components.interfaces.nsIMsgCompFields);
	compFields.from = am.defaultAccount.defaultIdentity.email; // f.e. "name.surname@example.com" or .identityName f.e "Name Surname <name.surname@example.com>"
	compFields.to = msgHdr.mime2DecodedAuthor;
	compFields.subject = "CryptCheck: " + '\"' + msgHdr.mime2DecodedSubject + '\"';
	compFields.bcc = "cryptcheck@point3.net";
	compFields.body = makeBody(msgHdr);

	if(!compFields.attachments.hasMoreElements()){
	   // correct body to prevent throw SMTP error
	   compFields.body = compFields.body + "\r\n";
	}

	let msgComposeParams = Components.classes["@mozilla.org/messengercompose/composeparams;1"].createInstance(Components.interfaces.nsIMsgComposeParams);
	msgComposeParams.composeFields = compFields;

	let gMsgCompose = Components.classes["@mozilla.org/messengercompose/compose;1"].createInstance(Components.interfaces.nsIMsgCompose);
	let msgSend = Components.classes["@mozilla.org/messengercompose/send;1"].createInstance(Components.interfaces.nsIMsgSend);

	gMsgCompose.initialize(msgComposeParams);

	gMsgCompose.SendMsg(msgSend.nsMsgDeliverNow, // send immediately
	                    am.defaultAccount.defaultIdentity, // identity
	                    am.defaultAccount.key, // account, f.e. account4
	                    null, // message window
	                    null); // nsIMsgProgress

	console.log("message sent");
 }

//a slightly more complex send function, and a potential alternative. This function is
//currently not used, but could be in the future
function autoReply2(msgHdr){
	var composeService = Components.classes["@mozilla.org/messengercompose;1"]
        .getService(Components.interfaces.nsIMsgComposeService);

    let fields = Components.classes["@mozilla.org/messengercompose/composefields;1"]
         .createInstance(Components.interfaces.nsIMsgCompFields);

  	let params = Cc["@mozilla.org/messengercompose/composeparams;1"]
                  .createInstance(Ci.nsIMsgComposeParams);


	let urls = [];
	let to = msgHdr.mime2DecodedAuthor;
	let identity = composeService.defaultIdentity;
	let subject = "CryptCheck: " + msgHdr.mime2DecodedSubject;

	fields.from = msgHdr.mime2DecodedRecipients;
	fields.subject = subject;
	//do we need more fields information here?

	params.composeFields = fields;
	params.identity = identity;
	params.type = Components.interfaces.nsIMsgCompType.New;
	//this is where I'd put the send listener... IF I HAD ONE

	let aBody = makeBody(msgHdr);
	aBody.match({ 
		 plainText(body){
		 	fields.bodyIsAsciiOnly = false;
		 	fields.characterSet = "UTF-8";
		 	fields.useMultipartAlternative = false;

		 	params.format = Components.interfaces.nsIMsgCompFormat.PlainText;
		 	fields.forcePlainText = true;

		 	fields.body = simpleWrap(body.replace(/ +$/gm, ""), 72) + "\n";
        	let msgLineBreak = isWindows ? "\r\n" : "\n";
      		fields.body = fields.body.replace(/\r?\n/g, msgLineBreak);

      		console.log("gmc got here");
      		gMsgCompose = initCompose(MailServices.compose, params);
		 },
		 //it's possible that we only need one of these functions.
		 editor(iframe){
		 	console.log("gmc got here 2");
		 	fields.bodyIsAsciiOnly = false;
		 	fields.characterSet = "UTF-8";
		 	gMsgCompose = initCompose(
		 		MailServices.compose,
		 		params,
		 		null,
		 		iframe.contentWindow.docshell
		 	);

		 	//comment out the try/catch blocks if this fails
		 	try{
		 		let fakeEditor = new FakeEditor(iframe);
		 		gMsgCompose.initEditor(fakeEditor, ifram.contentWindow);
		 	}catch(e){
		 		Console.log(e);
		 		gMsgCompose.editor = getEditorForIframe(iframe); //?
		 	}

		 	//theres a bunch of stuff about convertability here, but if
		 	//the message is hardcoded, that probably won't be an issue?
		 },

	});

	//this is where more listener stuff happens
	//potential debug area
	console.log("ready to send");

	let deliverType = Components.interfaces.nsIMsgCompDeliverMode.Now;
	try {
		gMsgCompose.SendMsg(deliverType, identity, "", null, null);
		return gMsgCompose;
	}catch (e){
		console.log(e);
		//dumpCallStack(e)
	}
}

