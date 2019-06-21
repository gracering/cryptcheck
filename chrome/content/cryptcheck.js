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
		Content-Language: en-US

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
* 5. send message to sender 
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
		for (var i = 0; i < aMsgHdrs.length; i++)
			{
			var msgHdr = aMsgHdrs.queryElementAt(i, Components.interfaces.nsIMsgDBHdr);	
				if (!msgHdr.isRead)
				{
					console.log('log from filter action');
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
        try{
        	item.QueryInterface(Components.interfaces.nsIMsgDBHdr, message);
        	//do thing here, I think.
        	console.log('inside the listener -> item added');
        } catch {
        	console.log('something bad happened inside folderlistener');
        }
	}
}

IncomingMail.onLoad = function ()
{
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

function cryptCheck(/*something*/) //change later: enncrypted vs unencrypted bool? or string metadata?
	{



	}


/*
 *
 * most of these functions can probably use or be replaced by stdlib headerutils
 *
 */

//returns boolean is encrypted or no
function isEncrypted(msgHdr)
	{


	}

//returns boolean is point3 address or no
//TODO: for general use, figure out how to not hardcode thistt


function addressFilter(msgHdr)
	{

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
 	var composeParams;
 	composeParams.to = msgHdr.author;
 	composeParams.body = "This is an automatically generated email to let you know you should have encrypted your email sent to [RECIPIENT] at [TIME AND DATE]. If you think this email is a mistake, please let grace@point3.net know.";
 	browser.beginNew(composeParams);

 }
