Facebook Connect PhoneGap Plugin
================================

Offical plugin for Facebook Connect.


Testing
-------

To run the test suite you will need to have ios-sim installed. Then
simply run:

    ./run-tests

The tests can be found in `./test/www/facebook-connect-tests.js`.

iOS Testing
-----------

Make sure you add the scheme to your [PROJECTNAME]-Info.plist, substitute [APP_ID] and [SCHEME_ID] below to the appropriate values. This is to handle the re-direct from Mobile Safari, after permission authorization.

<pre>
&lt;key&gt;CFBundleURLTypes&lt;/key&gt;
&lt;array&gt;
	&lt;dict&gt;
		&lt;key&gt;CFBundleURLName&lt;/key&gt;
		&lt;string&gt;[SCHEME_ID]&lt;/string&gt;
		&lt;key&gt;CFBundleURLSchemes&lt;/key&gt;
		&lt;array&gt;
			&lt;string&gt;fb[APP_ID]&lt;/string&gt;
		&lt;/array&gt;
	&lt;/dict&gt;
&lt;/array&gt;
</pre>