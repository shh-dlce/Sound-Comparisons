<?php
  /**
  update tables
  */
  chdir('..');
  require_once('common.php');
  require_once('../query/cacheProvider.php');

  session_validate()     or Config::error('403 Forbidden');
  session_mayTranslate() or Config::error('403 Forbidden');

  $pfields = array('LanguageIx','IxElicitation','IxMorphologicalInstance','AlternativePhoneticRealisationIx','AlternativeLexemIx');  

  //Actions:
  switch($_GET['action']){
    case 'delete':
    if($_GET['Table'] == 'Transcriptions_'){
      $dbConnection    = Config::getConnection();
      $study = $dbConnection->escape_string($_GET['Study']);
      if(substr($_GET['Table'], -1) == '_'){
        $table = $dbConnection->escape_string($_GET['Table'].$_GET['Study']);
      }else{
        $table = $dbConnection->escape_string($_GET['Table']);
      }
      $pkeys = array();
      $transids = preg_split('/T/', $dbConnection->escape_string((string)$_GET['Transid']));
      $i = 0;
      foreach($transids as $k){
        array_push($pkeys, $pfields[$i] . "=" . $k);
        $i++;
      }
      $pkey = join(" AND ", $pkeys);
      $query = "DELETE FROM $table"
        ." WHERE $pkey LIMIT 1";
      $dbConnection->query($query);
      //echo $query;
      if($dbConnection->error !== ""){
        echo $dbConnection->error." in: ".$query;
      }
      CacheProvider::cleanCache('../');
    }
    break;
    case 'update':
    if($_GET['Table'] == 'Transcriptions_'){
        $dbConnection    = Config::getConnection();
        $study = $dbConnection->escape_string($_GET['Study']);
        if(substr($_GET['Table'], -1) == '_'){
          $table = $dbConnection->escape_string($_GET['Table'].$_GET['Study']);
        }else{
          $table = $dbConnection->escape_string($_GET['Table']);
        }
        $pkeys = array();
        $transids = preg_split('/T/', $dbConnection->escape_string((string)$_GET['Transid']));
        $i = 0;
        foreach($transids as $k){
          array_push($pkeys, $pfields[$i] . "=" . $k);
          $i++;
        }
        $getfields = $_GET['Fields'];
        $fields = array();
        foreach($getfields as $k=>$v){
          array_push($fields, "$k='".ltrim(rtrim($dbConnection->escape_string($v)))."'");
        }
        if(isset($_GET['FilePath']) && ($transids[3] !== $getfields['AlternativePhoneticRealisationIx'] || $transids[4] !== $getfields['AlternativeLexemIx'])){
          $old = $_GET['FilePath'];
          $new = $_GET['FilePath'];
          if(intval($transids[4]) > 0){
            $old = $old."_lex".$transids[4];
          }
          if(intval($transids[3]) > 0){
            $old = $old."_pron".$transids[3];
          }
          if(intval($getfields['AlternativeLexemIx']) > 0){
            $new = $new."_lex".$getfields['AlternativeLexemIx'];
          }
          if(intval($getfields['AlternativePhoneticRealisationIx']) > 0){
            $new = $new."_pron".$getfields['AlternativePhoneticRealisationIx'];
          }
          $query = "INSERT INTO renamed_soundfiles (old, new) VALUES ('".$old."', '".$new."')";
          $dbConnection->query($query);
          if($dbConnection->error !== ""){
            echo $dbConnection->error." in: ".$query;
            CacheProvider::cleanCache('../');
            die;
          }
        }
        $field = join(", ", $fields);
        $pkey = join(" AND ", $pkeys);
        $query = "UPDATE $table SET $field"
          ." WHERE $pkey";
        $dbConnection->query($query);
        //echo $query;
        if($dbConnection->error !== ""){
          echo $dbConnection->error." in: ".$query;
        }
        CacheProvider::cleanCache('../');
    }
    break;
    case 'duplicate':
    if($_GET['Table'] == 'Transcriptions_'){
        $dbConnection    = Config::getConnection();
        $study = $dbConnection->escape_string($_GET['Study']);
        if(substr($_GET['Table'], -1) == '_'){
          $table = $dbConnection->escape_string($_GET['Table'].$_GET['Study']);
        }else{
          $table = $dbConnection->escape_string($_GET['Table']);
        }
        $pkeys = array();
        $transids = preg_split('/T/', $dbConnection->escape_string((string)$_GET['Transid']));
        $i = 0;
        foreach($transids as $k){
          array_push($pkeys, $pfields[$i] . "=" . $k);
          $i++;
        }
        $getfields = $_GET['Fields'];
        $fields = array();
        foreach($getfields as $k=>$v){
          array_push($fields, "$k='".ltrim(rtrim($dbConnection->escape_string($v)))."'");
        }
        $new_lex = "2";
        if(intval($transids[4]) > 0){
          $new_lex = strval(intval($transids[4]) + 1);
        }
        $old = $_GET['FilePath'];
        $new = $_GET['FilePath'];
        if(intval($transids[4]) > 0){
          $old = $old."_lex".$transids[4];
        }
        if(intval($transids[3]) > 0){
          $old = $old."_pron".$transids[3];
        }
        $new = $new."_lex".$new_lex;
        if(intval($getfields['AlternativePhoneticRealisationIx']) > 0){
          $new = $new."_pron".$getfields['AlternativePhoneticRealisationIx'];
        }
        $query = "INSERT INTO renamed_soundfiles (old, new) VALUES ('".$old."', '".$new."')";
        $dbConnection->query($query);
        if($dbConnection->error !== ""){
          echo $dbConnection->error." in: ".$query;
          CacheProvider::cleanCache('../');
          die;
        }
        $field = join(", ", $fields);
        $pkey = join(" AND ", $pkeys);
        $query = "CREATE TEMPORARY TABLE dup_temp ENGINE=MEMORY SELECT * FROM $table WHERE $pkey LIMIT 1";
        $dbConnection->query($query);
        $query = "UPDATE dup_temp SET AlternativeLexemIx=$new_lex";
        $dbConnection->query($query);
        $query = "INSERT INTO $table SELECT * FROM dup_temp";
        $dbConnection->query($query);
        $query = "DROP TABLE dup_temp";
        $dbConnection->query($query);
        //echo $query;
        if($dbConnection->error !== ""){
          echo $dbConnection->error." in: ".$query;
        }
        CacheProvider::cleanCache('../');
    }
    break;
  }
