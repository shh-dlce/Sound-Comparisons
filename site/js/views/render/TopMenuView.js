/* global Date: true */
"use strict";
define(['backbone'], function(Backbone){
  /**
    The TopMenuView will be used by the Renderer.
    The TopMenuView will set it's own model to handle and smartly update it's render data.
  */
  return Backbone.View.extend({
    initialize: function(){
      this.model = {
        formats: ['mp3','ogg'],
        IPATooltipFontSize: ['100%', '125%', '150%'],
        ShowDataAs: [
          { val:'dots',   display:'dots' },
          { val:'labels', display:'labels' }
        ],
        ColoriseDataAs: [
          { val:'region',  display:'region' },
          { val:'cognate', display:'cognate'}
        ],
        SoundPlayMode: [
          { val:'hover', display:'hover', title:'' },
          { val:'click', display:'click', title:'' }
        ],
        isOnline: (window.location.protocol !== 'file:'),
        isOffline: (window.location.protocol === 'file:')
      };
      // init IPATooltipFontSize from stored cookies if given
      var nameFontSize = "IPATooltipFontSize=";
      var ca = document.cookie.split(';');
      var fontSize = '100%';
      for(var i = 0; i <ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) == ' ') {
              c = c.substring(1);
          }
          if (c.indexOf(nameFontSize) == 0) {
              fontSize = c.substring(nameFontSize.length, c.length);
              break;
          }
      }
      App.storage.IPATooltipFontSize = fontSize;
      // init ShowDataAs from stored cookies if given
      var nameShowDataAs = "ShowDataAs=";
      var ca = document.cookie.split(';');
      var showDataAs = 'labels';
      for(var i = 0; i <ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) == ' ') {
              c = c.substring(1);
          }
          if (c.indexOf(nameShowDataAs) == 0) {
              showDataAs = c.substring(nameShowDataAs.length, c.length);
              break;
          }
      }
      App.storage.ShowDataAs = showDataAs;
      // init ColoriseDataAs from stored cookies if given
      var nameColoriseDataAs = "ColoriseDataAs=";
      var ca = document.cookie.split(';');
      var coloriseDataAs = 'region';
      for(var i = 0; i <ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) == ' ') {
              c = c.substring(1);
          }
          if (c.indexOf(nameColoriseDataAs) == 0) {
              coloriseDataAs = c.substring(nameColoriseDataAs.length, c.length);
              break;
          }
      }
      App.storage.ColoriseDataAs = coloriseDataAs;
      // init SoundPlayMode from stored cookies if given
      var namePlayMode = "SoundPlayMode=";
      var ca = document.cookie.split(';');
      var soundPlayMode = 'hover';
      for(var i = 0; i <ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) == ' ') {
              c = c.substring(1);
          }
          if (c.indexOf(namePlayMode) == 0) {
              soundPlayMode = c.substring(namePlayMode.length, c.length);
              break;
          }
      }
      App.storage.SoundPlayMode = soundPlayMode;
      App.soundPlayOption.set({playMode: soundPlayMode});
    }
    /**
      Function to call non /^update.+/ methods that are necessary for the model, and to setup their callbacks.
    */
  , activate: function(){
      //Setting callbacks to update model:
      App.translationStorage.on('change:translationId', this.buildStatic, this);
      //Building statics the first time:
      this.buildStatic();
    }
    /**
      Overwrites the current model with the given one performing a deep merge.
    */
  , setModel: function(m){
      this.model = $.extend(true, this.model, m);
    }
    /**
      Update the citation info based on current study.
    */
  , updateCitations: function(){
      var d = new Date();
      var curDate = d.toISOString().split("T").shift();
      var currentStudy = App.study.getId();
      this.model.citationStudy = currentStudy;
      if (currentStudy == "Slavic") {
        this.model.citationStudy += "-&-Baltic";
      }
      this.model.citationText = "";
      this.model.citationBibtex = "";

      if (currentStudy == "Englishes"){
        this.model.citationText = '\
Maguire, Warren & Paul Heggarty. 2019. Sound Comparisons: Englishes. Accents of English from around the World.\
 (Available online at https://soundcomparisons.com/Englishes, Accessed on \
' + curDate + ".)";
        this.model.citationBibtex = '\
@misc{maguire_sound_2019,\n\
	title = {Sound {Comparisons}:  {Englishes}},\n\
	url = {https://soundcomparisons.com/Englishes},\n\
	journal = {Sound Comparisons:  Englishes.  Accents of English from around the World},\n\
	author = {Maguire, Warren and Heggarty, Paul},\n\
	year = {2019},\n\
	keywords = {Dialects, English Language, Phonetics, Recordings, Sound Comparisons, Transcriptions}\n\
}';
      }
      else if (currentStudy == "Germanic"){
        this.model.citationText = '\
Paschen, Ludger, Paul Heggarty, Warren Maguire, Jan Michalsky, Darja Dërmaku-Appelganz & Matthew Boutilier. 2019. Sound Comparisons: Germanic.\
 (Available online at https://soundcomparisons.com/Germanic, Accessed on \
' + curDate + ".)";
        this.model.citationBibtex = '\
@misc{paschen_sound_2019,\n\
	title = {Sound {Comparisons}:  {Germanic}},\n\
	url = {https://soundcomparisons.com/Germanic},\n\
	journal = {Sound Comparisons:  A New Resource for Exploring Phonetic Diversity across Language Families of the World},\n\
	author = {Paschen, Ludger and Heggarty, Paul and Maguire, Warren and Michalsky, Jan and Dërmaku-Appelganz, Darja and Boutilier, Matthew},\n\
	year = {2019},\n\
	keywords = {Dialects, Germanic Languages, Phonetics, Recordings, Sound Comparisons, Transcriptions}\n\
}';
      }
      else if (currentStudy == "Celtic"){
        this.model.citationText = '\
Anderson, Cormac & Paul Heggarty. 2019. Sound Comparisons: Celtic.\
 (Available online at https://soundcomparisons.com/Celtic, Accessed on \
' + curDate + ".)";
        this.model.citationBibtex = '\
@misc{anderson_sound_2019,\n\
	title = {Sound {Comparisons}:  {Celtic}},\n\
	url = {https://soundcomparisons.com/Celtic},\n\
	author = {Anderson, Cormac and Heggarty, Paul},\n\
	year = {2019},\n\
	keywords = {Celtic languages, Dialects, Phonetics, Recordings, Sound Comparisons, Transcriptions}\n\
}';
      }
      else if (currentStudy == "Andes"){
        this.model.citationText = '\
Heggarty, Paul & Lewis C. Lawyer. 2019. Sound Comparisons: Andes.\
 (Available online at https://soundcomparisons.com/Andes, Accessed on \
' + curDate + ".)";
        this.model.citationBibtex = '\
@misc{heggarty_sound_2019,\n\
	title = {Sound {Comparisons}:  {Andes}},\n\
	url = {https://soundcomparisons.com/Andes},\n\
	journal = {Sound Comparisons:  A New Resource for Exploring Phonetic Diversity across Language Families of the World},\n\
	author = {Heggarty, Paul and Lawyer, Lewis C.},\n\
	year = {2019},\n\
	keywords = {Aymara, Chipaya, Dialects, Indigenous languages of the Andes, Kichwa, Mapudungun, Phonetics, Quechua, Quichua, Recordings, Sound Comparisons, Transcriptions, Uro, Uru}\n\
}';
      }
      else if (currentStudy == "Vanuatu"){
        this.model.citationText = '\
Shimelman, Aviva, Paul Heggarty, Giovanni Abete, Laura Wägerle, Darja Dërmaku-Appelganz & Mary Walworth. 2019. Sound Comparisons: Malakula.\
 (Available online at https://soundcomparisons.com/Vanuatu, Accessed on \
' + curDate + ".)";
        this.model.citationBibtex = '\
@misc{shimelman_sound_2019,\n\
	title = {Sound {Comparisons}:  {Vanuatu}},\n\
	url = {https://soundcomparisons.com/Vanuatu},\n\
	author = {Shimelman, Aviva and Heggarty, Paul and Abete, Giovanni and Wägerle, Laura and Dërmaku-Appelganz, Darja and Walworth, Mary},\n\
	year = {2019},\n\
	keywords = {Dialects, Malakula, Oceanic languages, Phonetics, Recordings, Sound Comparisons, Transcriptions, Vanuatu}\n\
}';
      }
      else if (currentStudy == "Romance"){
        this.model.citationText = '\
Heggarty, Paul & Giovanni Abete. 2019. Sound Comparisons: Romance.\
 (Available online at https://soundcomparisons.com/Vanuatu, Accessed on \
' + curDate + ".)";
        this.model.citationBibtex = '\
@misc{heggarty_sound_2019-1,\n\
	title = {Sound {Comparisons}:  {Romance}},\n\
	url = {htpps://soundcomparisons.com/Romance},\n\
	author = {Heggarty, Paul and Abete, Giovanni},\n\
	year = {2019},\n\
	keywords = {Dialects, Phonetics, Recordings, Romance languages, Sound Comparisons, Transcriptions}\n\
}';
      }
      else if (currentStudy == "Slavic"){
        this.model.citationText = '\
Jocz, Lechoslaw & Paul Heggarty. 2019. Sound Comparisons: Slavic & Baltic.\
 (Available online at https://soundcomparisons.com/Slavic, Accessed on \
' + curDate + ".)";
        this.model.citationBibtex = '\
@misc{jocz_sound_2019,\n\
	title = {Sound {Comparisons}:  {Slavic} \\& {Baltic}},\n\
	url = {https://soundcomparisons.com/Slavic},\n\
	journal = {Sound Comparisons:  Slavic \\& Baltic},\n\
	author = {Jocz, Lechosław and Heggarty, Paul},\n\
	year = {2019},\n\
	keywords = {Baltic languages, Dialects, Phonetics, Recordings, Slavic languages, Sound Comparisons, Transcriptions}\n\
}';
      }
      else if (currentStudy == "Mapudungun"){
        this.model.citationText = '\
Sadowsky, Scott, María José Aninao & Paul Heggarty. 2019. Sound Comparisons: Mapudungun.\
 (Available online at https://soundcomparisons.com/Mapudungun, Accessed on \
' + curDate + ".)";
        this.model.citationBibtex = '\
@misc{aninao_sound_2019,\n\
	title = {Sound {Comparisons}:  {Mapudungun}},\n\
	url = {https://soundcomparisons.com/Mapudungun},\n\
	author = {Aninao, María José and Sadowsky, Scott and Heggarty, Paul},\n\
	year = {2019},\n\
	keywords = {Araucanian, Dialects, Mapuche, Mapudungun, Phonetics, Recordings, Sound Comparisons, Transcriptions}\n\
}';
      }
      else if (currentStudy == "Europe"){
        this.model.citationText = '\
Heggarty, Paul, Giovanni Abete, Cormac Anderson, Ludger Paschen, Lechosław Jocz, Warren Maguire & Hans-Jörg Bibiko. (2019).\
 Sound Comparisons: Europe.\
 (Available online at https://soundcomparisons.com/Europe, Accessed on \
' + curDate + ".)";
        this.model.citationBibtex = '\
@misc{heggarty_sound_2019-2,\n\
	title = {Sound {Comparisons}:  {Europe}},\n\
	url = {https://soundcomparisons.com/Europe},\n\
	author = {Heggarty, Paul and Abete, Giovanni and Anderson, Cormac and Paschen, Ludger and Jocz, Lechosław and Maguire, Warren and Bibiko, Hans-Jörg},\n\
	year = {2019},\n\
	keywords = {Dialects, European languages, Phonetics, Recordings, Sound Comparisons, Transcriptions}\n\
}';
      }
      else if (currentStudy == "Brazil"){
        this.model.citationText = '\
Silva, Ariel P.C., Laura Wägerle, Paul Heggarty & Ana Suelly Arruda Câmara Cabral. 2019. Sound Comparisons: Brazil.\
 (Available online at https://soundcomparisons.com/Brazil, Accessed on \
' + curDate + ".)";
        this.model.citationBibtex = '\
@misc{silva_sound_2019,\n\
	title = {Sound {Comparisons}:  {Brazil}},\n\
	url = {https://soundcomparisons.com/Brazil},\n\
	author = {Silva, Ariel Pheula do Couto e and Wägerle, Laura and Heggarty, Paul and Cabral, Ana Suelly Arruda Câmara},\n\
	year = {2019},\n\
	keywords = {Brazil, Dialects, Indigenous languages of Brazil, Phonetics, Recordings, Sound Comparisons, Transcriptions}\n\
}';
      }
  }
    /**
      Builds the static translations for the model.
    */
  , buildStatic: function(){
      var staticT = App.translationStorage.translateStatic({
        logoTitle:          'website_logo_hover'
      , csvTitle:           'topmenu_download_csv'
      , tsvTitle:           'topmenu_download_tsv'
      , sndTitle:           'topmenu_download_zip'
      , cogTitle:           'topmenu_download_cogTitle'
      , settingTitle:       'topmenu_settings_title'
      , wordByWord:         'topmenu_download_wordByWord'
      , format:             'topmenu_download_format'
      , ipaTooltipFontSize: 'topmenu_settings_ipaFontSizeMap'
      , showDataAs:         'topmenu_settings_showDataAs'
      , showDataAsDots:     'topmenu_settings_showDataAsDots'
      , showDataAsLabels:   'topmenu_settings_showDataAsLabels'
      , coloriseDataAs:     'topmenu_settings_coloriseDataAs'
      , coloriseDataAsRegion:     'topmenu_settings_coloriseDataAsRegion'
      , coloriseDataAsCognate:    'topmenu_settings_coloriseDataAsCognate'
      , soundClickTitle:    'topmenu_soundoptions_tooltip'
      , soundHoverTitle:    'topmenu_soundoptions_hover'
      , soundPlayMode:      'topmenu_settings_playmode'
      , soundPlayModeClick: 'topmenu_settings_playmodeclick'
      , licenceTooltip:     'topmenu_about_licencetooltip'
      , licenceText:        'topmenu_about_licencetext'
      , licenceTextHref:    'topmenu_about_licencetext_href'
      , fundingText:        'topmenu_about_fundingtext'
      , fundingTextHref:    'topmenu_about_fundingtext_href'
      , citeTooltip:        'topmenu_about_citetooltip'
      , soundPlayModeHover: 'topmenu_settings_playmodehover'
      , createShortLink:    'topmenu_createShortLink'
      , viewContributors:   'topmenu_about_whoarewe'
      , statisticsText:     'topmenu_about_statisticstext'
      , numOfLangs:         'topmenu_about_numOfLangs'
      , numOfWords:         'topmenu_about_numOfWords'
      , numOfTrans:         'topmenu_about_numOfTrans'
      , numOfSounds:        'topmenu_about_numOfSounds'
      , numOfTransSounds:   'topmenu_about_numOfTransSounds'
      });
      this.setModel(staticT);
      this.model.ShowDataAs[0].display = this.model.showDataAsDots;
      this.model.ShowDataAs[1].display = this.model.showDataAsLabels;
      this.model.ColoriseDataAs[0].display = this.model.coloriseDataAsRegion;
      this.model.ColoriseDataAs[1].display = this.model.coloriseDataAsCognate;
      this.model.SoundPlayMode[0].display = this.model.soundPlayModeHover;
      this.model.SoundPlayMode[1].display = this.model.soundPlayModeClick;
      this.model.SoundPlayMode[0].title = this.model.soundHoverTitle;
      this.model.SoundPlayMode[1].title = this.model.soundClickTitle;

      var d = new Date();
      var curDate = d.toISOString().split("T").shift();

      this.model.citationTextHome = '\
<h5><i>The Sound Comparisons Website</i></h5>\
Heggarty, Paul, Aviva Shimelman, Giovanni Abete, Cormac Anderson, Scott Sadowsky, Ludger Paschen, Warren Maguire, Lechoslaw Jocz, María José Aninao, Laura Wägerle, Darja Dërmaku-Appelganz, Ariel Pheula do Couto e Silva, Lewis C. Lawyer, Jan Michalsky, Ana Suelly Arruda Câmara Cabral, Mary Walworth, Ezequiel Koile, Jakob Runge & Hans-Jörg Bibiko.<br />2019. Sound Comparisons: Exploring Diversity in Phonetics across Language Families.<br />\
 (Available online at https://soundcomparisons.com, Accessed on \
' + curDate + ".)<br /><br />" + '\
<h5><i>The Sound Comparisons Launch Paper</i></h5>\
Heggarty, Paul, Aviva Shimelman, Giovanni Abete, Cormac Anderson, Scott Sadowsky, Ludger Paschen, Warren Maguire, Lechoslaw Jocz, María José Aninao, Laura Wägerle, Darja Dërmaku-Appelganz, Ariel Pheula do Couto e Silva, Lewis C. Lawyer, Ana Suelly Arruda Câmara Cabral, Mary Walworth, Jan Michalsky, Ezequiel Koile, Jakob Runge & Hans-Jörg Bibiko.<br />\
2019.  Sound Comparisons:  A new resource for exploring phonetic diversity across language families of the world.<br />\
In: Calhoun, S., P. Escudero, M. Tabain, & P. Warren (eds)<br />\
Proceedings of the International Congress of Phonetic Sciences 2019. Canberra, Australia: Australasian Speech Science and Technology Association Inc.<br />\
https://icphs2019.org/icphs2019-fullpapers/pdf/full-paper_490.pdf\
';
      this.model.citationBibtexHome = '\
@misc{heggarty_sound_2019,\n\
	title = {Sound {Comparisons}:  {Exploring} {Diversity} in {Phonetics} across {Language} {Families}},\n\
	url = {https://soundcomparisons.com},\n\
	journal = {Sound Comparisons:  Exploring Diversity in Phonetics across Language Families},\n\
	author = {Heggarty, Paul and Shimelman, Aviva and Abete, Giovanni and Anderson, Cormac and Sadowsky, Scott and Paschen, Ludger and Maguire, Warren and Jocz, Lechoslaw and Aninao, María José and Wägerle, Laura and Dërmaku-Appelganz, Darja and Silva, Ariel Pheula do Couto e and Lawyer, Lewis C. and Michalsky, Jan and Cabral, Ana Suelly Arruda Câmara and Walworth, Mary and Koile, Ezequiel and Runge, Jakob and Bibiko, Hans-Jörg},\n\
	year = {2019},\n\
	keywords = {Dialects, Phonetics, Recordings, Sound Comparisons, Transcriptions}\n\
}\
\n\n\
@inproceedings{heggarty_sound_2019,\n\
	address = {Canberra, Australia},\n\
	title = {Sound {Comparisons}: {A} new online database and resource for researching phonetic diversity},\n\
	isbn = {978-0-646-80069-1},\n\
	url = {https://icphs2019.org/icphs2019-fullpapers/pdf/full-paper_490.pdf},\n\
	booktitle = {Proceedings of the 19th {International} {Congress} of {Phonetic} {Sciences}},\n\
	publisher = {Australasian Speech Science and Technology Association},\n\
	author = {Heggarty, Paul and Shimelman, Aviva and Abete, Giovanni and Anderson, Cormac and Sadowsky, Scott and Paschen, Ludger and Maguire, Warren and Jocz, Lechoslaw and Aninao, María José and Wägerle, Laura and Dërmaku-Appelganz, Darja and Silva, Ariel Pheula do Couto e and Lawyer, Lewis C. and Michalsky, Jan and Cabral, Ana Suelly Arruda Câmara and Walworth, Mary and Koile, Ezequiel and Runge, Jakob and Bibiko, Hans-Jörg},\n\
	month = aug,\n\
	year = {2019},\n\
	keywords = {Dialects, Phonetics, Recordings, Sound Comparisons, Transcriptions},\n\
	pages = {280--284}\n\
}\
';
    }
    /**
      Generates the study part of the TopMenu.
      A name == "--" will be marked as 'divider'.
    */
  , updateStudy: function(){
      var data = {
        currentStudyName: App.study.getName()
      };
      data.studies = _.map(App.study.getAllIds(), function(n){
        var name = App.study.getName(n)
          , link = App.study.getLink(n);
        return {
          currentStudy: name === data.currentStudyName
        , isDivider: name === "--"
        , link: 'href="'+link+'"'
        , studyName: name
        };
      }, this);
      this.setModel(data);
      this.updateCitations();

      var valid_word_transids = [];
      var valid_lang_ids = [];
      // how many languages in study
      this.model.num_langs = App.languageCollection.length;
      App.languageCollection.each(function(l){
        valid_lang_ids.push(l.getId());
      });
      // how many words in study
      this.model.num_words = App.wordCollection.length;
      App.wordCollection.each(function(w){
        valid_lang_ids.forEach(function(l){
          valid_word_transids.push(l + w.getId());
      })});
      // how many transcriptions in study
      var pcnt = 0;
      var pscnt = 0;
      var scnt = 0;
      var hasTr = false;
      var not_ignore_trans = App.study.getName() !== 'MixeZoque'; // temporary
      _.forEach(window.App.dataStorage.get('study').transcriptions, function(t, k){
          if(valid_word_transids.includes(k) & t !== null){
            var p = _.clone(t["Phonetic"]);
            var s = _.clone(t["soundPaths"]);
            if(!_.isArray(p)) p = [p];
            if(!_.isArray(s[0])){
              s = [s];
            }
            for(var i = 0; i < p.length; i++){
              hasTr = false
              if(not_ignore_trans && typeof p[i] !== 'undefined'){
                if(p[i].trim() !== '' & !(_.some(['-..','**','.. ','--','..','...','…'],
                                            function(s){return p[i].trim() === s;}))){
                  pcnt += 1;
                  hasTr = true;
                }
              }
              if(typeof s[i] !== 'undefined'){
                if(s[i][0].length > 0){
                  scnt += 1;
                  if (hasTr){
                    pscnt += 1;
                  }
                }
              }
            }
          }
      })
      this.model.num_trans = pcnt;
      this.model.num_sounds = scnt;
      this.model.num_trsounds = pscnt;
    }
    /**
      Generates the PageViews part of the TopMenu.
    */
  , updatePageViews: function(){
      var hovers = App.translationStorage.translateStatic({
        m:  'topmenu_views_mapview_hover'
      , w:  'topmenu_views_wordview_hover'
      , l:  'topmenu_views_languageview_hover'
      , lw: 'topmenu_views_multiview_hover'
      , wl: 'topmenu_views_multitransposed_hover'
      });
      var names = App.translationStorage.translateStatic({
        m:  'topmenu_views_mapview'
      , w:  'topmenu_views_wordview'
      , l:  'topmenu_views_languageview'
      , lw: 'topmenu_views_multiview'
      , wl: 'topmenu_views_multitransposed'
      });
      var images = {
        m:  'maps.png'
      , w:  '1w.png'
      , l:  '1l.png'
      , lw: 'lw.png'
      , wl: 'wl.png'
      };
      var getDefaults = function(pvk){
        return {
          words:     App.wordCollection.getSelected(pvk)
        , languages: App.languageCollection.getSelected(pvk)
        };
      };
      var links = {
        m:  App.router.linkMapView()
      , w:  App.router.linkWordView()
      , l:  App.router.linkLanguageView()
      , lw: App.router.linkLanguageWordView(getDefaults('languagesXwords'))
      , wl: App.router.linkWordLanguageView(getDefaults('wordsXlanguages'))
      };
      this.setModel({pageViews: _.map(_.keys(names), function(key){
        return {
          link:    'href="'+links[key]+'"'
        , content: this.tColor(key, names[key])
        , title:   hovers[key]
        , img:     images[key]
        , active:  App.pageState.isPageView(key)};
      }, this)});
    }
    /**
      Generates the translations part of the TopMenu.
    */
  , updateTranslations: function(){
      this.setModel({
        currentFlag: App.translationStorage.getFlag()
      , otherTranslations: _.chain(App.translationStorage.getOthers()).map(function(tId){
          return {
            tId: tId
          , flag: this.getFlag(tId)
          , name: this.getName(tId)
          };
        }, App.translationStorage).sortBy('name').value()
      });
    }
    /**
      Generates the about/info links part of the TopMenu.
    */
  , updateEntries: function(){
      var entries = App.translationStorage.translateStatic([
        { link:  'topmenu_about_furtherinfo_href'
        , about: 'topmenu_about_furtherinfo'}
      , { link:  'topmenu_about_research_href'
        , about: 'topmenu_about_research'}
      , { link:  'topmenu_about_contact_href'
        , about: 'topmenu_about_contact'}
      , { link:  'topmenu_about_fundingtext_href'
        , about: 'topmenu_about_fundingtext'}
      , { link:  'topmenu_about_imprint_href'
        , about: 'topmenu_about_imprint'}
      , { link:  'topmenu_about_privacypolicy_href'
        , about: 'topmenu_about_privacypolicy'}
      ]);
      _.each(entries, function(e){
        e.target = (e.link.match(/#/)) ? '' : 'target="_blank"';
        e.link = 'href="'+e.link+'"';
      });
      this.setModel({aboutEntries: entries});
    }
    /**
      Reflects the current SoundPlayOption:
    */
  , updatePlayOption: function(){
      this.setModel({soundOptionHover: App.soundPlayOption.playOnHover()});
    }
    /***/
  , updateCsvLink: function(){
      var s = App.study.getId(), ls = [], ws = [];
      if(App.pageState.isMultiView()){
        ls = App.languageCollection.getSelected();
        ws = App.wordCollection.getSelected();
      }else if(App.pageState.isPageView('l')){
        ls = [App.languageCollection.getChoice()];
        ws = App.wordCollection.models;
      }else if(_.any(['m','w'], App.pageState.isPageView, App.pageState)){
        ls = App.languageCollection.models;
        ws = [App.wordCollection.getChoice()];
      }
      var go = function(xs){return _.map(xs, function(x){return x.getId();}).join(',');};
      var w = go(ws), l = go(ls);
      this.setModel({csvLink: 'export/csv?study='+s+'&languages='+l+'&words='+w});
      this.setModel({tsvLink: 'export/csv?study='+s+'&languages='+l+'&words='+w+'&tsv'});
    }
    /***/
  , render: function(){
      this.$el.html(App.templateStorage.render('TopMenu', {TopMenu: this.model}));
      //The wordByWord option:
      var wordByWord = this.$('#wordByWordCheckbox').click(function(){
        App.pageState.set({wordByWord: wordByWord.is(':checked')});
        App.views.renderer.render();
      });
      if(App.pageState.get('wordByWord')){
        wordByWord.prop('checked', true);
      }
      //Download sounds:
      var sndBtn = this.$('a.soundFile').click(function(){
        App.soundDownloader.download().done(function(msg){
          sndBtn.removeClass('btn-danger');
          window.saveAs(msg.data, msg.name);
        }).fail(function(f){
          var msg = 'An error occured when trying to download sound files:\n'+f;
          console.log(msg);
          window.alert(msg);
        });
        sndBtn.addClass('btn-danger');
      });
      //The wordByWordFormat selection:
      var radios = this.$('input[name="wordByWordFormat"]').click(function(){
        var val = $(this).val();
        if(val !== App.pageState.get('wordByWordFormat')){
          App.pageState.set({wordByWordFormat: val});
          App.views.renderer.render();
        }
      }).each(function(){
        var t = $(this), val = t.val();
        if(val === App.pageState.get('wordByWordFormat')){
          t.prop('checked', true);
        }
      });
      //The IPATooltipFontSize selection:
      var radios = this.$('input[name="IPATooltipFontSize"]').click(function(){
        var val = $(this).val();
        if(val !== App.storage.IPATooltipFontSize){
          App.storage.IPATooltipFontSize = val;
          // save font size as cookie
          var d = new Date();
          d.setTime(d.getTime() + (365*24*60*60*1000));
          var expires = "expires="+ d.toUTCString();
          document.cookie = 'IPATooltipFontSize='+ val + ";" + expires + ";path=/";
          App.views.renderer.render();
        }
      }).each(function(){
        var t = $(this), val = t.val();
        if(val === App.storage.IPATooltipFontSize){
          t.prop('checked', true);
        }
      });
      //The ShowDataAs selection:
      var radios = this.$('input[name="ShowDataAs"]').click(function(){
        var val = $(this).val();
        if(val !== App.storage.ShowDataAs){
          App.storage.ShowDataAs = val;
          // save font size as cookie
          var d = new Date();
          d.setTime(d.getTime() + (365*24*60*60*1000));
          var expires = "expires="+ d.toUTCString();
          document.cookie = 'ShowDataAs='+ val + ";" + expires + ";path=/";
          App.views.renderer.render();
        }
      }).each(function(){
        var t = $(this), val = t.val();
        if(val === App.storage.ShowDataAs){
          t.prop('checked', true);
        }
      });
      //The ColoriseDataAs selection:
      var radios = this.$('input[name="ColoriseDataAs"]').click(function(){
        var val = $(this).val();
        if(val !== App.storage.ColoriseDataAs){
          App.storage.ColoriseDataAs = val;
          // save font size as cookie
          var d = new Date();
          d.setTime(d.getTime() + (365*24*60*60*1000));
          var expires = "expires="+ d.toUTCString();
          document.cookie = 'ColoriseDataAs='+ val + ";" + expires + ";path=/";
          App.views.renderer.render();
        }
      }).each(function(){
        var t = $(this), val = t.val();
        if(val === App.storage.ColoriseDataAs){
          t.prop('checked', true);
        }
      });
      //The SoundPlayMode selection:
      var radios = this.$('input[name="SoundPlayMode"]').click(function(){
        var val = $(this).val();
        if(val !== App.storage.SoundPlayMode){
          App.soundPlayOption.set({playMode: val});
          App.storage.SoundPlayMode = val;
          var d = new Date();
          d.setTime(d.getTime() + (365*24*60*60*1000));
          var expires = "expires="+ d.toUTCString();
          document.cookie = 'SoundPlayMode='+ val + ";" + expires + ";path=/";
          App.views.renderer.render();
        }
      }).each(function(){
        var t = $(this), val = t.val();
        if(val === App.storage.SoundPlayMode){
          t.prop('checked', true);
        }
      });
      //The shortLink button:
      var shortLink = this.$('#createShortLink').click(function(){
        App.dataStorage.addShortLink().done(function(data){
          App.views.shortLinkModalView.render(data);
        }).fail(function(){
          console.log('User could not create short link!');
          var msg = App.translationStorage.translateStatic('shortLinkCreationFailed');
          window.alert(msg);
        });
      });
      //The Contributor button:
      this.$('#openContributors').click(function(){
        App.router.navigate('#/Contributors');
      });
    }
    /**
      Helper method to color strings for updatePageViews.
      @param mode is expected to be an enum like string
      @param content is expected to be a string.
      @return content html string
    */
  , tColor: function(mode, content){
      //Sanitizing:
      if(!_.isString(content)) content = '';
      //Data to operate on:
      var modes = {
        m:  'color-map'
      , w:  'color-word'
      , l:  'color-language'
      , lw: {c1: 'color-language', c2: 'color-word'}
      , wl: {c1: 'color-word', c2: 'color-language'}
      };
      var color = modes[mode];
      if(_.isString(color)){
        return '<div class="inline '+color+'">'+content+'</div>';
      }else if(_.isObject(color)){
        var matches = content.match(/^(.*) [Xx×] (.*)$/);
        if(matches){
          var m1 = matches[1], m2 = matches[2];
          return '<div class="inline '+color.c1+'">'+m1+'</div>×<div class="inline '+color.c2+'">'+m2+'</div>';
        }
        return '<div class="inline color-map">'+content+'</div>';
      }
      console.log('Unexpected behaviour in TopMenuView.tColor() with mode: '+mode);
      return content;
    }
  });
});
