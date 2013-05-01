var LiveSearch = function(options) {
    var _targetControl = options.target || this;
    var _searchCallback = options.searchCallback;
    var _displayProperty = options.displayProperty;
    var _valueProperty = options.valueProperty;
    var _waitTimeout = options.waitTimeout || 100;
    var _maxResultSize = options.maxResultSize || 20;
    var _searchPopup;

    var init = function() {
        _searchPopup = $("ul.searchresultspopup");
        if(_searchPopup.length === 0) {
            _searchPopup = $("<ul style='display:none;' class='searchresultspopup'></ul>");
            $(document.body).append(_searchPopup);
            _searchPopup.mouseleave(function() {
                that.hide();
            });
        }
        attachHandlers();
    };

    var attachHandlers = function() {
        _targetControl.on("keyup", function(e) {
            // Set Timeout
            clearTimeout($.data(_targetControl, 'timer'));
            // Set Search String
            var vals = _targetControl.val().split(",");
            var search_string = vals[vals.length-1].trim();
            // Do Search
            if (search_string.length < 3 || search_string.length > 9) {
                that.hide();
                return;
            }
            _targetControl.data('timer', setTimeout(function() {
                _searchCallback({
                    query: search_string,
                    doneCallback: function(json) {
                        that.clear();
                        if(json && json.length === 0) {
                            return;
                        }
                        that.show();
                        $.each(json, function(index, value) {
                            if(index + 1 > _maxResultSize) {
                                return false;
                            }
                            var $li = $("<li class='searchresultspopupitem'>" + highlightWords(unescape(value[_displayProperty]), search_string) + "</li>");
                            $li.attr(_valueProperty, value[_valueProperty]);
                            _searchPopup.append($li);
                            $li.click(function() {
                                var val = _targetControl.val();
                                if(val !== "") {
                                    val += ",";
                                }
                                var last = val.lastIndexOf(search_string);
                                val = val.substring(0, last) + $(this).attr(_valueProperty);
                                that.hide();
                                _targetControl.focus();
                                _targetControl.val(val);
                            });
                        });
                    }
                }); 
            }, _waitTimeout));
        });
    };

    var highlightWords = function (line, word) {
        var regex = new RegExp('(' + word + ')', 'gi');
        return line.replace(regex, "<b>$1</b>");
    };

    var that = {
        show: function() {
            var offset = _targetControl.offset();
            offset.top += _targetControl.height() + 5;
            _searchPopup.css({"min-width":_targetControl.width()});
            _searchPopup.offset(offset);
            _searchPopup.show();
        },
        hide: function() {
            _searchPopup.offset({left:0,top:0});
            _searchPopup.hide();
        },
        clear: function() {
            _searchPopup.empty();
        },
        destroy: function() {
            _targetControl.off("keyup");
            clearTimeout($.data(_targetControl, 'timer'));
            _searchPopup.remove();
        }
    };

    init();

    return that;
};

(function($) {
    $.fn.liveSearch = LiveSearch;
}(jQuery));