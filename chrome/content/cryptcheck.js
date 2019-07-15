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
*/

console.log('CryptCheck: running');


//browser.browserAction.enable();

// Querying mime conversion interface
//var mimeConvert = Components.clases["@mozilla.org/messenger/mimeconverter;1"]
   //  .getService(Components.interfaces.nsIMimeConverter);

//function to determine encryption+use cases ("main")

//defining inocoming mail object -> potentially change this name bc right now I'm 
//not really sure what anything does
if (typeof(IncomingMail) == "undefined"){
	var IncomingMail = {}
}

//interface query function (what does this do?)
//adapted from mailboxalert
IncomingMail.getInterface = function (item, iff){
	var interface = item.QueryInterface(iff);
	return interface;
}


IncomingMail.filter_action =
	{
	id: "cryptcheck@point3.net#filter", // Adding a name
	name: "CryptCheck", // Adding the name of the filter
	//???
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
					//use data from msgHdr to create the new message/alert?
					//pass to logic determining address, encryptd, etc
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

	/*
	 * Might need to add some folder get methods here (see mailboxalert_vars.js, lines 600+). Not
	 * sure why or how they might plug in, but it's worth noting.
	 */

console.log('CryptCheck: got here');


IncomingMail.getFolder = function()
{
	try
	{
		var folderResource = GetFirstSelectedMsgFolder(); //do we need to define this function?
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
        var message;
        //console.log(folder.name);
        //is folder parentItem here
        console.log(parentItem.name);
        
        if (parentItem.name == "Inbox"){
        //	try{

        	item.QueryInterface(Components.interfaces.nsIMsgDBHdr, message);
        	var incomingMsgHdr = item.QueryInterface(Components.interfaces.nsIMsgDBHdr);
        	console.log(incomingMsgHdr);
        	/*
        	 * streams the message header and searches for content-type
        	 * TODO move this into it's own function
        	 * code courtesy of morat from mozillazine
        	 */ 
        	//console.log(message);

        	
        	gFolderDisplay.selectMessage(incomingMsgHdr);
        	var msgHdr = gFolderDisplay.selectedMessage;

        	console.log(msgHdr);
        	
			var msgUri = msgHdr.folder.getUriForMsg(msgHdr);
			console.log(msgUri);
			
			var msgService = messenger.messageServiceFromURI(msgUri);
			var scriptableInputStream = Components.classes["@mozilla.org/scriptableinputstream;1"].
			  createInstance(Components.interfaces.nsIScriptableInputStream);
			var syncStreamListener = Components.classes["@mozilla.org/network/sync-stream-listener;1"].
			  createInstance(Components.interfaces.nsISyncStreamListener);
			scriptableInputStream.init(syncStreamListener.inputStream);
			var messageUri = msgService.streamHeaders(msgUri, syncStreamListener, null /*urlListener*/);
			var data = new String();

			// this is the line that breaks it
			// I'm assuming this is because it times out before it reaches the 'end'
			// of the stream, although im not sure if its an issue with the data type
			// (selected message and the components function seem to return slightly 
			// different versions of the header variable) or if the variable is null
			// or something like that, which it sometimes pops out as. its probably 
			// possible to get around this specific syntax by using another EOF detection
			// implementation, but the issue is most likely with the value of the 'header'
			// variable itself. 
			//var count = scriptableInputStream.available();

			//while (count) {
			//	data = data + scriptableInputStream.read(count);
			//	count = scriptableInputStream.available();
			//} 
			console.log('before stream');
			const MAX_MESSAGE_LENGTH = 65536;
			var data = scriptableInputStream.read(MAX_MESSAGE_LENGTH);
			console.log('after stream');



			var type = " ";
			scriptableInputStream.close();
			var re = new RegExp("Content-Type: (.*)");
			var m = data.match(re);
			var type = m && m[1];
			cryptCheck(type, msgHdr);//msgHdr might actually be item
			
			console.log('end listener');
		

       // } catch (e) {
       //		console.log(e);
       //	}
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
    //do we have to re-add a listener here?
}

//adds folder listener
addEventListener("load", IncomingMail.onLoad, true);


//logic functions
//type: regexed content-type expression
//msgHdr: returned DBMsgHdr
function cryptCheck(type, msgHdr) //change later: enncrypted vs unencrypted bool? or string metadata?
	{ 
		//hard coded for now--eventually, this should be changeable in settings
		//TODO: fix hard coded company name
		console.log('cryptcheck function');
		var why = "";
		//TODO: implement array of whitelisted addresses to be editable in settings. for now:
		var whitelist = ["customersupport@point3.net", "info@point3.net"];
		var companyDomain = "@point3.net";
		if (isEncrypted(type)){
			console.log("encrypted message recieved");
			return false;
		}
		console.log("unencrypted message recieved");
		//checks for company address
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

function isEncrypted(type)
	{
		
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
	// console.log(composeParams.body);

 }
 