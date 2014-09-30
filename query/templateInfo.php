<?php
//Setup to have a JSON response:
require_once '../config.php';
Config::setResponseJSON();
//Composing our information object:
$info  = array();
$sums  = `md5sum ../templates/*.html`; // We depend on md5sum, or a similar hash alg.
$lines = explode("\n", $sums);
foreach($lines as $l){
  $x = explode('  ', $l);
  if(count($x) !== 2)
    continue;
  $file = substr($x[1], 3);
  $info[$file] = $x[0];
}
echo json_encode($info);
?>