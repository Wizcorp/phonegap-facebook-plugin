Scrumptious sample web app
=================================

Demo: https://scrumpit.herokuapp.com/index.html

## Getting started

  1. Follow the instructions in the README loacted in the root of this repo to create a sample PhoneGap application with the PhoneGap Facebook Plugin.
  2. Go to [Facebook Developers app dashboard](https://developers.facebook.com/apps/). Note your app ID, and namespace. For my example, I used **cordova** as a namespace and **273476932664248** for app ID. 
  3. On [Facebook Developers app dashboard](https://developers.facebook.com/apps/), select your app and click edit. Generate a hosting url by following the link on that page. Fill out the pop up to create a heroku instance. Click go to app. Now you should be in a new tab with a url similar to http://YOUR-APP.heroku.com. 
  4. Click Learn how to edit this app button. Follow the instructions on this page. It will lead you to download the heroku toolbelt and be able to push changes to the heroku instance. Don't worry about setting up a local instance of heroku for now.
  5. Now, from the scrumptions folder, copy the contents of the server directory into your heroku app. repeater.php and the images folder. Push your heroku changes up to the server. 
  6. Add your website's domain as an app domain, website URL, and mobile website URL in the [Facebook Developers app dashboard](https://developers.facebook.com/apps/) for your app.
  7. Create an Open Graph action - object pair: `eat` a `meal`.
  8. Edit the `eat` action. Select the following optional capabilities: Tags, User Messages, Place, Explicitly Shared. Save Changes.
  9. Copy over the contents of the Scrumptious www folder into the www folder of your project. Overwrite/Replace files when needed. 
  10. Go through index.html and replace the sample app ID, **273476932664248**, with your app ID.
  11. Open up js/main.js and replace **cordova** with your app namespace.
  12. You will notice that for each meal item in js/main.js, I have a long url pointing to my heroku instance with my app id and my namespace in it. For example **http://whispering-ravine-4547.herokuapp.com/repeater.php?fb%3Aapp_id=273476932664248+&og%3Atype=cordova%3Ameal+&og%3Atitle=Cheeseburger+&og%3Adescription=Cheeseburger+&og%3Aimage=https%3A%2F%2Fwhispering-ravine-4547.herokuapp.com%2Fimages%2Fmeals%2Fcheeseburger-full.png&body=Cheeseburger**. You are going to want to change the urls to match your heroku instance and add your own app id + namespace. 
  13. You should be able to build and run a device or simulator now!
