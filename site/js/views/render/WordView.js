"use strict";
define(['views/render/SubView'], function(SubView){
  return SubView.extend({
    initialize: function(){
      this.model = {};
      this.currentFocus = -1;
      //Connecting to the router
      App.router.on('route:wordView', this.route, this);
    }
    /**
      Method to make it possible to check what kind of PageView this Backbone.View is.
    */
  , getKey: function(){return 'word';}
    /**
      autocompletion for words
    */
  , autocompleteWord: function(inp, type){
      var pressedKey = event.which || event.keyCode;
      var a, b, i, val = inp.value;
      var arr = [];
      var spLang;
      if (type == 'w'){
        spLang = App.pageState.getSpLang();
        App.wordCollection.each(function(w){
          var text = w.getNameFor(spLang);
          if(_.isArray(text)){
            _.each(text, function(t){ arr.push({n:t, w:w}); }, this);
          }else{
            arr.push({n:text, w:w});
          }
        });
      }else if (type == 'l') {
        spLang = App.languageCollection.getChoice();
        App.languageCollection.each(function(l){
          var text = l.getSuperscript(l.getLongName());
          if(_.isArray(text)){
            _.each(text, function(t){ arr.push({n:t, l:l}); }, this);
          }else{
            arr.push({n:text, l:l});
          }
        });
      }else{
        return false;
      }
      var x = document.getElementById(inp.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (pressedKey == 40) { //down
        this.currentFocus++;
        this.addActive(x);
        event.preventDefault();
        return true;
      } else if (pressedKey == 38) { //up
        this.currentFocus--;
        this.addActive(x);
        event.preventDefault();
        return true;
      } else if (pressedKey == 27) { //esc
        this.currentFocus = -1;
        this.closeAllLists();
        if (type == 'w'){
          inp.value = document.getElementById("word_choice_default").value;
        }else if (type == 'l'){
          inp.value = document.getElementById("lang_choice_default").value;
        }
        inp.blur();
        event.preventDefault();
        return true;
      } else if (pressedKey == 13) { //enter
        event.preventDefault();
        if (this.currentFocus > -1) {
          if (x) x[this.currentFocus].click();
          this.currentFocus = -1;
        }else{
          for (i = 0; i < arr.length; i++) {
            if (arr[i].n.toUpperCase() == val.toUpperCase()) {
              var url;
              if (type == 'w'){
                url = App.router.linkCurrent({word: arr[i].w});
              }else if (type == 'l'){
                url = App.router.linkLanguageView({language: arr[i].l});
              }else{
                return false;
              }
              App.views.renderer.model.wordView.closeAllLists();
              App.router.navigate(url, { trigger: true, replace: true });
              App.views.renderer.model.wordView.currentFocus = -1;
            }
          }
        }
        return true;
      }
      if (!val) { 
        this.closeAllLists();;
        return false;
      }
      this.closeAllLists();
      arr.sort(function compare(a, b){
        if (a.n > b.n) return 1;
        if (b.n > a.n) return -1;
        return 0;
      });
      a = document.createElement("DIV");
      a.setAttribute("id", inp.id + "autocomplete-list");
      if (type == 'w'){
        a.setAttribute("class", "autocomplete-items color-word word-margin");
      }else if (type == 'l'){
        a.setAttribute("class", "autocomplete-items color-language");
      }
      inp.parentNode.appendChild(a);
      var lookup = this.removeDiacritics(val.toUpperCase());
      var re = new RegExp(this.escapeRegExp(lookup));
      var found = 0;
      for (i = 0; i < arr.length; i++) {
        if (re.test(this.removeDiacritics(arr[i].n.toUpperCase()))) {
          found++;
          b = document.createElement("DIV");
          b.innerHTML = arr[i].n;
          b.innerHTML += "<input type='hidden' value='" + i + "'>";
          b.addEventListener("click", function(e) {
            var ix = parseInt(this.getElementsByTagName("input")[0].value);
            var url;
            if (type == 'w'){
              url = App.router.linkCurrent({word: arr[ix].w});
            }else if (type == 'l'){
              url = App.router.linkLanguageView({language: arr[ix].l});
            }else{
              return false;
            }
            App.views.renderer.model.wordView.closeAllLists();
            App.router.navigate(url, { trigger: true, replace: true });
            App.views.renderer.model.wordView.currentFocus = -1;
          });
          a.appendChild(b);
          if (found > 14) {
            var e = document.createElement("DIV");
            e.innerHTML = '...';
            a.appendChild(e);
            break;
          }
        }
      }
      if (found == 1){
        var x = document.getElementById(inp.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        this.currentFocus++;
        this.addActive(x);
      }
      return true;
    }
  , removeDiacritics: function(s) {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  }
  , escapeRegExp: function(s) {
      var re = /([*+?^${}()|\[\]\/\\])/g;
      return String(s).replace(re, "\\$1");
  }
  , addActive: function(x) {
      if (!x) return false;
      this.removeActive(x);
      if (this.currentFocus >= x.length) this.currentFocus = 0;
      if (this.currentFocus < 0) this.currentFocus = (x.length - 1);
      x[this.currentFocus].classList.add("autocomplete-active");
    }
  , removeActive: function(x) {
      for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
      }
    }
  , closeAllLists: function() {
      var x = document.getElementsByClassName("autocomplete-items");
      for (var i = 0; i < x.length; i++) {
        x[i].parentNode.removeChild(x[i]);
      }
      this.currentFocus = -1;
    }
    /**
      Generates the WordHeadline for WordView,
      but might also be used to build the WordHeadline for MapView aswell.
    */
  , updateWordHeadline: function(){
      var word = App.wordCollection.getChoice();
      if(!word){
        console.log('WordView.updateWordHeadline() with no word.');
        return;
      }
      var spLang   = App.pageState.getSpLang()
        , headline = {name: word.getNameFor(spLang)}
        , longName = word.getLongName();
      //Sanitize name:
      if(_.isArray(headline.name))
        headline.name = headline.name.join(', ');
      if(!_.isString(longName)){
        longName = '';
      }
      // temporary solution to process longName
      // in the docs: longName provides additional info _OR_ the complete long form
      //    - logically this doesn't work
      // that's why the following workaround:
      //    - ignore if name == longForm
      //    - if longForm begins with '(' and ends with ')'append longForm to name
      //         otherwise set name = longForm
      longName = longName.trim();
      if (longName !== '') {
        if (spLang !== null){
          headline['stname'] = longName;
        }else{
          headline.name = longName;
        }
      }else{
        if (spLang !== null){
          var st = word.getNameFor(null);
          if (st !== headline.name){
            headline['stname'] = st;
          }
        }
      }
      //MapsLink:
      if(!App.pageState.isPageView('map')){
        headline.mapsLink = {
          link: 'href="'+App.router.linkMapView({word: word})+'"'
        , ttip: App.translationStorage.translateStatic('tooltip_words_link_mapview')
        };
      }
      //ConcepticonLink:
      if(word.get('StudyDefaultConcepticonID') !== '0'){
        headline.concepticonLink = {
          link: 'href="https://concepticon.clld.org/parameters/'+word.get('StudyDefaultConcepticonID')+'" target="_new"'
        , ttip: App.translationStorage.translateStatic('tooltip_words_link_concepticon')
        };
      }
      //Neighbours:
      var withN = function(w){
        return {
          link:  'href="'+App.router.linkCurrent({word: w})+'"'
        , ttip:  w.getLongName()
        , trans: w.getNameFor(spLang)
        };
      };
      //Previous Word:
      headline.prev = $.extend(withN(word.getPrev())
      , {title: App.translationStorage.translateStatic('tabulator_word_prev')});
      //Next Word:
      headline.next = $.extend(withN(word.getNext())
      , {title: App.translationStorage.translateStatic('tabulator_word_next')});
      //Done:
      _.extend(this.model, {wordHeadline: headline});
    }
    /**
      Generates the WordTable for WordView.
    */
  , updateWordTable: function(){
      //The word to use:
      var word = App.wordCollection.getChoice();
      if(!word){
        console.log('WordView.updateWordTable() with no word.');
        return;
      }
      //Words per row:
      var wordCount = 5;
      //Calculating the maximum number of language cols:
      var maxLangCount = _.chain(App.regionCollection.models).map(function(r){
        var c = r.getLanguages().length;
        return (c > wordCount) ? wordCount : c;
      }).max().value();
      //Do we color by family?
      var colorByFamily = App.study.getColorByFamily();
      //Building the table:
      var table = {
        wordHeadlinePlayAll: App.translationStorage.translateStatic('wordHeadline_playAll')
      , rows: []
      };
      //We iterate the tree families->regions->languages and construct rows from that.
      App.familyCollection.each(function(f){
        var family = {rowSpan: 0, name: f.getName()};
        if(colorByFamily) family.color = f.getColor();
        //Regions to deal with:
        var regions = [];
        f.getRegions().each(function(r){
          var region = {name: r.getShortName()}
            , languages = r.getLanguages();
          if(!colorByFamily) region.color = r.getColor();
          //Calculating the rowSpan for the current region:
          region.rowSpan  = _.max([Math.ceil(languages.length / wordCount), 1]);
          family.rowSpan += region.rowSpan;
          //Further handling of languages; lss :: [[LanguageCell]]
          var cellCount = maxLangCount, lss = [], ls = [];
          languages.each(function(l){
            //Swapping ls over to lss:
            if(cellCount === 0){
              lss.push(ls);
              ls = [];
              cellCount = maxLangCount;
            }
            //Generating a LanguageCell:
            var cell = {
              isLanguageCell: true
            , link: 'href="'+App.router.linkLanguageView({language: l})+'"'
            , shortName: l.getSuperscript(l.getShortName())
            , longName:  l.getLongName()
            };
            var t = App.transcriptionMap.getTranscription(l, word)
              , s = (t !== null) ? t.getAltSpelling() : null;
            if(s) cell.spelling = s;
            if(t !== null){
              cell.phonetic = t.getPhonetics();
            }
            //Filling ls:
            ls.push(cell);
            cellCount--;
          }, this);
          //Handling empty languageCells:
          for(;cellCount > 0; cellCount--){ls.push({isLanguageCell: false});}
          lss.push(ls);
          //Filling regions from lss:
          _.each(lss, function(ls, i){
            if(i === 0) ls.unshift(region);
            regions.push(ls);
          }, this);
        }, this);
        //Adding to the rows:
        var row = {cells: []};
        if(parseInt(f.getId()) !== 0) row.spaceRow = true;
        _.each(regions, function(cells, i){
          if(i === 0){
            if(App.familyCollection.length > 1)
            cells.unshift(family);
          }
          row.cells = cells;
          table.rows.push(row);
          row = {cells: []};
        }, this);
      }, this);
      //Done:
      _.extend(this.model, {WordTable: table});
    }
    /***/
  , render: function(){
      if(App.pageState.isPageView(this)){
        this.$el.html(App.templateStorage.render('WordTable', this.model));
        this.$el.removeClass('hide');
        //Updating sound related stuff:
        App.views.audioLogic.findAudio(this.$el);
        App.views.playSequenceView.update(this.getKey());
      }else{
        this.$el.addClass('hide');
      }
    }
    /***/
  , route: function(siteLanguage, study, word){
      var parse = App.router.parseString;
      study = parse(study);
      // @legacy
      if (App.pageState.isLegacy(study)) return;
      word = parse(word);
      // if word is missing and first parameter is a valid study
      // then user asked for /:Study/word/:Word
      if((!word || word.length == 0) && !_.contains(App.study.getAllIds(), study)){
        var s = study;
        study = siteLanguage;
        word = s;
        siteLanguage = App.translationStorage.getBrowserMatch();
      }
      console.log('WordView.route('+siteLanguage+', '+study+', '+word+')');
      var t = this;
      //Setting siteLanguage and study:
      this.loadBasic(siteLanguage, study).always(function(){
        //Setting the word:
        App.wordCollection.setChoiceByKey(word);
        //Set this pageView as active:
        App.pageState.setPageView(t.getKey());
        //Render:
        App.views.renderer.render();
      });
    }
  });
});
