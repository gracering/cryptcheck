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
*		b) recipient has public key of sender (how do we access this data)?
*		c) else end process
* 5. record result -> where should this be stored?
*		a) create file in thunderbird source files? hook up to database? later
* 4. compose new message with appropriate information/"you messsed up" message
* 5. send message to sender 
* 6. alert end user that a message was sent (attach alert/generate new message?)
*/

//message detection
