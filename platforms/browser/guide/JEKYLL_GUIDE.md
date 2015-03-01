# Test Your FB WebApp with Jekyll

A quick guite to testing your FB app with Jekyll.

### Steps

**You must complete the [steps to create a Cordova browser application](https://github.com/Wizcorp/phonegap-facebook-plugin/blob/master/platforms/browser/README.md) and add the plugin first.**

- Download Jekyll from [http://jekyllrb.com/docs/installation/](http://jekyllrb.com/docs/installation/)
- Open terminal and cd to your cordova project `/platforms/browser` folder. Re-name the `www` folder to `public`

```sh
$ mv www public
```

- Enter the public folder and run Jekyll:

```sh
$ cd public
$ jekyll serve
```

- open your browser and goto `localhost:4000/`
