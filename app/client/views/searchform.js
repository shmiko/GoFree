// Generated by CoffeeScript 1.4.0
var SearchForm;

SearchForm = Backbone.View.extend({
  stops: {},
  maxDate: app.utils.pureDate(app.now),
  canAddStop: false,
  initialize: function() {
    this.render();
    this.addStopEl = this.$el.find('.v-s-d-add');
    this.errorEl = this.$el.find('.v-s-error');
    this.errorVisible = false;
    this.maxDate.setDate(this.maxDate.getDate() + 2);
    this.stopsEl = this.$el.find('.v-s-destinations');
    this.collection.on('add', this.initStop, this);
    this.collection.on('delete', this.deleteStop, this);
    this.collection.on('change:date', this.dateChanged, this);
    this.collection.on('change:place', this.hideError, this);
    this.collection.on('change', this.collectionChanged, this);
    this.$el.find('select.m-input-select').m_inputSelect();
    this.form = this.$el.find('.v-s-form').m_formValidate()[0];
    this.restrictBudget();
    if (this.collection.length) {
      this.initStops();
      this.resetDatesLimits();
    } else {
      this.populateCollection();
      this.getInitialLocation();
    }
    app.log('[app.views.SearchForm]: initialize');
    return this;
  },
  events: {
    'click .v-s-d-add': 'addStop',
    'change .m-i-s-select': 'adultsChanged',
    'change .v-s-amount': 'budgetChanged',
    'valid form': 'handleSubmit',
    'click .v-s-error': 'hideError'
  },
  render: function() {
    return this.$el.html(app.templates.searchform(this.model.toJSON()));
  },
  restrictBudget: function() {
    var validate;
    validate = function(e) {
      if (e.keyCode < 48 || e.keyCode > 57) {
        return app.e(e);
      }
    };
    return this.$el.find('.v-s-amount').on('keypress input', validate);
  },
  populateCollection: function() {
    return this.collection.add([
      {
        date: app.utils.dateToYMD(this.maxDate),
        removable: false
      }, {
        date: null,
        removable: false
      }
    ]);
  },
  initStops: function() {
    var iterator;
    iterator = _.bind(this.initStop, this);
    return this.collection.each(iterator);
  },
  getInitialLocation: function() {
    var _this = this;
    return $.ajax({
      url: app.api.get_location,
      success: function(resp) {
        if (resp && resp.value) {
          return _this.collection.at(0).set('place', resp.value);
        }
      }
    });
  },
  resetDatesLimits: function() {
    var iterator,
      _this = this;
    iterator = function(model) {
      return _this.dateChanged(model, model.get('date'));
    };
    return this.collection.each(iterator);
  },
  initStop: function(item) {
    var index, minDate, prevDate, _ref;
    index = this.collection.indexOf(item);
    prevDate = (_ref = this.collection.at(index - 1)) != null ? _ref.get('date') : void 0;
    minDate = prevDate ? prevDate : app.utils.dateToYMD(this.maxDate);
    console.log(item);
    return this.stops[item.cid] = new app.views.SearchTripsStop({
      list: this.stopsEl,
      model: item,
      minDate: index === 0 ? null : minDate
    });
  },
  deleteStop: function(item) {
    var index, next, prev;
    index = this.collection.indexOf(item);
    prev = this.collection.at(index - 1);
    next = this.collection.at(index + 1);
    if (prev && next) {
      this.stops[prev.cid].setMaxDate(next.get('date'));
      this.stops[next.cid].setMinDate(prev.get('date'));
    } else {
      this.stops[prev.cid].setMaxDate(null);
    }
    this.collection.remove(item);
    delete this.stops[item.cid];
    if (this.collection.last().get('date')) {
      this.addStopEl.removeClass('disabled');
      return this.canAddStop = true;
    }
  },
  addStop: function(e) {
    if (!this.canAddStop) {
      return;
    }
    this.collection.add({
      date: null,
      removable: true
    });
    this.addStopEl.addClass('disabled');
    return this.canAddStop = false;
  },
  dateChanged: function(model, date) {
    var dateObj, index, next, prev;
    index = this.collection.indexOf(model);
    prev = this.collection.at(index - 1);
    next = this.collection.at(index + 1);
    if (prev) {
      this.stops[prev.cid].setMaxDate(date);
    }
    if (next) {
      this.stops[next.cid].setMinDate(date);
    }
    dateObj = app.utils.YMDToDate(date);
    if (+dateObj > +this.maxDate) {
      this.maxDate = dateObj;
    }
    if (!model.previous('date')) {
      this.addStopEl.removeClass('disabled');
      return this.canAddStop = true;
    }
  },
  collectionChanged: function(e) {
    if (this.model.isValid()) {
      return this.model.preSave();
    }
  },
  adultsChanged: function(e) {
    return this.model.set('adults', parseInt(e.target.value));
  },
  budgetChanged: function(e) {
    return this.model.set('budget', parseInt(e.target.value, 10));
  },
  showError: function() {
    if (!this.errorVisible) {
      this.errorEl.show();
      return this.errorVisible = true;
    }
  },
  hideError: function() {
    if (this.errorVisible) {
      this.errorEl.hide();
      return this.errorVisible = false;
    }
  },
  handleSubmit: function(evt, e) {
    app.e(e);
    this.hideError();
    if (this.model.isValid()) {
      return this.model.save();
    } else {
      return this.showError();
    }
  },
  destroy: function() {
    this.undelegateEvents();
    this.collection.off('add', this.initStop, this);
    this.collection.off('delete', this.deleteStop, this);
    this.collection.off('change:date', this.dateChanged, this);
    this.collection.off('change:place', this.hideError, this);
    delete this.collection;
    delete this.form;
    return app.log('[app.views.SearchForm]: destroy');
  }
});

app.views.SearchForm = SearchForm;
