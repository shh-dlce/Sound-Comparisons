<?php
$dir = getcwd(); chdir(__DIR__);
require_once('../config.php');
chdir($dir); unset($dir);
/**
  This is mostly a helper class for query/data.php,
  but since some of it's parts shall be used at other places also,
  the raw gathering of informations from the database is outsourced here.
  DataProvider assumes that config.php has been included before operation takes place.
*/
class DataProvider {
  /***/
  public static $soundExtensions = array('.mp3','.ogg');
  /***/
  public static $missingSounds = array();
  /***/
  public static $checkFilePaths = array();
  public static $checkFilePathsFurtherCheckOfDisk = "";
  public static $checkFilePathsNumberOfWords = 0;
  public static $checkFilePathsForLanguageIx = array();
  public static $transcriptionTable = array();
  public static $transcriptionTable2 = array();
  public static $editTranscriptionTable = array();
  public static $editTranscriptionMetaData = array();
  /**
    @param $q SQL String
    @return [[Field => Value]]
    Executes a query against the Config::getConnection.
    All rows are fetched with fetch_assoc and returned in an array in order.
  */
  public static function fetchAll($q){
    $ret = array();
    $set = Config::getConnection()->query($q);
    if($set !== false){
      while($x = $set->fetch_assoc()){
        array_push($ret, $x);
      }
    }
    return $ret;
  }
  /**
    @param $lang String Languages_$sId, FilePathPart field
    @param $word String Words_$sId, SoundFileWordIdentifierText field
    @param $pron ''||String Transcriptions_$sId, AlternativePhoneticRealisationIx field
    @param $lex  ''||String Transcriptions_$sId, AlternativeLexemIx field
    @return $paths [String] array of existing .{mp3,ogg} files with Config::$soundPath prefix
    Searches for existing SoundFiles and returns them.
  */
  public static function findSoundFiles($lang, $word, $pron = '', $lex = ''){
    if($pron !== '') $pron = '_pron'.$pron;
    if($lex  !== '') $lex  = '_lex'.$lex;
    $path = Config::$soundPath."/$lang/$lang$word$lex$pron";
    $ret  = array();
    foreach(static::$soundExtensions as $ext){
      $p = $path.$ext;
      if(file_exists($p)){
        array_push($ret, $p);
      }
    }
    if(count($ret) === 0){
      array_push(static::$missingSounds, $path.'.{mp3,ogg}');
    }
    return $ret;
  }
  /**
    @param $sId String studyId like the _$sId suffixes in the db.
    @param $t [ LanguageIx => String
              , IxElicitation => String
              , IxMorphologicalInstance => String
              , AlternativePhoneticRealisationIx => String
              , AlternativeLexemIx => String]
    @return [ lang => FilePathPart
            , word => SoundFileWordIdentifierText
            , pron => AlternativePhoneticRealisationIx || ''
            , lex  => AlternativeLexemIx || '']
    Gathers information necessary to look for a sound file.
  */
  public static function soundPathParts($sId, $t){
    $lIx = $t['LanguageIx'];

    // check if LanguageIx still exists
    $lq  = "SELECT LanguageIx FROM Languages_$sId WHERE LanguageIx = $lIx";
    $set = DataProvider::fetchAll($lq);
    if(count($set) === 0){return null;}

    $wId = $t['IxElicitation'].$t['IxMorphologicalInstance'];
    if(!isset($lIx) || !isset($wId))
      return array();
    $base = Config::$soundPath;
    $lq   = "SELECT FilePathPart FROM Languages_$sId WHERE LanguageIx = $lIx";
    $wq   = "SELECT SoundFileWordIdentifierText FROM Words_$sId "
          . "WHERE CONCAT(IxElicitation, IxMorphologicalInstance) = '$wId'";
    $getFirst = function($q){
      $set = DataProvider::fetchAll($q);
      if(count($set) === 0){
        Config::error("Problem with query: '$q'", true);
        return '';
      }
      return current(current($set));
    };
    return array(
      'lang' => $getFirst($lq)
    , 'word' => $getFirst($wq)
    , 'pron' => ($t['AlternativePhoneticRealisationIx'] > 1) ? $t['AlternativePhoneticRealisationIx'] : ''
    , 'lex'  => ($t['AlternativeLexemIx'] > 1) ? $t['AlternativeLexemIx'] : ''
    );
  }
  /**
    @param $sId String studyId like the _$sId suffixes in the db.
    @param $t [ LanguageIx => String
              , IxElicitation => String
              , IxMorphologicalInstance => String
              , AlternativePhoneticRealisationIx => String
              , AlternativeLexemIx => String]
    @return static::findSoundFiles(…);
    Uses static::soundPathParts to gather and sanitize data necessary for static::findSoundFiles,
    which is than executed and returned.
  */
  public static function soundPaths($sId, $t){
    $pts = static::soundPathParts($sId, $t);
    return static::findSoundFiles($pts['lang'], $pts['word'], $pts['pron'], $pts['lex']);
  }
  /**
    @return Studies [String]
    Returns an array with all studies currently known to the database in it.
  */
  public static function getStudies(){
    $studies = array();
    $set = Config::getConnection()->query('SELECT Name FROM Studies');
    while($r = $set->fetch_assoc()){
      array_push($studies, $r['Name']);
    }
    return $studies;
  }
  /**
    @return Studies [String]
    Returns an array with all Words_study->FullRfcModernLg01 .
  */
  public static function getWordsForStudy($study){
    $words = array();
    $n  = Config::getConnection()->escape_string($study);
    $set = Config::getConnection()->query("SELECT FullRfcModernLg01 FROM Words_$n ORDER BY FullRfcModernLg01");
    while($r = $set->fetch_assoc()){
      array_push($words, $r['FullRfcModernLg01']);
    }
    return $words;
  }
  /**
    @return Studies [String]
    Returns an array with all Languages_studyShortName.
  */
  public static function getLgsForStudy($study){
    $lgs = array();
    $n  = Config::getConnection()->escape_string($study);
    $set = Config::getConnection()->query("SELECT ShortName FROM Languages_$n ORDER BY ShortName");
    while($r = $set->fetch_assoc()){
      array_push($lgs, $r['ShortName']);
    }
    return $lgs;
  }
  /**
    @return Studies [String]
    Returns an array with all studies currently known to the database in it
    sorted for displaying only whereby StudyIx=1 are listed first followed by a divider (marked as "--").
  */
  public static function getStudiesForDisplay(){
    $studies = array();
    $set = Config::getConnection()->query('(SELECT Name FROM Studies WHERE StudyIx = 1 LIMIT 10000) UNION ALL (SELECT "--" AS Name) UNION ALL (SELECT Name FROM Studies WHERE StudyIx > 1 LIMIT 10000)');
    while($r = $set->fetch_assoc()){
      array_push($studies, $r['Name']);
    }
    return $studies;
  }
  /**
    @return $global [complex]
    Captures a representation of all data currently in the database that is not
    dependent on a specific study or translation,
    and is not internal to the admin section.
    This representation is presented to clients at another place,
    and used troughout the session/time of knowledge by the client.
  */
  public static function getGlobal(){
    $global = array(
      'shortLinks' => array()
    , 'soundPath'  => Config::$soundPath
    );
    $queries = array(
      'contributors'                => 'SELECT * FROM Contributors'
    , 'contributorCategories'       => 'SELECT * FROM ContributorCategories'
    , 'flagTooltip'                 => "SELECT * FROM FlagTooltip WHERE FLAG != ''"
    , 'languageStatusTypes'         => 'SELECT * FROM LanguageStatusTypes'
    , 'meaningGroups'               => 'SELECT * FROM MeaningGroups'
    , 'transcrSuperscriptInfo'      => 'SELECT * FROM TranscrSuperscriptInfo'
    , 'transcrSuperscriptLenderLgs' => 'SELECT * FROM TranscrSuperscriptLenderLgs'
    , 'wikipediaLinks'              => 'SELECT * FROM WikipediaLinks'
    );
    // Make sure that the following group_concat returns all
    $q = "SET @@group_concat_max_len = 4096";
    Config::getConnection()->query($q);
    foreach($queries as $k => $q){
      $global[$k] = static::fetchAll($q);
    }
    //Adding isoMap:
    foreach(static::fetchAll('SELECT DISTINCT ISOCode AS code, study, group_concat(FilePathPart) AS paths FROM Languages WHERE trim(ISOCode) <> "" AND study <> "Europe" GROUP BY ISOCode') as $s){
      $global['isoMap'][$s['code']] = array('study' => $s['study'], 'paths' => $s['paths']);
    }
    //Adding glottoCodeMap:
    foreach(static::fetchAll('SELECT DISTINCT GlottoCode AS code, study, group_concat(FilePathPart) AS paths FROM Languages WHERE trim(GlottoCode) <> "" AND study <> "Europe" GROUP BY GlottoCode') as $s){
      $global['glottoCodeMap'][$s['code']] = array('study' => $s['study'], 'paths' => $s['paths']);
    }
    //Adding filePathPartMap:
    foreach(static::fetchAll('SELECT FilePathPart AS FPP, study FROM Languages WHERE study <> "Europe"') as $s){
      $global['filePathPartMap'][$s['FPP']] = array('study' => $s['study']);
    }
    //Adding shortLinks:
    foreach(static::fetchAll('SELECT Name, Target FROM Page_ShortLinks') as $s){
      $global['shortLinks'][$s['Name']] = $s['Target'];
    }
    //Fixing contributor avatars:
    foreach($global['contributors'] as $k => $v){
      $q = "SELECT url FROM contributorimages WHERE filepathpart = '' AND tag = '".$v['Initials']."'";
      $set = static::fetchAll($q);
      if(count($set) > 0){
        $global['contributors'][$k]['Avatar'] = $set[0]['url'];
      }
    }
    return $global;
  }
  /**
    @param $study String Name of an entry in the Studies table
    @return $sId String
    Fetches the CONCAT(StudyIx, FamilyIx) for a given Studies Name from the db.
  */
  public static function getStudyId($study){
    $db = Config::getConnection();
    $n  = $db->escape_string($study);
    $q  = "SELECT CONCAT(StudyIx, FamilyIx) FROM Studies WHERE Name = '$n'";
    if($sId = $db->query($q)->fetch_row()){
      return current($sId);
    }
    die('Could not fetch the required study, sorry.');
  }
  /**
    @return $assoc StudyRow
    Fetches a row for a study as an assoc array from the database.
  */
  public static function getStudy($name){
    $db = Config::getConnection();
    $n  = $db->escape_string($name);
    $q  = "SELECT * FROM Studies WHERE Name = '$n'";
    return $db->query($q)->fetch_assoc();
  }
  /**
    @param $studyId StudyId as fetched with static::getStudyId()
    @return $families [{}]
    Fetches all Families that a given study belongs to,
    and returns them in order as assocs.
  */
  public static function getFamilies($studyId){
    $sId = Config::getConnection()->escape_string($studyId);
    $q = "SELECT * FROM Families "
       . "WHERE CONCAT(StudyIx, FamilyIx) "
       . "LIKE (SELECT CONCAT(REPLACE($sId, 0, ''), '%'))";
    return static::fetchAll($q);
  }
  /**
    @param $studyName String
    @return $regions [{}]
    Fetches all regions that belong to a given study.
  */
  public static function getRegions($studyName){
    $db = Config::getConnection();
    $n  = $db->escape_string($studyName);
    $q  = "SELECT * FROM Regions_$n ORDER BY RegionGpSortIx";
    return static::fetchAll($q);
  }
  /**
    @param $studyName String
    @return $regionLanguages [{}]
    Fetches all regionLanguages that belong to a given study.
  */
  public static function getRegionLanguages($studyName){
    $db = Config::getConnection();
    $n  = $db->escape_string($studyName);
    $q  = "SELECT * FROM RegionLanguages_$n";
    return static::fetchAll($q);
  }
  /**
    @param $studyName String
    @return $languages [{}]
    Fetches all languages that belong to a given study.
  */
  public static function getLanguages($studyName){
    $db = Config::getConnection();
    $n  = $db->escape_string($studyName);
    $q  = "SELECT * FROM Languages_$n";
    $lData = static::fetchAll($q);
    return array_map('DataProvider::getLanguageContributorImages', $lData);
  }
  /**
    @return TranslationId, TranslationName []
    Fetches all translation Ids and languages.
  */
  public static function getAllTranslationLanguages(){
    $q = "SELECT TranslationId,TranslationName FROM Page_Translations ORDER BY TranslationId;";
    return static::fetchAll($q);
  }
  /**
    @param $languageData {} as fetch_assoc from Languages_* table
    @return $languageData with additional 'contributors' field
  */
  public static function getLanguageContributorImages($languageData){
    if(array_key_exists('FilePathPart', $languageData)){
      $images = array();
      $q = "SELECT url FROM contributorimages WHERE filepathpart = '".$languageData['FilePathPart']."' ORDER BY tag";
      $set = static::fetchAll($q);
      if(count($set) > 0){
        foreach($set as $t){
          array_push($images, $t['url']);
        }
      }
      $languageData['ContributorImages'] = $images;
    }
    return $languageData;
  }
  /**
    @param $studyName String
    @return $words [{}]
    Fetches all words that belong to a given study.
  */
  public static function getWords($studyName){
    $db = Config::getConnection();
    $n  = $db->escape_string($studyName);
    $q  = "SELECT * FROM Words_$n";
    return static::fetchAll($q);
  }
  /**
    @param $studyId String
    @return MeaningGroupMembers [[MeaningGroupIx, MeaningGroupMemberIx, IxElicitation, IxMorphologicalInstance]]
    Fetches all MeaningGroupMembers that belong to a given studyId.
  */
  public static function getMeaningGroupMembers($studyId){
    $sId = Config::getConnection()->escape_string($studyId);
    $q   = "SELECT MeaningGroupIx, MeaningGroupMemberIx, IxElicitation, IxMorphologicalInstance FROM MeaningGroupMembers "
         . "WHERE CONCAT(StudyIx, FamilyIx) = $sId";
    return static::fetchAll($q);
  }
  /**
    @param $studyName String
    @return transcriptions [CONCAT(LanguageIx,IxElicitation,IxMorphologicalInstance) => {}]
    Fetches all transcriptions that belong to a given study.
    Since transcriptions may occupy more than just one row in the database,
    their contents are merged together, and they are not kept in order,
    but are given keys by fields that identify them precisely.
    Since there are cases where we expect transcriptions to exist,
    but they're not given by the database, this method makes use of
    static::getDummyTranscriptions to generate DummyTranscriptions,
    and fill them in where the expected key doesn't exist.
  */
  public static function getTranscriptions($studyName, $soundFiles = array()){
    $ret = array();
    $db  = Config::getConnection();
    $nquery   = $db->escape_string($studyName);
    // Fetch all studies involved - e.g. as for Andean where Mapudungun is a subset of Andean
    $allStudyNames = static::fetchAll("SELECT StudyIx, FamilyIx, SubFamilyIx, Name "
      ."FROM Studies WHERE Name = '$nquery' "
      ."UNION "
      ."SELECT StudyIx, FamilyIx, SubFamilyIx, Name "
      ."FROM Studies "
      ."WHERE "
      ."StudyIx = (SELECT StudyIx FROM Studies WHERE Name = '$nquery') "
      ."AND "
      ."(CASE "
      ."WHEN (SELECT FamilyIx FROM Studies WHERE Name = '$nquery') = 0 "
      ."AND "
      ."(SELECT SubFamilyIx FROM Studies WHERE Name = '$nquery') = 0 "
      ."THEN FamilyIx > 0 OR SubFamilyIx > 0 "
      ."END "
      ."OR "
      ."CASE "
      ."WHEN (SELECT FamilyIx FROM Studies WHERE Name = '$nquery') > 0 "
      ."AND "
      ."(SELECT SubFamilyIx FROM Studies WHERE Name = '$nquery') = 0 "
      ."THEN FamilyIx = (SELECT FamilyIx FROM Studies WHERE Name = '$nquery') AND SubFamilyIx > 0 "
      ."END)");
    $not_array_fields = array('LanguageIx', 'IxElicitation', 'IxMorphologicalInstance', 'FamilyIx', 'StudyIx', 'transStudy');
    $transStudy = NULL;
    foreach($allStudyNames as $sn) {
      $n = $sn['Name'];
      $q = "SELECT DISTINCT t.*,concat(l.FilePathPart,w.SoundFileWordIdentifierText,"
        ."case when t.AlternativeLexemIx > 1 and t.AlternativePhoneticRealisationIx = 0 "
        ."then concat('_lex', t.AlternativeLexemIx) when t.AlternativeLexemIx = 0 "
        ."and t.AlternativePhoneticRealisationIx > 1 then concat('_pron', t.AlternativePhoneticRealisationIx) "
        ."when t.AlternativeLexemIx > 1 and t.AlternativePhoneticRealisationIx > 1 then "
        ."concat('_lex', t.AlternativeLexemIx,'_pron', t.AlternativePhoneticRealisationIx) "
        ."else '' end) AS path FROM Transcriptions_$n AS t, Languages_$nquery AS l, Words_$nquery AS w "
        ."WHERE t.LanguageIx = l.LanguageIx AND t.IxElicitation = w.IxElicitation "
        ."AND t.IxMorphologicalInstance = w.IxMorphologicalInstance ORDER BY t.LanguageIx, t.IxElicitation, "
        ."t.IxMorphologicalInstance, t.WCogID, t.WCogIDFine, t.AlternativeLexemIx, t.AlternativePhoneticRealisationIx";
      $set = static::fetchAll($q);
      if(count($set) > 0){
        foreach($set as $t){
          $tKey = $t['LanguageIx'].$t['IxElicitation'].$t['IxMorphologicalInstance'];
          $sfKey = $tKey.$t['AlternativePhoneticRealisationIx'].$t['AlternativeLexemIx'];
          $t['soundPaths'] = isset($soundFiles[$sfKey]) ? json_decode($soundFiles[$sfKey]) : [''];
          $transStudy = $n;
          $t['transStudy'] = $transStudy;
          //Merging transcriptions:
          if(array_key_exists($tKey, $ret)){
            $old = $ret[$tKey];
            foreach($t as $k => $v){
              if(array_key_exists($k, $old)){
                if(!in_array($k, $not_array_fields)){
                  $o = $old[$k];
                  if($k === 'soundPaths'){
                    if($o === $v) continue;
                    //since the first element is an array already make an array of an array
                    if(isset($o) && count($o) > 0 && !is_array($o[0])){
                      $o = array($o);
                    }
                    $o[] = $v;
                    $t[$k] = $o;
                    continue;
                  }
                  if(!is_array($o)){
                    $o = array($o);
                  }
                  $o[] = $v;
                  $t[$k] = $o;
                }
              }
            }
          }
          $ret[$tKey] = $t;
        }
      }
      //Handling dummy transcriptions:
      foreach(static::getDummyTranscriptions($n, $soundFiles, $transStudy) as $t){
        $tKey = $t['LanguageIx'].$t['IxElicitation'].$t['IxMorphologicalInstance'];
        if(!array_key_exists($tKey, $ret)){
          $ret[$tKey] = $t;
        }
      }
    }
    return $ret;
  }

  /**
    @param $studyName String
    @return array of dicts
  */
  public static function transcriptionTable($studyName){

    $db  = Config::getConnection();
    $n   = $db->escape_string($studyName);
    $urls = array();
    $q   = "SELECT s.IxElicitation, s.IxMorphologicalInstance, s.AlternativePhoneticRealisationIx, s.AlternativeLexemIx, s.LanguageIx,  REGEXP_REPLACE(s.urls, '.*/(.*?)/(.*?)\\\\.(mp3).*', 'https://cdstar.shh.mpg.de/bitstreams/\\\\1/\\\\2.\\\\3') AS url FROM Languages_$n AS l, Words_$n AS w, soundfiles AS s WHERE s.LanguageIx = l.LanguageIx AND s.IxElicitation = w.IxElicitation AND s.IxMorphologicalInstance = w.IxMorphologicalInstance";
    $set = static::fetchAll($q);
    if(count($set) > 0){
      foreach($set as $t){
        $tid = $t['LanguageIx']."T".$t['IxElicitation']."T".$t['IxMorphologicalInstance']."T".$t['AlternativePhoneticRealisationIx']."T".$t['AlternativeLexemIx'];
        $urls[$tid] = $t['url'];
      }
    }
    $q   = "SELECT t.SpellingAltv1, t.IxElicitation, t.IxMorphologicalInstance, t.AlternativePhoneticRealisationIx, t.AlternativeLexemIx, t.LanguageIx, l.FilePathPart, l.ShortName, t.Phonetic, t.WCogID,t.WCogIDFine, t.NotCognateWithMainWordInThisFamily, w.FullRfcModernLg01 AS Word FROM Languages_$n AS l, Transcriptions_$n AS t, Words_$n AS w WHERE t.LanguageIx = l.LanguageIx AND t.IxElicitation = w.IxElicitation AND t.IxMorphologicalInstance = w.IxMorphologicalInstance ORDER BY t.IxElicitation, l.LanguageIx";
    $set = static::fetchAll($q);
    if(count($set) > 0){
      foreach($set as $t){
        $data = array();
        $data['ShortName'] = $t['ShortName'];
        $data['LgIxFPP'] = $t['LanguageIx'].'<br/>'.$t['FilePathPart'];
        $data['Phonetic'] = $t['Phonetic'];
        $data['WCogID'] = $t['WCogID'];
        $data['WCogIDFine'] = $t['WCogIDFine'];
        $data['NotCog'] = $t['NotCognateWithMainWordInThisFamily'];
        $data['Word'] = $t['Word'];
        $data['SpellingAltv1'] = $t['SpellingAltv1'];
        $data['IxElicitation'] = $t['IxElicitation'];
        $data['IxMorphologicalInstance'] = $t['IxMorphologicalInstance'];
        $data['AlternativePhoneticRealisationIx'] = $t['AlternativePhoneticRealisationIx'];
        $data['AlternativeLexemIx'] = $t['AlternativeLexemIx'];
        $transcrid = $t['LanguageIx']."T".$t['IxElicitation']."T".$t['IxMorphologicalInstance']."T".$t['AlternativePhoneticRealisationIx']."T".$t['AlternativeLexemIx'];
        if(array_key_exists($transcrid, $urls)){
          $data['url'] = $urls[$transcrid];
        }else{
          $data['url'] = '';
        }
        $data['transcrid'] = $transcrid;
        array_push(static::$transcriptionTable, $data);
      }
    }
    return static::$transcriptionTable;
  }
  /**
    @param $studyName String
    @return array of dicts
  */
  public static function transcriptionTable2($studyName, $word = '', $lg = ''){

    $db  = Config::getConnection();
    $n   = $db->escape_string($studyName);
    $urls = array();
    $q   = "SELECT s.IxElicitation, s.IxMorphologicalInstance, s.AlternativePhoneticRealisationIx, s.AlternativeLexemIx, s.LanguageIx,  REGEXP_REPLACE(s.urls, '.*/(.*?)/(.*?)\\\\.(mp3).*', 'https://cdstar.shh.mpg.de/bitstreams/\\\\1/\\\\2.\\\\3') AS url FROM Languages_$n AS l, Words_$n AS w, soundfiles AS s WHERE s.LanguageIx = l.LanguageIx AND s.IxElicitation = w.IxElicitation AND s.IxMorphologicalInstance = w.IxMorphologicalInstance";
    $set = static::fetchAll($q);
    if(count($set) > 0){
      foreach($set as $t){
        $tid = $t['LanguageIx']."T".$t['IxElicitation']."T".$t['IxMorphologicalInstance']."T".$t['AlternativePhoneticRealisationIx']."T".$t['AlternativeLexemIx'];
        $urls[$tid] = $t['url'];
      }
    }
    $wQuery = '';
    if(strlen($word) > 0){
      $wQuery = " AND w.FullRfcModernLg01 = '".$db->escape_string($word)."' ";
    }
    else if(strlen($lg) > 0){
      $wQuery = " AND l.ShortName = '".$db->escape_string($lg)."' ";
    }
    $q   = "SELECT l.ShortName, w.FullRfcModernLg01 AS Word, t.StudyIx,t.FamilyIx,t.IxElicitation,t.IxMorphologicalInstance,t.AlternativePhoneticRealisationIx,t.AlternativeLexemIx,t.LanguageIx,t.Phonetic,t.SpellingAltv1,t.SpellingAltv2,t.NotCognateWithMainWordInThisFamily,t.WCogID,t.WCogIDFine,t.CommonRootMorphemeStructDifferent,t.DifferentMeaningToUsualForCognate,t.RootIsLoanWordFromKnownDonor,t.RootSharedInAnotherFamily,t.IsoCodeKnownDonor,t.ActualMeaningInThisLanguage,t.OtherLexemeInLanguageForMeaning,t.DifferentMorphemeStructureNote,t.OddPhonology,t.OddPhonologyNote,t.UsageNote,t.SoundProblem,t.ReconstructedOrHistQuestionable,t.ReconstructedOrHistQuestionableNote,t.RecordingMissing, l.FilePathPart FROM Languages_$n AS l, Transcriptions_$n AS t, Words_$n AS w WHERE t.LanguageIx = l.LanguageIx AND t.IxElicitation = w.IxElicitation AND t.IxMorphologicalInstance = w.IxMorphologicalInstance ".$wQuery." ORDER BY t.IxElicitation, t.IxMorphologicalInstance, l.LanguageIx, t.WCogID, t.WCogIDFine, t.AlternativeLexemIx, t.AlternativePhoneticRealisationIx";
    $set = static::fetchAll($q);
    if(count($set) > 0){
      foreach($set as $t){
        $t['LgIxFPP'] = $t['LanguageIx'].'<br/>'.$t['FilePathPart'];
        $trsc = $t['LanguageIx']."T".$t['IxElicitation']."T".$t['IxMorphologicalInstance']."T".$t['AlternativePhoneticRealisationIx']."T".$t['AlternativeLexemIx'];
        if(array_key_exists($trsc, $urls)){
          $t['url'] = $urls[$trsc];
        }
        $t['transcrid'] = $trsc;
        array_push(static::$transcriptionTable2, $t);
      }
    }
    return static::$transcriptionTable2;
  }
  /**
    @param $studyName String
    @return array of dicts
  */
  public static function editTranscriptionTable($d){

    $db  = Config::getConnection();
    $dt  = $db->escape_string($d);
    $dt_arr = preg_split('/\|/', $dt);
    $q   = "SELECT DISTINCT t.StudyIx,t.FamilyIx,t.IxElicitation,t.IxMorphologicalInstance,t.AlternativePhoneticRealisationIx,t.AlternativeLexemIx,t.LanguageIx,t.Phonetic,t.SpellingAltv1,t.SpellingAltv2,t.NotCognateWithMainWordInThisFamily,t.WCogID,t.WCogIDFine,t.CommonRootMorphemeStructDifferent,t.DifferentMeaningToUsualForCognate,t.ActualMeaningInThisLanguage,t.OtherLexemeInLanguageForMeaning,t.RootIsLoanWordFromKnownDonor,t.RootSharedInAnotherFamily,t.IsoCodeKnownDonor,t.DifferentMorphemeStructureNote,t.OddPhonology,t.OddPhonologyNote,t.UsageNote,t.SoundProblem,t.ReconstructedOrHistQuestionable,t.ReconstructedOrHistQuestionableNote,t.RecordingMissing, l.FilePathPart, l.ShortName, w.FullRfcModernLg01 AS Word, w.SoundFileWordIdentifierText, REGEXP_REPLACE(s.urls, '.*/(.*?)/(.*?)\\\\.(mp3).*', 'https://cdstar.shh.mpg.de/bitstreams/\\\\1/\\\\2.\\\\3') AS url FROM Languages_$dt_arr[0] AS l, Transcriptions_$dt_arr[0] AS t, Words_$dt_arr[0] AS w, soundfiles AS s WHERE t.LanguageIx = $dt_arr[1] AND t.LanguageIx = l.LanguageIx AND w.IxElicitation = ".substr($dt_arr[2], 0, -1)." AND t.IxMorphologicalInstance = ".substr($dt_arr[2], -1)." AND t.IxElicitation = w.IxElicitation AND w.IxMorphologicalInstance = t.IxMorphologicalInstance AND s.LanguageIx = l.LanguageIx AND s.AlternativeLexemIx = t.AlternativeLexemIx AND s.AlternativePhoneticRealisationIx = t.AlternativePhoneticRealisationIx AND s.IxElicitation = t.IxElicitation AND s.IxMorphologicalInstance = t.IxMorphologicalInstance ORDER BY t.IxMorphologicalInstance, t.WCogID, t.WCogIDFine, t.AlternativeLexemIx, t.AlternativePhoneticRealisationIx";
    $set = static::fetchAll($q);
    $seen_transcrid = array();
    static::$editTranscriptionMetaData = array();
    if(count($set) > 0){
      foreach($set as $t){
        if(count(static::$editTranscriptionMetaData) == 0){
          static::$editTranscriptionMetaData['Study'] = $dt_arr[0];
          static::$editTranscriptionMetaData['ShortName'] = $t['ShortName'];
          static::$editTranscriptionMetaData['FilePathPart'] = $t['FilePathPart'];
          static::$editTranscriptionMetaData['Word'] = $t['Word'];
          static::$editTranscriptionMetaData['IxElicitation'] = $t['IxElicitation'];
          static::$editTranscriptionMetaData['SoundFileWordIdentifierText'] = $t['SoundFileWordIdentifierText'];
        }
        $t['transcrid'] = $t['LanguageIx']."T".$t['IxElicitation']."T".$t['IxMorphologicalInstance']."T".$t['AlternativePhoneticRealisationIx']."T".$t['AlternativeLexemIx'];
        array_push($seen_transcrid, $t['transcrid']);
        array_push(static::$editTranscriptionTable, $t);
      }
    }
    # add items with no sound file
    $q   = "SELECT DISTINCT t.StudyIx,t.FamilyIx,t.IxElicitation,t.IxMorphologicalInstance,t.AlternativePhoneticRealisationIx,t.AlternativeLexemIx,t.LanguageIx,t.Phonetic,t.SpellingAltv1,t.SpellingAltv2,t.NotCognateWithMainWordInThisFamily,t.WCogID,t.WCogIDFine,t.CommonRootMorphemeStructDifferent,t.DifferentMeaningToUsualForCognate,t.ActualMeaningInThisLanguage,t.OtherLexemeInLanguageForMeaning,t.RootIsLoanWordFromKnownDonor,t.RootSharedInAnotherFamily,t.IsoCodeKnownDonor,t.DifferentMorphemeStructureNote,t.OddPhonology,t.OddPhonologyNote,t.UsageNote,t.SoundProblem,t.ReconstructedOrHistQuestionable,t.ReconstructedOrHistQuestionableNote,t.RecordingMissing, l.FilePathPart, l.ShortName,  w.SoundFileWordIdentifierText FROM Languages_$dt_arr[0] AS l, Transcriptions_$dt_arr[0] AS t, Words_$dt_arr[0] AS w WHERE t.LanguageIx = $dt_arr[1] AND t.LanguageIx = l.LanguageIx AND w.IxElicitation = ".substr($dt_arr[2], 0, -1)." AND t.IxMorphologicalInstance = ".substr($dt_arr[2], -1)." AND t.IxElicitation = w.IxElicitation AND w.IxMorphologicalInstance = t.IxMorphologicalInstance ORDER BY t.IxMorphologicalInstance, t.WCogID, t.WCogIDFine, t.AlternativeLexemIx, t.AlternativePhoneticRealisationIx";
    $set = static::fetchAll($q);
    if(count($set) > 0){
      foreach($set as $t){
        if(count(static::$editTranscriptionMetaData) == 0){
          static::$editTranscriptionMetaData['Study'] = $dt_arr[0];
          static::$editTranscriptionMetaData['ShortName'] = $t['ShortName'];
          static::$editTranscriptionMetaData['Word'] = $t['Word'];
          static::$editTranscriptionMetaData['IxElicitation'] = $t['IxElicitation'];
        }
        $trsc = $t['LanguageIx']."T".$t['IxElicitation']."T".$t['IxMorphologicalInstance']."T".$t['AlternativePhoneticRealisationIx']."T".$t['AlternativeLexemIx'];
        if(!in_array($trsc, $seen_transcrid)){
          $t['transcrid'] = $trsc;
          array_push(static::$editTranscriptionTable, $t);
        }
      }
    }
    return static::$editTranscriptionTable;
  }
  /**
    @param $studyName String
    @return success
    Creates a new empty row for editing a new transcription
  */
  public static function addTranscriptionFor($d){

    $db  = Config::getConnection();
    $dt  = $db->escape_string($d);
    $dt_arr = preg_split('/\|/', $dt);
    $q = "SELECT StudyIx, FamilyIx FROM Languages_$dt_arr[0] WHERE LanguageIx = $dt_arr[1];";
    $set = static::fetchAll($q);
    if(count($set) == 1){
      $studyix = $set[0]['StudyIx'];
      $famix = $set[0]['FamilyIx'];
      $q = "INSERT INTO Transcriptions_$dt_arr[0] (StudyIx, FamilyIx, IxElicitation, IxMorphologicalInstance, AlternativePhoneticRealisationIx, AlternativeLexemIx, LanguageIx, Phonetic, NotCognateWithMainWordInThisFamily) ";
      $q = $q."VALUES ($studyix, $famix, ".substr($dt_arr[2], 0, -1).", ".substr($dt_arr[2], -1).",0,0, $dt_arr[1], '', 0);";
      $r = $db->query($q);
    }
  }
  /**
    @param $studyName String
    @return array of missing sound files
  */
  public static function listMissingSounds($studyName){
    function strInArray ( $str, $array ) {
        if ( array_walk ( $array, function ( $val, $key ) use ( &$data, $str ) {
            if ( strpos ( $val, $str ) !== false ) {
                $data = $key;
            }
        }));
        return $data;
    }
    $db  = Config::getConnection();
    $n   = $db->escape_string($studyName);

    $q = "SELECT DISTINCT REGEXP_REPLACE(urls, '.*/(.*?)\\\\.(mp3|ogg).*', '\\\\1') AS p FROM soundfiles";
    $allSoundPaths = array();
    $set = static::fetchAll($q);
    if(count($set) > 0){
      foreach($set as $f){
        array_push($allSoundPaths, $f['p']);
      }
    }
    $q = <<<Q1
      SELECT 
      concat(L.FilePathPart, W.SoundFileWordIdentifierText) as P
      FROM Words_$n AS W, Languages_$n AS L
      UNION
      SELECT
      concat(
      L.FilePathPart,
      W.SoundFileWordIdentifierText,
      case
      	when T.AlternativeLexemIx > 1 and T.AlternativePhoneticRealisationIx = 0 then concat("_lex", T.AlternativeLexemIx)
      	when T.AlternativeLexemIx = 0 and T.AlternativePhoneticRealisationIx > 1 then concat("_pron", T.AlternativePhoneticRealisationIx)
      	when T.AlternativeLexemIx > 1 and T.AlternativePhoneticRealisationIx > 1 then concat("_lex", T.AlternativeLexemIx,"_pron", T.AlternativePhoneticRealisationIx)
      	else ""
      end
      ) as P
      FROM Transcriptions_$n AS T, Words_$n AS W, Languages_$n AS L
      WHERE
      L.LanguageIx = T.LanguageIx
      AND
      W.IxElicitation = T.IxElicitation
      AND
      W.IxMorphologicalInstance = T.IxMorphologicalInstance
      ORDER BY 1 ASC
Q1;

    $allValidPaths = array();
    $set = static::fetchAll($q);
    if(count($set) > 1){
      foreach($set as $p){
        array_push($allValidPaths, $p['P']);
      }
    }
    return array_diff($allValidPaths, $allSoundPaths);
  }
  
  /**
    @param $studyName String
    @return array of dicts
    Fetches general info about all sound file paths and FilePaths from DB that belong to a given study.
  */
  public static function checkFilePaths($studyName){

    $db  = Config::getConnection();
    $n   = $db->escape_string($studyName);

    // try to get a common study prefix for searching already uploaded sound files
    // - it only works if there's only one prefix
    $q   = "SELECT DISTINCT SUBSTRING_INDEX(FilePathPart,'_',1) FROM Languages_$n;";
    $set = static::fetchAll($q);
    $studyPrefix = "";
    if(count($set) == 1){
      $studyPrefix = array_pop($set[0]);
    }

    // get the number of words specified by study
    $q   = "SELECT count(*) FROM Words_$n;";
    $set = static::fetchAll($q);
    if(count($set) == 1){
      static::$checkFilePathsNumberOfWords = array_pop($set[0]);
    }

    // get all LanguageIx from Transcriptions Language table
    $allLgIxFromTranscriptions = array();
    $q   = "SELECT DISTINCT LanguageIx FROM Transcriptions_$n UNION SELECT DISTINCT LanguageIx FROM Languages_$n;";
    $set = static::fetchAll($q);
    if(count($set) > 0){
      foreach($set as $t){
        array_push($allLgIxFromTranscriptions, $t['LanguageIx']);
      }
    }

    // get all sound file directory names
    $q = "SELECT DISTINCT REGEXP_REPLACE(urls, '.*/(.*?)_\\\\d{3,}_.*?\\\\.(mp3|ogg).*', '\\\\1') AS p FROM soundfiles";
    $allSoundPathsOnDisk = array();
    $set = static::fetchAll($q);
    if(count($set) > 0){
      foreach($set as $f){
        array_push($allSoundPathsOnDisk, $f['p']);
      }
    }
    $soundPathsOnDisk = array();
    // filter if possible for a specific study
    if(strlen($studyPrefix) > 0) {
      foreach($allSoundPathsOnDisk as $s) {
        if(0 === strpos($s, $studyPrefix)) {
          array_push($soundPathsOnDisk, $s);
        }
      }
    }else{
      $soundPathsOnDisk = $allSoundPathsOnDisk;
    }

    // fetch general info and construct return array
    $q   = "SELECT L.FilePathPart AS F, L.LanguageIx AS I, L.ShortName AS N, count(*) AS C "
          ."FROM Transcriptions AS T, Languages_$n AS L "
          ."WHERE L.LanguageIx = T.LanguageIx AND LENGTH(TRIM(T.Phonetic)) AND T.LanguageIx IN "
          ."(SELECT DISTINCT LanguageIx FROM Languages_$n) AND T.IxElicitation IN "
          ."(SELECT DISTINCT IxElicitation FROM Words_$n)"
          ."GROUP BY T.study,T.LanguageIx "
          ."ORDER BY L.FilePathPart;";
    $set = static::fetchAll($q);
    if(count($set) > 0){
      foreach($set as $t){
        $data = array();
        $data['FilePathPart'] = $t['F'];
        $data['ShortName'] = $t['N'];
        $data['LanguageIx'] = $t['I'];
        $data['NumOfTrans'] = $t['C'];
        $allLgIxFromTranscriptions = array_diff($allLgIxFromTranscriptions, array($t['I']));
        if(in_array($t['F'], $soundPathsOnDisk)){
          $data['SoundPath'] = 'OK';
          if(strlen($studyPrefix) > 0){
            $soundPathsOnDisk = array_diff($soundPathsOnDisk, array($t['F']));
          }
        }else{
          $data['SoundPath'] = "missing";
        }
        array_push(static::$checkFilePaths, $data);
      }
    }
    // if common studyPrefix list all sound directory names which are not found in database
    if(strlen($studyPrefix) > 0) {
      // get all FilePathPart from all studies
      $allFilePathParts = array();
      foreach(DataProvider::getStudies() as $s){
        $q = "SELECT FilePathPart FROM Languages_$s WHERE FilePathPart LIKE '".$studyPrefix."%'";
        $set = static::fetchAll($q);
        foreach($set as $t){
          array_push($allFilePathParts, $t['FilePathPart']);
        }
      }
      foreach($soundPathsOnDisk as $s){
        if(!in_array($s, $allFilePathParts)){
          $data = array();
          $data['FilePathPart'] = "✕ – Sound Path on disk unknown for database";
          $data['ShortName'] = "";
          $data['LanguageIx'] = "";
          $data['NumOfTrans'] = "";
          $data['SoundPath'] = $s;
          array_push(static::$checkFilePaths, $data);
        }
      }
    }else{
      static::$checkFilePathsFurtherCheckOfDisk = "No common prefix for study “{$studyName}” found, thus a check for already uploaded sound paths is <b>not</b> possible.";
    }
    // check for unknown LanguageIx
    if(count($allLgIxFromTranscriptions) > 0){
      foreach($allLgIxFromTranscriptions as $i){
        $q = "SELECT COUNT(*) FROM Transcriptions_$n WHERE LanguageIx = {$i};";
        $numOfTransc = -1;
        $set = static::fetchAll($q);
        if(count($set) == 1){
          $numOfTransc = array_pop($set[0]);
        }
        $q = "SELECT FilePathPart, ShortName FROM Languages_$n WHERE LanguageIx = {$i};";
        $d = array();
        $set = static::fetchAll($q);
        if(count($set) == 1){
          $d['FilePathPart'] = $set[0]['FilePathPart'];
          $d['ShortName'] = $set[0]['ShortName'];
          if(in_array($d['FilePathPart'], $soundPathsOnDisk)){
            $d['SoundPath'] = "OK";
          }else{
            $d['SoundPath'] = "missing";
          }
        }else{
          if(0 === strpos(strval($i), "9999")){
            $d['FilePathPart'] = "✕ – LanguageIx unknown";
            $d['ShortName'] = "✕ – Dummy LanguageIx (SQL Upload)";
            $d['SoundPath'] = "✕ – LanguageIx unknown";
          }else{
            $d['FilePathPart'] = "✕ – LanguageIx unknown";
            $d['ShortName'] = "✕ – LanguageIx unknown";
            $d['SoundPath'] = "✕ – LanguageIx unknown";
          }
        }
        $data = array();
        $data['FilePathPart'] = $d['FilePathPart'];
        $data['ShortName'] = $d['ShortName'];
        $data['LanguageIx'] = $i;
        $data['NumOfTrans'] = $numOfTransc;
        $data['SoundPath'] = $d['SoundPath'];
        array_push(static::$checkFilePaths, $data);
      }
    }
    return static::$checkFilePaths;
  }
  /**
    @param $studyName, $lgix String
    @return array of dicts
    Fetches general info about a specific language.
  */
  public static function checkFilePathsForLanguageIx($studyName, $lgix){

    $db  = Config::getConnection();
    $n   = $db->escape_string($studyName);
    $q   = "SELECT * FROM Languages_$n WHERE LanguageIx = {$lgix}";
    $set = static::fetchAll($q);
    $isVanuatu = ($studyName == 'Vanuatu');
    $specIxElicArray = array();
    static::$checkFilePaths = array();
    if(count($set) == 1){
      static::$checkFilePathsForLanguageIx['ShortName'] = $set[0]['ShortName'];
      static::$checkFilePathsForLanguageIx['LanguageIx'] = $lgix;
      static::$checkFilePathsForLanguageIx['FilePathPart'] = $set[0]['FilePathPart'];
      static::$checkFilePathsForLanguageIx['specIxElic'] = 'hide';
      if($isVanuatu){
        static::$checkFilePathsForLanguageIx['specIxElic'] = '';
        $specIxElicArray = array(231 => 1,82 => 2,81 => 3,252 => 4,803 => 5,681 => 6,802 => 7,815 => 8,821 => 9,777 => 10,553 => 11,263 => 12,242 => 13,271 => 14,262 => 15,272 => 16,284 => 17,274 => 18,233 => 19,855 => 20,856 => 21,895 => 22,261 => 23,201 => 24,241 => 25,205 => 26,212 => 27,897 => 28,854 => 29,221 => 30,224 => 31,223 => 32,858 => 33,859 => 34,900 => 35,837 => 36,831 => 37,829 => 38,922 => 39,832 => 40,833 => 41,834 => 42,213 => 43,852 => 44,211 => 45,851 => 46,836 => 47,841 => 48,814 => 49,840 => 50,812 => 51,811 => 52,401 => 53,402 => 54,403 => 55,405 => 56,435 => 57,436 => 58,431 => 59,432 => 60,651 => 61,633 => 62,410 => 63,904 => 64,662 => 65,901 => 66,874 => 67,663 => 68,892 => 69,940 => 70,906 => 71,881 => 72,913 => 73,844 => 74,843 => 75,842 => 76,905 => 77,887 => 78,628 => 79,888 => 80,741 => 81,742 => 82,950 => 83,918 => 84,915 => 85,809 => 86,903 => 87,902 => 88,893 => 89,889 => 90,912 => 91,962 => 92,880 => 93,826 => 94,813 => 95,312 => 96,321 => 97,381 => 98,385 => 99,384 => 100,822 => 101,345 => 102,603 => 103,606 => 104,383 => 105,341 => 106,342 => 107,343 => 108,352 => 109,349 => 110,324 => 111,780 => 112,625 => 113,626 => 114,624 => 115,632 => 116,609 => 117,631 => 118,552 => 119,551 => 120,554 => 121,521 => 122,869 => 123,524 => 124,604 => 125,523 => 126,622 => 127,515 => 128,512 => 129,513 => 130,584 => 131,586 => 132,581 => 133,592 => 134,593 => 135,585 => 136,867 => 137,791 => 138,792 => 139,793 => 140,794 => 141,786 => 142,541 => 143,868 => 144,542 => 145,543 => 146,701 => 147,702 => 148,703 => 149,705 => 150,704 => 151,717 => 152,711 => 153,722 => 154,721 => 155,736 => 156,735 => 157,737 => 158,738 => 159,763 => 160,749 => 161,752 => 162,798 => 163,771 => 164,772 => 165,773 => 166,502 => 167,501 => 168,51 => 169,124 => 170,827 => 171,818 => 172,148 => 173,141 => 174,138 => 175,139 => 176,131 => 177,132 => 178,789 => 179,788 => 180,123 => 181,101 => 182,104 => 183,106 => 184,102 => 185,102 => 186,102 => 187,102 => 188,105 => 189,105 => 190,107 => 191,107 => 192,121 => 193,122 => 194,799 => 195,782 => 196,134 => 197,171 => 198,125 => 199,112 => 200,896 => 201,1 => 202,2 => 203,3 => 204,4 => 205,5 => 206,6 => 207,7 => 208,8 => 209,9 => 210,10 => 211,11 => 212,15 => 213,20 => 214,21 => 215);
      }
      static::$checkFilePathsForLanguageIx['ErrInfo'] = "";
    }else if(count($set) > 1) {
      static::$checkFilePathsForLanguageIx['LanguageIx'] = $lgix;
      static::$checkFilePathsForLanguageIx['ErrInfo'] = "There are more than one languages found for LanguageIx {$lgix}!";
      return;
    }else{
      static::$checkFilePathsForLanguageIx['ErrInfo'] = "Nothing found for LanguageIx {$lgix}!";
      return;
    }

    $filePathPart = $set[0]['FilePathPart'];
    static::$checkFilePathsForLanguageIx['FilePathPart'] = $filePathPart;
    // get all sound files for $filePathPart
    $q = "SELECT REGEXP_REPLACE(urls, '.*/(.*?)/(.*?)\\\\.(mp3|ogg).*', '\\\\2@\\\\1') AS p FROM soundfiles WHERE urls LIKE '%/$filePathPart%'";
    $soundPathsOnDisk = array();
    $soundPathsCdstarLinks = array();
    $set = static::fetchAll($q);
    if(count($set) > 0){
      foreach($set as $f){
        $arr = explode("@", $f['p']);
        array_push($soundPathsOnDisk, $arr[0]);
        $soundPathsCdstarLinks[$arr[0]] = $arr[1];
      }
    }

    $q   = "SELECT IxElicitation as I, SoundFileWordIdentifierText as S, FullRfcModernLg01 as F FROM Words_$n ORDER BY IxElicitation";
    $wordset = static::fetchAll($q);
    if(count($wordset) > 0){
      $q = "SELECT * FROM Transcriptions WHERE LanguageIx = {$lgix}";
      $transset = static::fetchAll($q);
      if(count($transset) > 0){
        foreach($wordset as $word){
          $alltransforword = array();
          foreach($transset as $t){
            if($t['IxElicitation'] == $word['I']){
              array_push($alltransforword, $t);
            }
          }
          foreach($alltransforword as $trans){
            $data = array();
            $lex_prefix = '';
            $pron_prefix = '';
            if($trans['AlternativeLexemIx'] > 0){
              $lex_prefix = '_lex'.$trans['AlternativeLexemIx'];
            }
            if($trans['AlternativePhoneticRealisationIx'] > 1){
              $pron_prefix = '_pron'.$trans['AlternativePhoneticRealisationIx'];
            }
            $sndFileIdText = $word['S'];
            if($trans['study'] != $studyName){
              $qq = "SELECT SoundFileWordIdentifierText as S FROM Words_{$trans['study']} WHERE IxElicitation = {$word['I']}";
              $sftset = static::fetchAll($qq);
              if(count($sftset) == 1){
                $sndFileIdText = $sftset[0]['S'];
              }
            }
            $data['SoundPath'] = $sndFileIdText.$lex_prefix.$pron_prefix;
            $data['pathok'] = 'X';
            $data['hasSound'] = '';
            $fileName = $filePathPart.$sndFileIdText.$lex_prefix.$pron_prefix;
            $data['SoundPathHref'] = '';
            if(in_array($fileName, $soundPathsOnDisk)){
              $data['pathok'] = 'OK';
              $data['hasSound'] = '▶︎';
              $soundPathsOnDisk = array_diff($soundPathsOnDisk, array($fileName));
              $data['SoundPathHref'] = "https://cdstar.shh.mpg.de/bitstreams/".$soundPathsCdstarLinks[$fileName]."/".$fileName.".mp3";
            }
            $data['Meaning'] = $word['F'];
            $data['IxElicitation'] = $word['I'];
            $data['IxEliciSpec'] = '';
            if($isVanuatu && array_key_exists($word['I'], $specIxElicArray)){
              $data['IxEliciSpec'] = $specIxElicArray[$word['I']];
            }
            $data['Phonetic'] = $trans['Phonetic'];
            $data['IxMorph'] = $trans['IxMorphologicalInstance'];
            $data['AltPhonReal'] = $trans['AlternativePhoneticRealisationIx'];
            $data['AltLexem'] = $trans['AlternativeLexemIx'];
            $data['AltSpell1'] = $trans['SpellingAltv1'];
            $data['AltSpell2'] = $trans['SpellingAltv2'];
            $data['Study'] = $trans['study'];
            array_push(static::$checkFilePaths, $data);
          }
        }
      } else {
        foreach($wordset as $word){
          $data = array();
          $lex_prefix = '';
          $pron_prefix = '';
          $sndFileIdText = $word['S'];
          $data['SoundPath'] = $sndFileIdText.$lex_prefix.$pron_prefix;
          $data['pathok'] = 'X';
          $data['hasSound'] = '';
          $fileName = $filePathPart.$sndFileIdText.$lex_prefix.$pron_prefix;
          $data['SoundPathHref'] = '';
          if(in_array($fileName, $soundPathsOnDisk)){
            $data['pathok'] = 'OK';
            $data['hasSound'] = '▶︎';
            $data['SoundPathHref'] = "https://cdstar.shh.mpg.de/bitstreams/".$soundPathsCdstarLinks[$fileName]."/".$fileName.".mp3";
            $soundPathsOnDisk = array_diff($soundPathsOnDisk, array($fileName));
          }
          $data['Meaning'] = $word['F'];
          $data['IxElicitation'] = $word['I'];
          $data['IxEliciSpec'] = '';
          if($isVanuatu && array_key_exists($word['I'], $specIxElicArray)){
            $data['IxEliciSpec'] = $specIxElicArray[$word['I']];
          }
          $data['Phonetic'] = '';
          $data['IxMorph'] = '';
          $data['AltPhonReal'] = '';
          $data['AltLexem'] = '';
          $data['AltSpell1'] = '';
          $data['AltSpell2'] = '';
          $data['Study'] = $studyName;
          array_push(static::$checkFilePaths, $data);
        }
      }
    }
    static::$checkFilePathsForLanguageIx['remainingSndFiles'] = array();
    if(count($soundPathsOnDisk)>0){
      static::$checkFilePathsForLanguageIx['remainingSndFiles'] = $soundPathsOnDisk;
    }
  }
  /**
    @param $studyName String
    @return dummyTranscriptions [{}]
    Output has the same form as that of static::getTranscriptions,
    but is for transcription entries that may not exist.
    static::getTranscriptions merges the outputs of this method
    into its return.
  */
  public static function getDummyTranscriptions($studyName, $soundFiles = array(), $transStudy1){
    $db = Config::getConnection();
    //Add dummy transcriptions:
    $dummies = array();

    //Fetching study related data: @Bibiko - unclear code -> issue #439
    // $q = "SELECT StudyIx, FamilyIx, IxElicitation, IxMorphologicalInstance, LanguageIx FROM Studies WHERE Name='$studyName' LIMIT 1";
    // $study = current(static::fetchAll($q));
    // if($study === false) return $dummies;

    //Handling languages without transcriptions:
    $q = "SELECT L.LanguageIx, W.IxElicitation, W.IxMorphologicalInstance, L.FilePathPart, W.SoundFileWordIdentifierText "
       . "FROM Languages_$studyName AS L CROSS JOIN Words_$studyName AS W "
       . "WHERE CONCAT(L.LanguageIx, W.IxElicitation, W.IxMorphologicalInstance) "
       . "NOT IN (SELECT CONCAT(LanguageIx, IxElicitation, IxMorphologicalInstance) FROM Transcriptions_$studyName)";
    $qs = static::fetchAll($q);
    //Handling resulting pairs:
    foreach($qs as $entry){
      $sfKey = $entry['LanguageIx'].$entry['IxElicitation'].$entry['IxMorphologicalInstance'].'0'.'0';

      //Returning saving found dummies: @Bibiko - unclear code -> issue #439
      // $q = "INSERT INTO Transcriptions_$studyName "
      //    . "(StudyIx, FamilyIx, IxElicitation, IxMorphologicalInstance, LanguageIx, RecordingMissing) "
      //    . "VALUES ({$study['StudyIx']},{$study['FamilyIx']},{$study['IxElicitation']},{$study['IxMorphologicalInstance']},{$study['LanguageIx']},$missing)";
      // $db->query($q);
      $transStudy = '';
      if(is_null($transStudy1)){
        $lgIx = (string)$entry['LanguageIx'];
        if(strlen($lgIx) > 4){
          $transStudy = 'A';
          if($lgIx[0] == '1'){
            if($lgIx[1] == '1'){
              if($lgIx[3] == '1'){
                $transStudy = 'Englishes';
              }else{
                $transStudy = 'Germanic';
              }
            }elseif($lgIx[1] == '2'){
              $transStudy = 'Romance';
            }elseif($lgIx[1] == '3'){
              $transStudy = 'Slavic';
            }elseif($lgIx[1] == '4'){
              $transStudy = 'Celtic';
            }
          }elseif($lgIx[0] == '2'){
            if($lgIx[1] == '8'){
              $transStudy = 'Mapudungun';
            }else{
              $transStudy = 'Andes';
            }
          }elseif($lgIx[0] == '3'){
            $transStudy = 'Brazil';
          }elseif($lgIx[0] == '4'){
            $transStudy = 'Vanuatu';
          }
        }
      }else{
        $transStudy = $transStudy1;
      }
      //Filtering
      if(!isset($soundFiles[$sfKey])) continue;
      //Adding to dummy list:
      array_push($dummies, array(
        'isDummy' => true
      , 'LanguageIx' => $entry['LanguageIx']
      , 'IxElicitation' => $entry['IxElicitation']
      , 'IxMorphologicalInstance' => $entry['IxMorphologicalInstance']
      , 'soundPaths' => json_decode($soundFiles[$sfKey])
      , 'transStudy' => $transStudy
      ));
    }
    return $dummies;
  }
  /**
    @param $studyId String CONCAT(StudyIx, FamilyIx)
    @return $defaults [ language => LanguageIx
                      , word => CONCAT(IxElicitation,IxMorpholigcalInstance)
                      , languages => [LanguageIx]
                      , words => [CONCAT(IxElicitation,IxMorpholigcalInstance)]
                      , excludeMap => [LanguageIx]]
    Given a studyId, this method fetches the default words and languages.
  */
  public static function getDefaults($studyId, $studyName){
    $db  = Config::getConnection();
    $sId = $db->escape_string($studyId);
    $studyName = $db->escape_string($studyName);
    $ret = array();
    //Single queries:
    foreach(array(
      //Default_Languages
      'language' => "SELECT LanguageIx FROM Default_Languages "
                  . "WHERE CONCAT(StudyIx, FamilyIx) "
                  . "LIKE (SELECT CONCAT(REPLACE($sId, 0, ''), '%')) "
                  . "LIMIT 1"
      //Default_Words
    , 'word'     => "SELECT IxElicitation, IxMorphologicalInstance FROM Default_Words "
                  . "WHERE CONCAT(StudyIx, FamilyIx) "
                  . "LIKE (SELECT CONCAT(REPLACE($sId, 0, ''), '%')) "
                  . "LIMIT 1"
    ) as $k => $q){
      $ret[$k] = $db->query($q)->fetch_assoc();
    }
    //Multiple queries:
    foreach(array(
      //Default_Multiple_Languages
      'languages_WdsXLgs' => "SELECT LanguageIx FROM Default_Multiple_Languages_WdsXLgs "
                           . "WHERE CONCAT(StudyIx, FamilyIx) "
                           . "LIKE (SELECT CONCAT(REPLACE($sId, 0, ''), '%'))"
    , 'languages_LgsXWds' => "SELECT LanguageIx FROM Default_Multiple_Languages_LgsXWds "
                           . "WHERE CONCAT(StudyIx, FamilyIx) "
                           . "LIKE (SELECT CONCAT(REPLACE($sId, 0, ''), '%'))"
      //Default_Multiple_Words
    , 'words_LgsXWds' => "SELECT IxElicitation FROM Default_Multiple_Words_LgsXWds_$studyName"
    , 'words_WdsXLgs' => "SELECT IxElicitation FROM Default_Multiple_Words_WdsXLgs_$studyName"
      //Default_Languages_Exclude_Map
    , 'excludeMap' => "SELECT LanguageIx FROM Default_Languages_Exclude_Map "
                    . "WHERE CONCAT(StudyIx, FamilyIx) "
                    . "LIKE (SELECT CONCAT(REPLACE($sId, 0, ''), '%'))"
    ) as $k => $q){
      $ret[$k] = static::fetchAll($q);
    }
    return $ret;
  }
  /***/
  public static function getLastImport(){
    $q = 'SELECT UNIX_TIMESTAMP(Time) FROM Edit_Imports ORDER BY TIME DESC LIMIT 1';
    $t = static::fetchAll($q);
    if(count($t) > 0){
      return current(current($t));
    }
    Config::error('Query failed in DataProvider::getLastImport()');
    return 0;
  }
  /***/
  public static function getStudyChunk($studyName){
    //Provide complete data for a single study:
    $sId = DataProvider::getStudyId($studyName);
    //Provide a lookup for sound files:
    $soundFiles = array();
    foreach(static::fetchAll("SELECT * FROM soundfiles") as $sf) {
      $soundFiles[$sf['LanguageIx'].$sf['IxElicitation'].$sf['IxMorphologicalInstance'].$sf['AlternativePhoneticRealisationIx'].$sf['AlternativeLexemIx']] = $sf['urls'];
    };
    //The representation that will be returned:
    return array(
      'study'               => DataProvider::getStudy($studyName)
    , 'families'            => DataProvider::getFamilies($sId)
    , 'regions'             => DataProvider::getRegions($studyName)
    , 'regionLanguages'     => DataProvider::getRegionLanguages($studyName)
    , 'languages'           => DataProvider::getLanguages($studyName)
    , 'words'               => DataProvider::getWords($studyName)
    , 'meaningGroupMembers' => DataProvider::getMeaningGroupMembers($sId)
    , 'transcriptions'      => DataProvider::getTranscriptions($studyName, $soundFiles)
    , 'defaults'            => DataProvider::getDefaults($sId, $studyName)
    );
  }
}
