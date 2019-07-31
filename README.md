# cryptcheck
Thunderbird extension that checks emails for encryption protocol and notifies the sender if protocol has been broken.

Created by Grace Ring for Point3 Security. Almost called leetcrypt.

To install from the .xpi file:
1. Download the zip file of the latest release
2. Unzip the .xpi file to desired location
3. In Thunderbird, go to Settings->Add-Ons
4. Click on the "Extensions" tab in the lefthand menu
5. Settings->Install add-on from file-> select unzipped .xpi
6. Restart thunderbird

To build from source code, navigate to the unzipped cryptcheck file and use
zip -r ../cryptcheck.xpi *
