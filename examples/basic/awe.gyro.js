(function (awe) {
    var device_orientation_data,
        current_screen_orientation = window.orientation;

    var last_update = performance.now();
    var enabled = false;
    var zoom = 700;
    var zoom_delta = 0;
    var ready = false;
    var gyro_mode = 'point'; // none|point|sphere
    var _orientationHandler = null;

    var _currentOrientation = {
        alpha: 0,
        beta: 0,
        gamma: 0
    };

    var _convertOrientation = function (orientation) {
        return {
            alpha: (orientation.alpha + 90) % 360,
            beta: orientation.beta,
            gamma: orientation.gamma
        };
    };

    var _onOrientationChanged = function (mode, event) {
        var orientation = event.detail;

        var result = _convertOrientation(orientation);

        if (Math.abs(result.alpha - _currentOrientation.alpha) >= 1
            || Math.abs(result.beta - _currentOrientation.beta) >= 1
            || Math.abs(result.gamma - _currentOrientation.gamma) >= 1) {

            _currentOrientation = result;

            if (_orientationHandler) {
                _orientationHandler(result);
            }
        }
    };

    function setup(){
        ready = true;
    }

    awe.plugins.add([{
        id: 'gyro',
        capabilities: ['gyro'],
        auto_register: true,
        register: function(plugin_data){
            awe.events.add([
                {
                id: 'update_pov',
                register: function(handler) {
                    window.addEventListener('tick', handler, false);
                },
                unregister: function(handler){
                    window.removeEventListener('tick', handler, false);
                },
                handler: function(e) {
                    if (!ready) {
                        setup();
                    }
                    if (device_orientation_data && enabled && gyro_mode != 'none') {
                        awe.util.update_pov_quaternion( device_orientation_data, current_screen_orientation, zoom, zoom_delta, last_update, gyro_mode );
                    }
                }
            },
            {
                id: 'gyro_screenorientation',
                register: function(handler) {
                    current_screen_orientation = window.orientation;
                    window.addEventListener('orientationchange', handler, false);
                },
                unregister: function(handler){
                    window.removeEventListener('orientationchange', handler, false);
                },
                handler: function(e) {
                    current_screen_orientation = window.orientation || 0;
                }
            },
            {
                id: 'deviceorientation',
                register: function(handler) {

                    _currentOrientation = {
                        alpha: 0,
                        beta: 0,
                        gamma: 0
                    };

                    if (_orientationHandler) {
                        this.unregister();
                    }

                    _orientationHandler = handler;

                    window.addEventListener('absolutedeviceorientation', _onOrientationChanged.bind(this, 'absolute'), false);
                },
                unregister: function(handler){
                    window.removeEventListener('absolutedeviceorientation', _onOrientationChanged.bind(this, 'absolute'));
                    if (_orientationHandler) {
                        _orientationHandler = null;
                    }
                },
                handler: function(e) {
                    device_orientation_data = {
                        alpha: e.alpha,
                        beta: e.beta,
                        gamma: e.gamma
                    };
                }
            }
            ]);
        },
        unregister: function(plugin_data){
            awe.events.delete('update_pov');
            awe.events.delete('gyro_screenorientation');
            awe.events.delete('deviceorientation');
        },
        enable: function(){
            console.log('enable gyro')
            enabled = true;
        },
        disable: function(){
            console.log('disable gyro')
            enabled = false;
        },
    }]);
})(window.awe);
