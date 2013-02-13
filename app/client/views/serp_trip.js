// Generated by CoffeeScript 1.4.0
var SERPTrip;

SERPTrip = Backbone.View.extend({
  tagName: 'article',
  className: 'v-serp-trip',
  _collapsable: true,
  initialize: function(opts) {
    this.opts = opts;
    this.container = this.opts.container;
    this.render();
    this.bg = this.$el.find('.v-s-t-bg-img');
    this.preloader = $('<img/>');
    if (this.model.get('flights_signature')) {
      this.flightsRow = new app.views.SERPTripRow({
        el: this.$el.find('.v-s-t-flights'),
        model: this.model,
        collection: this.model.get('flights_filtered'),
        template: app.templates.serp_trip_flight,
        signature: this.model.get('flights_signature')
      });
    }
    if (this.model.get('hotels_signature')) {
      this.hotelsRow = new app.views.SERPTripRow({
        el: this.$el.find('.v-s-t-hotels'),
        model: this.model,
        collection: this.model.get('hotels_filtered'),
        template: app.templates.serp_trip_hotel,
        signature: this.model.get('hotels_signature')
      });
    }
    this.preloader.on('load', _.bind(this.updateBG, this));
    this.initialCollapse();
    this.showTrip();
    this.fetchBackground();
    return app.log('[app.views.SERPTrip]: initialize');
  },
  events: {
    'click .v-s-t-places': 'toggleCollapse'
  },
  initialCollapse: function() {
    this.heightFull = this.$el.outerHeight();
    this.$el.addClass('collapsed');
    this.heightCollapsed = this.$el.find('.v-s-t-header').height();
    this.$el.hide();
    this.collapsed = true;
    return this.$el.css({
      height: this.heightCollapsed
    });
  },
  toggleCollapse: function() {
    if (this.collapsed) {
      return this.expand();
    } else {
      return this.collapse();
    }
  },
  fetchBackground: function() {
    var _this = this;
    return $.ajax({
      url: "" + app.api.images + (this.model.get('destination').place.country_code) + "/" + (this.model.get('destination').place.name),
      success: function(resp) {
        if (resp && resp.value) {
          return _this.preloader.attr('src', resp.value.blured);
        }
      }
    });
  },
  updateBG: function(e) {
    var _this = this;
    return this.bg.fadeOut(200, function() {
      _this.bg.attr('src', e.target.src);
      return _this.bg.fadeIn(200);
    });
  },
  showTrip: function(e) {
    return this.$el.fadeIn(500);
  },
  setCollapsable: function(bool) {
    this._collapsable = bool;
    if (this._collapsable) {
      return this.$el.removeClass('nocollapse');
    } else {
      return this.$el.addClass('nocollapse');
    }
  },
  expand: function() {
    if (!this.collapsed) {
      return;
    }
    this.trigger('expand', this.model.cid);
    this.collapsed = false;
    this.$el.removeClass('collapsed');
    this.$el.animate({
      height: this.heightFull
    }, {
      duration: 500,
      queue: false
    });
    return this.trigger('expanding', this.model.cid);
  },
  collapse: function() {
    if (this.collapsed) {
      return;
    }
    this.trigger('collapse', this.model.cid);
    if (!this._collapsable) {
      return;
    }
    this.collapsed = true;
    this.$el.addClass('collapsed');
    this.$el.animate({
      height: this.heightCollapsed
    }, {
      duration: 500,
      queue: false
    });
    return this.trigger('collapsing', this.model.cid);
  },
  render: function() {
    this.$el.html(app.templates.serp_trip(this.model.toJSON()));
    return this.container.append(this.$el);
  },
  destroy: function() {
    this.undelegateEvents();
    this.preloader.off('load');
    delete this.preloader;
    if (this.model.get('flights_signature')) {
      this.flightsRow.destroy();
      delete this.flightsRow;
    }
    if (this.model.get('hotels_signature')) {
      this.hotelsRow.destroy();
      delete this.hotelsRow;
    }
    delete this.model;
    delete this.collection;
    delete this.opts;
    return app.log('[app.views.SERPTrip]: destroyed');
  }
});

app.views.SERPTrip = SERPTrip;