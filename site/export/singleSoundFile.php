<?php
/**
  This script aims to work as a trampoline for downloads, that shall be saved rather than opened in the browser.
  To achieve this, it's necessary to set the http headers accordingly.
  We expect a valid CDSTAR object URL get parameter to be given.
*/
if(!array_key_exists('file', $_GET)){
  die('You must supply a file parameter.');
}
chdir('..');
require_once('config.php');
$file = $_GET['file'];
if(strncmp($file, "http", 4) !== 0){
  die("Deprecated request due to moving sound files to another server - make sure to use the latest version.");
}
switch (pathinfo($file, PATHINFO_EXTENSION)){
    case 'mp3':
        $mimetype = 'audio/mpeg';
        break;
    case 'ogg':
        $mimetype = 'audio/ogg';
        break;
    case 'wav':
        $mimetype = 'audio/wav';
        break;
    default:
        $mimetype = 'application/octet-stream';
        break;
}
$ctx = stream_context_create(array('http'=>
  array(
    'timeout' => 10
  )
));
//Setting common headers:
header('Pragma: public');
header('Expires: 0');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0".');
header('Content-Disposition: attachment;filename="'.basename($file).'"');
header('Content-Transfer-Encoding: binary');
//Handing over the file:
if(isset($_GET['base64'])){
  header('Content-Type: application/base64');
  echo base64_encode(file_get_contents($file, false, $ctx));
}else{
  header('Content-Type: '.$mimetype);
  echo file_get_contents($file, false, $ctx);
}
