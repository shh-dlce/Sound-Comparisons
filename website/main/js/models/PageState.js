/**
  The PageState has a variety of tasks that lie at the core of our Application.
  - It tracks state for the site, where the different parts should not do so themselfs.
  - It aids construcing links for the site.
  - It assists in parsing links for the site.
*/
PageState = Backbone.Model.extend({
  defaults: {
    wordOrder: 'alphabetical'
  , spLang: null
  , phLang: null
  , pageView: 'word'
  , pageViews: ['map','word','language','languagesXwords','wordsXlanguages']
  }
  /**
    Sets up callbacks to manipulate PageState when necessary.
  */
, activate: function(){
    //{sp,ph}Lang need resetting sometimes:
    var reset = function(){this.set({spLang: null, phLang: null})};
    App.study.on('change', reset, this);
    App.translationStorage.on('change:translationId', reset, this);
  }
//Managing the wordOrder:
  /**
    Predicate to test if the wordOrder is logical
  */
, wordOrderIsLogical: function(){
    return this.get('wordOrder') === 'logical';
  }
  /**
    Predicate to test if the wordOrder is alphabetical
  */
, wordOrderIsAlphabetical: function(){
    return this.get('wordOrder') === 'alphabetical';
  }
  /**
    Sets the wordOrder to logical
  */
, wordOrderSetLogical: function(){
    this.set({wordOrder: 'logical'});
  }
  /**
    Sets the wordOrder to alphabetical
  */
, wordOrderSetAlphabetical: function(){
    this.set({wordOrder: 'alphabetical'});
  }
//Managing {sp,ph}Lang:
  /**
    Returns the current spellingLanguage
  */
, getSpLang: function(){
    var spl = this.get('spLang');
    if(spl === null){
      spl = App.translationStorage.getRfcLanguage();
      this.attributes.spLang = spl;
    }
    return spl;
  }
  /***/
, setSpLang: function(l){
    this.set({spLang: l || null});
  }
  /**
    Returns the current phoneticLanguage
  */
, getPhLang: function(){
    var phl = this.get('phLang');
    if(phl === null){
      if(spl = this.getSpLang()){
        phl = spl;
      }else{
        phl = App.languageCollection.getDefaultPhoneticLanguage();
      }
      this.attributes.phLang = phl;
    }
    return phl;
  }
  /***/
, setPhLang: function(l){
    this.set({phLang: l || null});
  }
//Managing pageView:
  /**
    Predicate to tell if the current pageView is a multiView.
  */
, isMultiView: function(){
    return _.contains(['languagesXwords','wordsXlanguages'], this.get('pageView'));
  }
  /**
    Predicate to tell if the current pageView is the mapView.
  */
, isMapView: function(){
    return this.get('pageView') === 'map';
  }
  /**
    Returns the currently active pageView as a Backbone.View
  */
, getPageView: function(){
    //FIXME implement
  }
  /**
    Returns the key for the current PageView.
  */
, getPageViewKey: function(){return this.get('pageView');}
  /**
    Changes the current pageView.
  */
, setPageView: function(pv){
    if(typeof(pv) === 'string'){
      if(_.contains(this.get('pageViews'), pv)){
        this.set({pageView: pv});
      }else{
        console.log('PageState.setPageView() refuses to set pageView: '+pv);
      }
    }else if(pv instanceof Backbone.View){
      //FIXME implement
    }
  }
  /***/
, isPageView: function(key){
    if(_.contains(this.get('pageViews'), key)){
      return this.get('pageView') === key;
    }
    switch(key){//Used by topMenu so far.
      case 'm':  return this.isPageView('map');
      case 'w':  return this.isPageView('word');
      case 'l':  return this.isPageView('language');
      case 'lw': return this.isPageView('languagesXwords');
      case 'wl': return this.isPageView('wordsXlanguages');
    }
    console.log('PageState.isPageState() with unexpected key: '+key);
    return false;
  }
});
