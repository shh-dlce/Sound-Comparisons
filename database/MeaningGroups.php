<?php
require_once 'Translatable.php';
/**
  A MeaningGroup corresponds to an Entry from the MeaningGroups table.
*/
class MeaningGroup extends Translatable{
  //Inherited from Translatable:
  protected static function getTranslationPrefix(){
    return 'MeaningGroupsTranslationProvider';
  }
  /**
    Inherited from Translatable:
    Required option fields:
    tId, id
  */
  public static function getTranslation($options){
    return Translatable::getTrans($options['tId'], $this::getTranslationPrefix(), $options['id']);
  }
  /**
    Inherited from Translatable:
    Required option fields:
    tId
  */
  public function translate($options){
    return Translatable::getTrans($options['tId'], $this::getTranslationPrefix(), $this->id);
  }
  /**
    @return $name String
    Returns the Name of the MeaningGroup.
    The Name is translated if the ValueManager that the MeaningGroup
    was created with has a Translator that can translate it.
  */
  public function getName(){
    if($trans = $this->getValueManager()->getTranslator()->dt($this)){
      return $trans;
    }
    return $this->key;
  }
  /**
    @param [$s] Study
    @return $words Word[]
  */
  public function getWords($s = null){
    Stopwatch::start('MeaningGroup:getWords');
    $id  = $this->id;
    $sid = $this->v->getStudy()->getId();
    if($s)
      $sid = $s->getId();
    $q = "SELECT CONCAT(IxElicitation, IxMorphologicalInstance) "
       . "FROM MeaningGroupMembers "
       . "WHERE MeaningGroupIx = $id "
       . "AND CONCAT(StudyIx, FamilyIx) = (SELECT CONCAT(StudyIx, FamilyIx) FROM Studies WHERE Name = '$sid')"
       . "AND CONCAT(IxElicitation, IxMorphologicalInstance) = ANY("
         . "SELECT CONCAT(IxElicitation, IxMorphologicalInstance) FROM Words_$sid"
       . ") ORDER BY MeaningGroupMemberIx, IxElicitation ASC";
    $set = Config::getConnection()->query($q);
    $ret = array();
    while($r = $set->fetch_row()){
      array_push($ret, new WordFromId($this->v, $r[0]));
    }
    Stopwatch::stop('MeaningGroup:getWords');
    return $ret;
  }
}
/** Allowes to create a MeaningGroup from it's id. */
class MeaningGroupFromId extends MeaningGroup{
  /**
    @param $v ValueManager
    @param $id String
  */
  public function __construct($v, $id){
    $this->setup($v);
    $this->id = $id;
    $q = "SELECT Name FROM MeaningGroups WHERE MeaningGroupIx = $id";
    if($r = Config::getConnection()->query($q)->fetch_row()){
      $this->key = $r[0];
    }else Config::error("No name for MeaningGroup: $id.");
  }
}
/** Allowes to create a MeaningGroup from it's key. */
class MeaningGroupFromKey extends MeaningGroup{
  /**
    @param $v ValueManager
    @param $key String
  */
  public function __construct($v, $key){
    $this->setup($v);
    $this->key = $key;
    $q = "SELECT MeaningGroupIx FROM MeaningGroups WHERE Name = '$key'";
    if($r = Config::getConnection()->query($q)->fetch_row()){
      $this->id = $r[0];
    }else Config::error("No Id for MeaningGroup with name: $key.");
  }
}
?>