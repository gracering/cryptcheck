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
			iii) what about messages with multiple recipients?
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
* do anything unintened (attackers most likely to come from these channels)
* 
* Also:
* - add whitelist functionality
*/

//start->javascript has self-declaring anon functions 
(function(){
	/*
	 * code following is adapted from the CapsKiller source code
	 */

	// Querying mime conversion interface
	var mimeConvert = Components.classes["@mozilla.org/messenger/mimeconverter;1"]
	     .getService(Components.interfaces.nsIMimeConverter);

	//function to determine encryption+use cases ("main")
	//TODO: graph this function + helper functions out
	function cryptCheck(string foo) //change later: enncrypted vs unencrypted bool? or string metadata?
		{



		}


	/*
	 *
	 * most of these functions can probably use or be replaced by stdlib headerutils
	 *
	 */

	//returns boolean is encrypted or no
	function encryptedFilter(/*something*/)
		{


		}

	//returns boolean is point3 address or no
	//TODO: for general use, figure out how to not hardcode this
	function addressFilter(/*something*/)
		{

		}

	//returns bool of whether recipient has senders public key or not
	//this should affect the message semnt: aka why it broke protocol
	//how do we access key list?
	function hasPublicKey(/*something*/)
		{

		}

	//return if forwarded or not
	function isForwarded(/*something*/)
		{

		}

	//from capkiller-> detect incoming messages (maybe)
	window.addEventListener('load', function()
		{
		// Localized strings
		var stringsObj = document.getElementById("cryptcheck-strings");
		// Creating a filter for exisiting messages
		//what? is this going to ping every user on startup? it seems more useful to only iterate over
		//unread messages/uncoming messages
		var cryptCheck =
			{
			id: "cryptcheck@point3.net#encryptioncheck", // Adding a name
			name: stringsObj["name"], // Adding the name of the filter
			//???
			apply: function(aMsgHdrs, aActionValue, aListener, aType, aMsgWindow)
				{
				for (var i = 0; i < aMsgHdrs.length; i++)
					{
					var msgHdr = aMsgHdrs.queryElementAt(i, Components.interfaces.nsIMsgDBHdr);
					//replace with address
					//msgHdr.subject = subjectFilter(msgHdr.subject);
					}
				/* Debug
				consoleService.logStringMessage('CapsKiller: Filter applied');//*/
				},
			isValidForType: function(type, scope)
				{
				/* Debug
				consoleService.logStringMessage('CapsKiller: Filter validated. Type: '+type+'.');//*/
				return true;
				}, // all
			validateActionValue: function(value, folder, type)
				{
				/* Debug
				consoleService.logStringMessage('CapsKiller: dunno what it does');//*/
				return null;
				},
			allowDuplicates: true,
			needsBody: false //removed comma here
			};



		// add filter action to filter action list
		let filterService = Components.classes["@mozilla.org/messenger/services/filters;1"]
		.getService(Components.interfaces.nsIMsgFilterService);
		filterService.addCustomAction(cryptCheck);
		/* Debug
		consoleService.logStringMessage('CapsKiller: Filter added');//*/
		// Listening for new mails


		var newMailListener =
			{
			msgAdded: function(msgHdr)
				{
				if(!msgHdr.isRead)
					{
					//new mail, CHANGE to get address
					msgHdr.subject = subjectFilter(msgHdr.subject);
					//bodyFilter(msgHdr);
					}
				/* Debug
				consoleService.logStringMessage('CapsKiller: Filter applied to new messages');//*/
				}
			};

		var notificationService =
		Components.classes["@mozilla.org/messenger/msgnotificationservice;1"]
			.getService(Components.interfaces.nsIMsgFolderNotificationService);
		notificationService.addListener(newMailListener, notificationService.msgAdded);
		/* Debug
		consoleService.logStringMessage('CapsKiller: New messages listener added');//*/

		/* It looks like this function modifies the subject of the email; the corresponding
		 * next steps for cryptcheck would be the compose/send logic (probably)
		 * note: the brackets for this are all messed up. fix later if it's going to be used
		 
		document.getElementById('messagepane').addEventListener('load',function() 
			{
			document.getElementById('expandedsubjectBox').headerValue=capsKiller(document.getElementById('messagepane')
				.contentWindow.document.getElementsByTagName('title')[0].textContent);
			var treeWalker = document.getElementById('messagepane').contentWindow.document.createTreeWalker(
					document.getElementById('messagepane').contentWindow.document.body,
					NodeFilter.SHOW_TEXT,
					null,
					false
				);
			while(treeWalker.nextNode())
				treeWalker.currentNode.textContent=capsKiller(treeWalker.currentNode.textContent);
			}
				,true);
				*/
		},false);
	})();


