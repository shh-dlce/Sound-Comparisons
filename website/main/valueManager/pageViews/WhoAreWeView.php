<?php
  require_once 'PageView.php';

  class WhoAreWeView extends PageView{
    
    public function getType(){return 'whoAreWe';}

    public function displayName(){
      die('WhoAreWeView:displayName() is not currently implemented!');
    }

    public function init(){
      return; // Nothing much to do.
    }
  }
?>
