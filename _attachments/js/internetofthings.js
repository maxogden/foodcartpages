(function($) {
  
  var app = $.sammy(function() {
    this.element_selector = '#content';
    this.use(Sammy.Template);

    this.before(function() {
    });

    this.get('#/map', function(context) {
      context.partial('cartmap.template', {id: 1}, function(rendered) {
        context.$element().html(rendered);
        var latlng = new google.maps.LatLng(45.597, -122.644);

        var myOptions = {
          zoom: 12,
          center: latlng,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        var map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

        var getCartIcons = function (lat,lon,count) {
          var one_block = 0.0012;
          var dataset = 'bicycle_parking_pdx';
          $.couch.app(function(app) {
            /*app.db.view('webapp/points', {success: function(cart_results) {
            }});*/
          }, {db : "food_carts", design : "webapp"});
        }

        var updateCartIcons =  function (){
                 var center = map.getCenter();
                 getCartIcons(center.lat(), center.lng(), 10);
        };

        google.maps.event.addListener(map, "dragend",  updateCartIcons);

        updateCartIcons();

      });
    });
    
    this.get('#/carts', function(context) {
      context.partial('carts.template', {id: 1}, function(rendered) {
          context.$element().html(rendered);
          $('#cartcount').html('loading cart data <img src="images/spinner.gif">');
          $.couch.app(function(app) {
            app.db.view('webapp/cart', {success: function(cart_results) {
                                          $('#cartcount').html(cart_results.total_rows+" food carts listed.");
                                          $.each(cart_results.rows, function(index,element) {
                                            var carts_element = $('#carts ul#carts');
                                            context.partial('cart.template', {cart: element.value}, function(rendered) {
                                               carts_element.append(rendered);
                                            });
                                          });
                                       }});
          }, {db : "food_carts", design : "webapp"});
      });
    });

    this.get('#/carts/new', function(context) {
      $.couch.app(function(app) {
        app.db.saveDoc({}, {success: function(res) {
          var carts_element = $('#carts ul#carts');
          context.partial('cart.template', {cart: {_id: res.id, _rev: res.rev, geometry:{coordinates:[0,0]}}}, function(rendered) {
             carts_element.append(rendered);
          });
          window.location = "#/carts/edit/"+res.id;
        }});
      }, {db : "food_carts", design : "webapp"});
    });

    this.get('#/carts/edit/:id', function(context) {
      var id = this.params['id'];
      $.couch.app(function(app) {
        app.db.openDoc(id, {success: function(cart_doc) {
          context.partial('cartedit.template', {cart: cart_doc}, function(rendered) {
            $('#'+id).replace(rendered);
            $('#cartform').submit(function() {
              var newCart = {  _id: cart_doc._id,
                               _rev: cart_doc._rev,
                               name: $('#cartform #name').val(), 
                               hours: $('#cartform #hours').val(), 
                               description: $('#cartform #description').val(), 
                               geometry: {coordinates: [0,0],"type":"Point"}};
              app.db.saveDoc(newCart, {success: function(res) {
                                    context.partial('cart.template', {cart: newCart}, function(rendered) {
                                      $('#'+id).replace(rendered);
                                    });
              }});
              return false;
            });
          });
        }});
      }, {db : "food_carts", design : "webapp"});
    });

    this.get('#/credits', function(context) {
      context.partial('credits.template', function(rendered) {
        context.$element().html(rendered)});
    });

    $(function() {
      app.run('#/carts');
    });
  });
})(jQuery);
