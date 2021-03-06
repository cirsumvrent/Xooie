/*
*   Copyright 2012 Comcast
*
*   Licensed under the Apache License, Version 2.0 (the "License");
*   you may not use this file except in compliance with the License.
*   You may obtain a copy of the License at
*
*       http://www.apache.org/licenses/LICENSE-2.0
*
*   Unless required by applicable law or agreed to in writing, software
*   distributed under the License is distributed on an "AS IS" BASIS,
*   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*   See the License for the specific language governing permissions and
*   limitations under the License.
*/

define('xooie/addons/tab_animation', ['jquery', 'xooie/addons/base', 'async'], function($, Base, async) {

    var Animation = Base('animation', function(){
        var self = this,
            isAnimating = false,
            animationQueue = [],
            callback = function(){
                if (animationQueue.length > 0) {
                    animationQueue.shift()();
                } else {
                    isAnimating = false;
                }
            };

        this.module.root.on('tabChange', function(event){
            animationQueue.push(function(){
                var direction;

                if (self.options.wrap) {
                    if (event.toTab === 0 && event.fromTab === self.module.getPanel().length - 1) {
                        direction = 1;
                    } else if (event.toTab === self.module.getPanel().length - 1 && event.fromTab === 0) {
                        direction = -1;
                    } else {
                        direction = event.toTab > event.fromTab ? 1 : -1;
                    }
                } else {
                    direction = event.toTab > event.fromTab ? 1 : -1;
                }

                self.animateToTab(event.toTab, event.fromTab , direction, callback);
            });

            if (!isAnimating) {
                isAnimating = true;
                callback();
            }
        });

        var getAnimation = function(el, properties) {
            return function(cb) {
                el.animate(properties, {
                    duration: self.options.duration,
                    easing: self.options.easing,
                    complete: function() {
                        $(this).attr('style', '');
                        cb();
                    }
                });
            };
        };

        this.animationMethods = {

            "horizontal": function(to, from, container, direction){
                var calls = [];

                container.css({
                    overflow: 'hidden',
                    height: from.outerHeight(),
                    width: container.width()
                });

                from.css({
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: from.width(),
                    height: from.height()
                });

                to.css({
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    left: (direction === -1) ? -container.innerWidth() : container.innerWidth(),
                    width: to.width(),
                    height: to.height()
                });

                calls.push(
                    getAnimation(from, {
                        left: (direction === -1) ? container.innerWidth() : -container.innerWidth()
                    }),

                    getAnimation(to, {
                        left: 0
                    }),

                    getAnimation(container, {
                        height: to.outerHeight()
                    })
                );

                return calls;
            },

            "vertical": function(to, from, container, direction){
                var calls = [];

                container.css({
                    overflow: 'hidden',
                    height: from.outerHeight(),
                    width: container.width()
                });

                from.css({
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: from.width(),
                    height: from.height()
                });

                to.css({
                    display: 'block',
                    position: 'absolute',
                    top: (direction === -1) ? -container.innerHeight() : container.innerHeight(),
                    left: 0,
                    width: to.width(),
                    height: to.height()
                });

                calls.push(
                    getAnimation(from, {
                        top: (direction === -1) ? container.innerHeight() : -container.innerHeight()
                    }),

                    getAnimation(to, {
                        top: 0
                    }),

                    getAnimation(container, {
                        height: to.outerHeight()
                    })
                );

                return calls;

            },

            "fade": function(to, from, container, direction) {
                var calls = [];

                container.css({
                    overflow: 'hidden',
                    height: from.outerHeight(),
                    width: container.width()
                });

                from.css({
                    display: 'block',
                    position: 'absolute',
                    opacity: 1.0,
                    top: 0,
                    left: 0,
                    width: from.width(),
                    height: from.height()
                });

                to.css({
                    display: 'block',
                    position: 'absolute',
                    opacity: 0,
                    top: 0,
                    left: 0,
                    width: to.width(),
                    height: to.height()
                });

                calls.push(
                    getAnimation(from, {
                        opacity: 0
                    }),

                    getAnimation(to, {
                        opacity: 1.0
                    }),

                    getAnimation(container, {
                        height: to.outerHeight()
                    })
                );

                return calls;

            }
        };
    });

    Animation.setDefaultOptions({
        panelContainerSelector: '[data-role="panel-container"]',
        animationMode: 'horizontal', //Can be horizontal, vertical or fade
        easing: 'linear', //TODO: load other easings if necessary
        duration: 500,
        wrap: false
    });

    $.extend(Animation.prototype, {
        animateToTab: function(index, currentIndex, direction, callback) {
            if (index === currentIndex || index < 0 || index >= this.module.getPanel().length) {
                return;
            }

            var from = this.module.getPanel(currentIndex),
                to = this.module.getPanel(index),
                container = from.parents(this.options.panelContainerSelector),
                calls;

            if (typeof this.animationMethods[this.options.animationMode] === 'function') {
                calls = this.animationMethods[this.options.animationMode](to, from, container, direction);

                async.parallel(calls, callback || function() {});
            }
        }
    });

    return Animation;

});

