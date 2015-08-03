# Test Your Facebook Web App on localhost

A quick guide to testing your Facebook app on localhost

### Steps

**You must complete the [steps to create a Cordova browser application](README.md) and add the plugin first.**

  - Install `http-server` with node by issuing this command: `npm install -g http-server` (you may have to use sudo for this to work depending on your system setup)
  - Open terminal and cd to your cordova project
  - Run this command to run your server

```sh
$ cordova prepare && http-server platforms/browser/www
```
  - open your browser and go to `localhost:8080/`
