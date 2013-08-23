var LiveSearch = function (options) {
    var _targetControl = options.target || this;
    var _searchCallback = options.searchCallback;
    var _displayProperty = options.displayProperty;
    var _valueProperty = options.valueProperty;
    var _valueList = options.valueList || options.valueProperty;
    var _waitTimeout = options.waitTimeout || 100;
    var _maxResultSize = options.maxResultSize || 20;
    var _afterPickCallback = options.afterPickCallback;
    var _searchPopup;
    var _selectedResult;

    var id = (function () {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    })();

    var init = function () {
        _searchPopup = $("#" + id);
        if (_searchPopup.length === 0) {
            _searchPopup = $("<ul id='" + id + "' style='display:none;' class='searchresultspopup'></ul>");
            _searchPopup.css({ "min-width": _targetControl.width() });
            $(document.body).append(_searchPopup);
            _searchPopup.mouseleave(function () {
                popup.hide();
            });
        }

        attachHandlers();
    };

    var attachHandlers = function () {
        _targetControl.keydown(function (e) {
            //keydown
            if (e.keyCode == 40) {
                if (!_selectedResult) {
                    _selectedResult = _searchPopup.find("li").first();
                }
                else {
                    if (_selectedResult.next().length) _selectedResult = _selectedResult.next();
                }
            }
            //keyup
            if (e.keyCode == 38) {
                if (!_selectedResult) {
                    _selectedResult = _searchPopup.find("li").last();
                }
                else {
                    if (_selectedResult.prev().length) _selectedResult = _selectedResult.prev();
                }
            }
            if (e.keyCode == 40 || e.keyCode == 38) {
                _searchPopup.find("li").removeClass("selected");
                _selectedResult.addClass("selected");
                _targetControl.val(_selectedResult.text());
                return false;
            }
            if (e.keyCode == 13) {
                popup.hide();
                return false;
            }
        });

        _targetControl.keyup(function (e) {
            if (e.keyCode == 13 || e.keyCode == 37 || e.keyCode == 38 || e.keyCode == 39 || e.keyCode == 40) {
                return false;
            }
            // Set Timeout
            clearTimeout($.data(_targetControl, 'timer'));
            // Set Search String
            var vals = _targetControl.val().split(",");
            var search_string = vals[vals.length - 1].trim();
            // Do Search
            if (search_string.length < 3 || search_string.length > 9) {
                popup.hide();
                return;
            }
            _targetControl.data('timer', setTimeout(function () {
                _searchCallback({
                    query: search_string,
                    doneCallback: function (dataArray) {
                        popup.clear();
                        if (dataArray && dataArray.length === 0) {
                            return;
                        }
                        $.each(dataArray, function (index, value) {
                            if (index + 1 > _maxResultSize) {
                                return false;
                            }
                            var $li = $("<li class='searchresultspopupitem'>" + highlightWords(unescape(value[_displayProperty]), search_string) + "</li>");
                            var attributes = _valueList.split(',');
                            $.each(attributes, function (index, attr) {
                                $li.attr(attr, value[attr]);
                            });
                            _searchPopup.append($li);
                            $li.click(function () {
                                popup.hide();
                                if (_afterPickCallback) {
                                    _afterPickCallback.call(this, $(this));
                                }
                                else {
                                    var val = _targetControl.val();
                                    if (val !== "") {
                                        val += ",";
                                    }
                                    var last = val.lastIndexOf(search_string);
                                    val = val.substring(0, last) + $(this).attr(_valueProperty);
                                    _targetControl.focus();
                                    _targetControl.val(val);
                                }
                            });
                        });
                        popup.show();
                    }
                });
            }, _waitTimeout));
        });
    };

    var highlightWords = function (line, word) {
        var regex = new RegExp('(' + word + ')', 'gi');
        return line.replace(regex, "<b>$1</b>");
    };

    var popup = {
        show: function () {
            if (!_searchPopup.is(":visible")) {
                _searchPopup.show();
                if (!_searchPopup.offsetSet) {
                    var offset = _targetControl.offset();
                    offset.top += _targetControl.height() + 4;
                    _searchPopup.offset(offset);
                }
            }
        },
        hide: function () {
            if (_searchPopup.is(":visible")) {
                _searchPopup.hide();
            }
        },
        clear: function () {
            _selectedResult = undefined;
            _searchPopup.empty();
        },
        destroy: function () {
            _targetControl.off("keyup");
            clearTimeout($.data(_targetControl, 'timer'));
            _searchPopup.remove();
        }
    };

    init();

    return popup;
};

(function ($) {
    $.fn.liveSearch = LiveSearch;
    if (ko && ko.bindingHandlers) {
        ko.bindingHandlers.liveSearch = {
            init: function (element, valueAccessor, allBindingsAccessor) {
                var opt = valueAccessor();
                $(element).liveSearch({
                    displayProperty: opt.displayProperty,
                    valueProperty: opt.valueProperty,
                    valueList: opt.valueList,
                    searchCallback: opt.searchCallback,
                    afterPickCallback: opt.afterPickCallback
                });
                ko.utils.registerEventHandler(element, "click", function () {
                    $(element).select()
                });
            },
            update: function (element, valueAccessor) {
            }
        };
    }
}(jQuery));