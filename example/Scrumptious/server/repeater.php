<?php
function curPageURL() {
 $pageURL = 'http://';
 if ($_SERVER["SERVER_PORT"] != "80") {
  $pageURL .= $_SERVER["SERVER_NAME"].":".$_SERVER["SERVER_PORT"].$_SERVER["REQUEST_URI"];
 } else {
  $pageURL .= $_SERVER["SERVER_NAME"].$_SERVER["REQUEST_URI"];
 }
 return $pageURL;
}
?>

<html>
  <head prefix="og: http://ogp.me/ns# product: http://ogp.me/ns/product#">
    <meta property="fb:app_id" content="<?php echo strip_tags($_REQUEST['fb:app_id']);?>">
      <meta property="og:url" content="<?php echo strip_tags(curPageURL());?>">
      <meta property="og:type" content="<?php echo strip_tags($_REQUEST['og:type']);?>">
      <meta property="og:title" content="<?php echo strip_tags($_REQUEST['og:title']);?>">
      <meta property="og:image" content="<?php echo strip_tags($_REQUEST['og:image']);?>">
      <meta property="og:description" content="<?php echo strip_tags($_REQUEST['og:description']);?>">
      <title>Product Name</title>
  </head>
    <body>
      <?php echo strip_tags($_REQUEST['body']);?>
    </body>
</html>