(function($){

var data = $.ajax({
  url: "data.json",
  dataType: "json"
});

$(function() {
  var loadingError = $(".loading .error"),
    urlRegexp = /github.com\/[^\/]+\/[^\/]+\/(?:blob|tree)\/?(.*)$/;

  data.done( function( data ) {
    $("title").text( function( index, text ) {
      return data.title + ": " + text;
    });
    $(".title").text( data.title );

    function renderRepoList( dest, refList ) {
      dest.html( $.map( refList, function( ref, directory ) {
        return "<a href='" + directory +"/'>" + directory + "</a>";
      }).join("") );
    }
    renderRepoList( $("#branch-list"), data.branches );
    renderRepoList( $("#tag-list"), data.tags );
    $(".loading").removeClass("loading");
    loadingError.remove();
  }).fail( function() {
    loadingError.text("Problem loading url");
  });

  $("form").submit(function( event ) {
    event.preventDefault();
    var match = urlRegexp.exec( $("#url-input").val() );
    if ( match ) {
      window.location = "/" + match[ 1 ];
    } else {
      $("#parse-error").text("Error parsing URL");
    }
  });
});

})(jQuery);
