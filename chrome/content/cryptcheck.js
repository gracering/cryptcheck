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
/*
var { Cc } = require("chrome");
var clazz = Cc["@mozilla.org/messenger;1"];
*/

console.log('CryptCheck: running');

//start->javascript has self-declaring anon functions 
(function(){
	/*
	 * code following is adapted from the CapsKiller source code
	 */
	console.log('CryptCheck: main function running');
	// Querying mime conversion interface
	//var mimeConvert = Components.classes["@mozilla.org/messenger/mimeconverter;1"]
	   //  .getService(Components.interfaces.nsIMimeConverter);

	//function to determine encryption+use cases ("main")
	//TODO: graph this function + helper functions out
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

	//	TEMP: TO SATISFY COMPILER

	/*
	 * The following code detects unread messages utilizing the messages api
	 * available in the thunderbird beta release, which should go live around 
	 * 3rd quarter 2019. Backwards compatability is little to none, so we'll
	 * see how this goes.
	 */

	 function getUnreadMessages(inbox) //should this be a var?
	 	{
	 		//from messageList api doc page
	 		//var folder = listMessages()
	 		console.log('CryptCheck: whaddup ');
	 		async function* listMessages(MailFolder) {
			  let page = await browser.messages.list(folder);
			  for (let message of page.messages) {
			    yield message;
			  }

			  while (page.id) {
			    page = await browser.messages.continueList(page.id);
			    for (let message of page.messages) {
			      yield message;
			    }
			  }
			}
	 	}




	//from capkiller-> detect incoming messages (maybe)
	window.addEventListener('load', function()
		{
		console.log('CryptCheck: add event listener');
		// Localized strings
		getUnreadMessages();
		var stringsObj = document.getElementById("cryptcheck-strings");
		// Creating a filter for exisiting messages
		//what? is this going to ping every user on startup? it seems more useful to only iterate over
		//unread messages/uncoming messages
		var cryptCheck =
			{
			id: "cryptcheck@point3.net", // Adding a name
			name: "name", // Adding the name of the filter
			//???
			apply: function(aMsgHdrs, aActionValue, aListener, aType, aMsgWindow)
				{
				for (var i = 0; i < aMsgHdrs.length; i++)
					{
					console.log('CryptCheck: boop');

					//var msgHdr = aMsgHdrs.queryElementAt(i, Components.interfaces.nsIMsgDBHdr);
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
		//let filterService = Components.classes["@mozilla.org/messenger/services/filters;1"]
		//.getService(Components.interfaces.nsIMsgFilterService);
		//filterService.addCustomAction(cryptCheck);
		/* Debug
		consoleService.logStringMessage('CapsKiller: Filter added');//*/
		// Listening for new mails

		console.log('CryptCheck: got here');

		var newMailListener =
			{
			msgAdded: function(msgHdr)
				{
				if(!msgHdr.isRead)
					{
					console.log('CryptCheck: new message found');
					//new mail, CHANGE to get address
					if (!isEncrypted(msgHdr)){
						console.log('CryptCheck: unencrypted message recieved');

					}
					//bodyFilter(msgHdr);
					}
				/* Debug
				consoleService.logStringMessage('CapsKiller: Filter applied to new messages');//*/
				}
			};

			console.log('CryptCheck: got down here');


		//var notificationService =
		//Components.classes["@mozilla.org/messenger/msgnotificationservice;1"]
		//	.getService(Components.interfaces.nsIMsgFolderNotificationService);
		//notificationService.addListener(newMailListener, notificationService.msgAdded);
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


//RESTARTLESS ADD ON FUINCTIONS (WHO KNOWS IF THEY WORK)

var EXPORTED_SYMBOLS = ["RestartlessMenuItems"];

const {Services} = ChromeUtils.import("resource://gre/modules/Services.jsm");

let _menuItems = [];

function isThunderbird() {
  let APP_ID = Services.appinfo.QueryInterface(Ci.nsIXULRuntime).ID;
  return APP_ID == "{3550f703-e582-4d05-9a08-453d09bdfdc6}";
}

/**
 * Adds a menuitem to a window.
 * @param w {nsIDOMWindow} A window to patch.
 * @param loadedAlready {bool} The window above is fully loaded,
 *  or we should wait to be loaded.
 * @param options {Object} Options for the <tt>menuitem</tt>, with the following parameters:
 * @param options.id {String} An id for the <tt>menuitem</tt>, this should be namespaced.
 * @param options.label {String} A label for the <tt>menuitem</tt>.
 * @param options.url {String} (optional, preferred) An URL where the <tt>oncommand</tt> should navigate to.
 * @param options.onCommand {String} (optional) A function callback what the <tt>menuitem</tt>'s oncommand will call.
 * @param options.accesskey {String} (optional) An access key for the <tt>menuitem</tt>.
 * @param options.key {String} (optional) A shortcut key for the <tt>menuitem</tt>.
 * @param options.image {String} (optional) An URL for the <tt>menuitem</tt>.
 */
function monkeyPatchWindow(w, loadedAlready, options) {
  let doIt = function() {
    let id = options.id;
    let taskPopup = w.document.getElementById("taskPopup");
    let tabmail = w.document.getElementById("tabmail");
    let oldMenuitem = w.document.getElementById(id);

    // Check the windows is a mail:3pane
    if (!taskPopup || !tabmail)
      return;

    let openTabUrl = function() {
      return (options.url) ?
        tabmail.openTab("contentTab",
          { contentPage: options.url }
        )
        : false;
    };

    let onCmd = function() {
      openTabUrl() || options.onCommand && options.onCommand();
    };

    let menuitem = w.document.createElement("menuitem");
    menuitem.addEventListener("command", onCmd);
    menuitem.setAttribute("label", options.label);
    menuitem.setAttribute("id", id);
    if (options.accesskey)
      menuitem.setAttribute("accesskey", options.accesskey);
    if (options.key)
      menuitem.setAttribute("key", options.key);
    if (options.image) {
      menuitem.setAttribute("class", "menuitem-iconic");
      menuitem.style.listStyleImage = "url('" + options.image + "')";
    }
    if (!oldMenuitem)
      taskPopup.appendChild(menuitem);
    else
      taskPopup.replaceChild(menuitem, oldMenuitem);
  };
  if (loadedAlready)
    doIt();
  else
    w.addEventListener("load", doIt);
}

/**
 * Removes a menuitem from a window.
 * @param w {nsIDOMWindow} A window to patch.
 * @param options {Object} Options for the <tt>menuitem</tt>, with the following parameter:
 * @param options.id {String} An id for the <tt>menuitem</tt>, this should be namespaced.
 * @param options.url {String} (optional) An URL for the <tt>menuitem</tt>, tabs with this URL will be closed.
 * @param options.onUnload {Function} (optional) A function for the <tt>menuitem</tt>, which redoes all the stuff
 *  except the removing of menuitem.
 */
function unMonkeyPatchWindow(w, options) {
  let id = options.id;
  let menuitem = w.document.getElementById(id);
  let tabmail = w.document.getElementById("tabmail");

  // Remove all menuitem with this id
  while (menuitem) {
    menuitem.parentNode.removeChild(menuitem);
    menuitem = w.document.getElementById(id);
  }

  // Close all tab with options.url URL
  let removeTabUrl = function() {
    let tabMode = tabmail.tabModes.contentTab;
    let shouldSwitchToFunc = tabMode.shouldSwitchTo ||
                            tabMode.tabType.shouldSwitchTo;

    if (shouldSwitchToFunc) {
      let tabIndex = shouldSwitchToFunc.apply(tabMode.tabType, [{ contentPage: options.url }]);
      while (tabIndex >= 0) {
        tabmail.closeTab(tabIndex, true);
        tabIndex = shouldSwitchToFunc.apply(tabMode.tabType, [{ contentPage: options.url }]);
      }
    }
  };

  if (options.url)
    removeTabUrl();
  else
    options.onUnload && options.onUnload();
}

/**
 * This is Our observer. It catches the newly opened windows
 *  and tries to run the patcher on them.
 * @observes "domwindowopened"
 *
 * @prop observe An nsIWindowWatcher will notify this method. It will call the {@link monkeyPatchWindow}.
 * @prop register Start listening to notifications.
 * @prop unregister Stop listening to notifications.
 */
function monkeyPatchWindowObserver() {}

monkeyPatchWindowObserver.prototype = {
  observe(aSubject, aTopic, aData) {
    if (aTopic == "domwindowopened") {
      aSubject.QueryInterface(Ci.nsIDOMWindow);
      for (let aMenuItem of _menuItems)
        monkeyPatchWindow(aSubject.window, false, aMenuItem);
    }
  },
  register() {
    Services.ww.registerNotification(this);
  },
  unregister() {
    Services.ww.unregisterNotification(this);
  },
};

/**
 * This is the observer Object.
 */
let monkeyPatchFutureWindow = new monkeyPatchWindowObserver();

/**
 * This is the public interface of the RestartlessMenuItems module.
 *
 * @prop add Adds a parameterized <tt>menuitem</tt> to existing and
 *  newly created windows.
 * @prop remove Removes an identified <tt>menuitem</tt> from
 *  existing window, and will not add to new ones.
 * @prop removeAll Removes all the <tt>menuitem</tt>s currently added.
 */
var RestartlessMenuItems = {
  add: function _RestartlessMenuItems_add(options) {
    // For Thunderbird, since there's no URL bar, we add a menu item to make it
    // more discoverable.
    if (isThunderbird()) {
      // Thunderbird-specific JSM
      let {fixIterator} = ChromeUtils.import("resource:///modules/iteratorUtils.jsm", null);

      // Push it to our list
      _menuItems.push(options);

      // Patch all existing windows
      for (let w of fixIterator(Services.wm.getEnumerator("mail:3pane"), Ci.nsIDOMWindow)) {
        // True means the window's been loaded already, so add the menu item right
        // away (the default is: wait for the "load" event).
        monkeyPatchWindow(w.window, true, options);
      }

      // Patch all future windows
      // with our list of menuItems
      if (_menuItems.length == 1)
        monkeyPatchFutureWindow.register();
    }
  },

  remove: function _RestartlessMenuItems_remove(options, keepArray) {
    if (isThunderbird()) {
      // Find the menuitem in our list by id
      let found = false;
      let index = -1;
      found = _menuItems.some( function isOurMenuItem(element, arrayIndex) {
        if (element.id == options.id)
          index = arrayIndex;
        return (element.id == options.id);
      });

      // Un-patch all existing windows
      if (found) {
        let {fixIterator} = ChromeUtils.import("resource:///modules/iteratorUtils.jsm", {});
        for (let w of fixIterator(Services.wm.getEnumerator("mail:3pane"))) {
          unMonkeyPatchWindow(w, _menuItems[index]);
        }
      }

      if (!keepArray) {
        // Pop out from our list
        if (found)
          _menuItems.splice(index, 1);

        // Stop patching future windows if our list is empty
        if (_menuItems.length == 0)
          monkeyPatchFutureWindow.unregister();
      }
    }
  },

  removeAll: function _RestartlessMenuItems_removeAll() {
    if (isThunderbird()) {
      // Remove all added menuitems
      for (let aMenuItem of _menuItems)
        this.remove(aMenuItem, true);
      _menuItems = [];
      monkeyPatchFutureWindow.unregister();
    }
  },

};