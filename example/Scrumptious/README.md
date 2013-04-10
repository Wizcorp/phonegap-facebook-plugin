Scrumptious sample web app
=================================

Demo: https://scrumpit.herokuapp.com/index.html

## Getting started

  1. Follow the instructions in the README located in the root of this repo to create a sample PhoneGap application with the PhoneGap Facebook Plugin.
  2. Go to [Facebook Developers app dashboard](https://developers.facebook.com/apps/). Note your app ID, and namespace. For my example, I used **cordova** as a namespace and **273476932664248** for app ID. 
  3. On [Facebook Developers app dashboard](https://developers.facebook.com/apps/), select your app and click edit. Generate a hosting url by following the link on that page. Fill out the pop up to create a heroku instance. Click go to app. Now you should be in a new tab with a url similar to http://YOUR-APP.heroku.com. 
  4. Click Learn how to edit this app button. Follow the instructions on this page. It will lead you to download the heroku toolbelt and be able to push changes to the heroku instance. Don't worry about setting up a local instance of heroku for now. 
  5. Add your website's domain as an app domain, website URL, and mobile website URL in the [Facebook Developers app dashboard](https://developers.facebook.com/apps/) for your app.
  6. Create an Open Graph action - object pair: `eat` a `meal`.
  7. Edit the `eat` action. Select the following optional capabilities: Tags, User Messages, Place, Explicitly Shared. Save Changes.
  8. Navigate to the scrumptions/server directory. Edit each of the html files by replacing my heroku instance (http://whispering-ravine-4547.herokuapp.com/) url with yours. You also will want to change the open graph action in each of these html files to your action (Replace any mention of **cordova**). Copy the contents of the server directory into your heroku app. Push your heroku changes up to the server.
  9. Copy over the contents of the Scrumptious www folder into the www folder of your project. Overwrite/Replace files when needed. 
  10. Go through index.html and replace the sample app ID, **273476932664248**, with your app ID.
  11. Open up js/main.js and replace **cordova** with your app namespace.
  12. You will notice that for each meal item in js/main.js, I have a url pointing to my heroku instance. For example **http://whispering-ravine-4547.herokuapp.com/cheeseburger.html**. You are going to want to change the urls to match your heroku instance. 
  13. You should be able to build and run a device or simulator now!
