<div id="ipaKeyboard" class="modal hide fade">
  <div class="modal-header">
    <button type="button" class="close" data-dismiss="modal">x</button>
    <?php echo $valueManager->getTranslator()->st('menu_words_open_ipaKeyboard').':'; ?>
    <span class="symbolDescription"></span>
  </div>
  <div class="modal-body" style="padding: 0px;"><?php
   require_once 'ipaKeyboard/ipaConsonants.php';
   require_once 'ipaKeyboard/ipaOthers.php';
   require_once 'ipaKeyboard/ipaTone.php';
   require_once 'ipaKeyboard/ipaVowels.php';
  ?></div>
  <div class="modal-footer">
    <button data-target="#ipaConsonants" class='btn disabled'>Consonants Main</button>
    <button data-target="#ipaOthers" class='btn'>Consonants Other</button>
    <button data-target="#ipaVowels" class='btn'>Vowels</button>
    <button data-target="#ipaTone" class='btn'>Tone</button>
  </div>
</div>
