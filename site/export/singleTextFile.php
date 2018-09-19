<?php
/**
  This script provides single phonetic transcriptions as downloads in textfiles.
*/
//Checking if all expected parameters are given:
$params = array('word','language','study','n',);
foreach($params as $p){
  if(!array_key_exists($p, $_GET)){
    die('The following parameters must be supplied: '.implode(', ', $params));
  }
}
//Setup:
chdir('..');
require_once('config.php');
//Transcription to work with:
$ts = DataProvider::getTranscriptions($_GET['study']);
if(!array_key_exists($_GET['language'].$_GET['word'], $ts)){
  die('Sorry, for the passed parameter was nothing found');
}
$ts = $ts[$_GET['language'].$_GET['word']];
//The Phonetic:
$ps = $ts['Phonetic'];
if(__::isArray($ps)){
  $n = preg_match('/^\d+$/', $_GET['n']) ? $_GET['n'] : 0;
  if($n >= count($ps)){
    die('Sorry, cannot deliver n='.$n.' for values: '.implode(', ', $ts));
  }else{
    $ps = $ps[$n];
  }
}
//Figuring out the filename:
if(is_Array($ts['path'])){
  $file = $ts['path'][$n].".txt";
}else{
  $file = $ts['path'].".txt";
}
//Delivering the content:
header('Content-Type: text/plain; charset=utf-8');
header('Content-Disposition: attachment;filename="'.$file.'"');
echo $ps;
