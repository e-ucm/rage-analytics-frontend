'use strict';

jQuery(function ($) {
    console.log("hey que tal");
    var lastHeight = 0, curHeight = 0;
    setInterval(function () {
        $('iframe').each(function() {
            curHeight = $(this).contents().find('.app-wrapper-panel').height();
            if (curHeight !== lastHeight) {
                $(this).css('height', (lastHeight = curHeight) + 'px');
            }
        });
    }, 1000);
});