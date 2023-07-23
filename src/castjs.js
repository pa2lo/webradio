// Cast.js fork from https://github.com/castjs/castjs

// Castjs
export class Castjs {
    // constructor takes optional options
    constructor(opt = {}) {
        // valid join policies
        var joinpolicies = [
            'tab_and_origin_scoped',
            'origin_scoped',
            'page_scoped'
        ];

        // only allow valid join policy
        if (!opt.joinpolicy || joinpolicies.indexOf(opt.joinpolicy) === -1) {
            opt.joinpolicy = 'tab_and_origin_scoped';
        }

        // set default receiver ID if none provided
        if (!opt.receiver || opt.receiver === '') {
            opt.receiver = 'CC1AD845';
        }

        // private variables
        this._events     = {}
        this._player     = null;
        this._controller = null;

        // public variables
        this.version        = 'v5.1.0'
        this.receiver       = opt.receiver;
        this.joinpolicy     = opt.joinpolicy;
        this.available      = false;
        this.connected      = false;
        this.device         = 'Chromecast';
        this.src            = ''
        this.title          = ''
        this.description    = ''
        this.poster         = ''
        this.volumeLevel    = 1;
        this.muted          = false;
        this.paused         = false;
        this.state          = 'disconnected';

        // initialize chromecast framework
        this._init()
    }
    _getBrowser() {
        if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
            return "Firefox: Please enable casting, click here: https://googlechromecast.com/how-to-cast-firefox-to-tv/"
        }
        if (navigator.userAgent.toLowerCase().indexOf('opr/') > -1) {
            return "Opera: Please enable casting, click here: https://googlechromecast.com/how-to-cast-opera-browser-to-tv-using-google-chromecast/"
        }
        if (navigator.userAgent.toLowerCase().indexOf('iron safari') > -1) {
            return "Iron Safari: Please enable casting, click here: https://googlechromecast.com/how-to-cast-opera-browser-to-tv-using-google-chromecast/"
        }
        if (navigator.brave) {
            return "Brave: Please enable casting, click here: https://googlechromecast.com/how-to-cast-brave-browser-to-chromecast/"
        }
        return "This Browser"
    }
    _init(tries = 0) {
        // casting only works on chrome, opera, brave and vivaldi
        if (!window.chrome || !window.chrome.cast || !window.chrome.cast.isAvailable) {
            if (tries++ > 20) {
                return this.trigger('error', 'Casting is not enabled in ' + this._getBrowser());
            }
            return setTimeout(this._init.bind(this), 250, tries);
        }

        // terminate loop
        clearInterval(this.intervalIsAvailable);

        // initialize cast API
        cast.framework.CastContext.getInstance().setOptions({
            receiverApplicationId:      this.receiver,
            autoJoinPolicy:             this.joinpolicy,
            language:                   'en-US',
            resumeSavedSession:         false,
        });
        // create remote player controller
        this._player = new cast.framework.RemotePlayer();
        this._controller = new cast.framework.RemotePlayerController(this._player);

        // register callback events
        this._controller.addEventListener('isConnectedChanged',  this._isConnectedChanged.bind(this));
        this._controller.addEventListener('isMediaLoadedChanged',this._isMediaLoadedChanged.bind(this));
        this._controller.addEventListener('isMutedChanged',      this._isMutedChanged.bind(this));
        this._controller.addEventListener('isPausedChanged',     this._isPausedChanged.bind(this));
        this._controller.addEventListener('volumeLevelChanged',  this._volumeLevelChanged.bind(this));
        this._controller.addEventListener('playerStateChanged',  this._playerStateChanged.bind(this));
        this.available = true;
        this.trigger('available');
    }

    _isMediaLoadedChanged() {
        // don't update media info if not available
        if (!this._player.isMediaLoaded) {
            return
        }
        // there is a bug where mediaInfo is not directly available
        // so we are skipping one tick in the event loop, zzzzzzzzz
        setTimeout(() => {
            if (!this._player.mediaInfo) {
                return
            }
            // Update device name
            this.device = cast.framework.CastContext.getInstance().getCurrentSession().getCastDevice().friendlyName || this.device

            // Update media variables
            this.src                = this._player.mediaInfo.contentId;
            this.title              = this._player.title || null;
            this.description        = this._player.mediaInfo.metadata.subtitle || null;
            this.poster             = this._player.imageUrl || null;
            this.volumeLevel        = this.volumeLevel = Number((this._player.volumeLevel).toFixed(1));
            this.muted              = this._player.isMuted;
            this.paused             = this._player.isPaused;
            this.state              = this._player.playerState.toLowerCase();
        })

    }
    // Player controller events
    _isConnectedChanged() {
        this.connected = this._player.isConnected;
        if (this.connected) {
            this.device = cast.framework.CastContext.getInstance().getCurrentSession().getCastDevice().friendlyName || this.device
        }
        this.state = !this.connected ? 'disconnected' : 'connected'
        this.trigger('statechange')
        this.trigger(!this.connected ? 'disconnect' : 'connect')
    }
    _volumeLevelChanged() {
        this.volumeLevel = Number((this._player.volumeLevel).toFixed(1));
        if (this._player.isMediaLoaded) {
            this.trigger('volumechange');
        }
    }
    _isMutedChanged() {
        var old = this.muted
        this.muted = this._player.isMuted;
        if (old != this.muted) {
            this.trigger(this.muted ? 'mute' : 'unmute');
        }
    }
    _isPausedChanged() {
        this.paused = this._player.isPaused;
        if (this.paused) {
            this.trigger('pause');
        }
    }
    _playerStateChanged() {
        this.connected = this._player.isConnected
        if (!this.connected) {
            return
        }
        this.device = cast.framework.CastContext.getInstance().getCurrentSession().getCastDevice().friendlyName || this.device
        this.state = this._player.playerState.toLowerCase();

        switch(this.state) {
            case 'idle':
                this.state = 'ended';
                this.trigger('statechange');
                this.trigger('end');
                return this
            case 'buffering':
                this.trigger('statechange');
                this.trigger('buffering');
                return this
            case 'playing':
                setTimeout(() => {
                    this.trigger('statechange');
                    this.trigger('playing');
                })
                return this
        }
    }
    // Class functions
    on(event, cb) {
        // If event is not registered, create array to store callbacks
        if (!this._events[event]) {
            this._events[event] = [];
        }
        // Push callback into event array
        this._events[event].push(cb);
        return this
    }
    off(event) {
        if (!event) {
            // if no event name was given, reset all events
            this._events = {};
        } else if (this._events[event]) {
            // remove all callbacks from event
            this._events[event] = [];
        }
        return this
    }
    trigger(event) {
        // Slice arguments into array
        var tail = Array.prototype.slice.call(arguments, 1);
        // If event exist, call callback with callback data
        for (var i in this._events[event]) {
            setTimeout(() => {
                this._events[event][i].apply(this, tail);
            }, 1)
            // this._events[event][i].apply(this, tail);
        }
        // dont call global event if error
        if (event === 'error') {
            return this
        }
        // call global event handler if exist
        for (var i in this._events['event']) {
            setTimeout(() => {
                this._events['event'][i].apply(this, [event]);
            }, 1)
            // this._events['event'][i].apply(this, [event]);
        }
        return this
    }
	_startCasting() {
		// Create media cast object
		var mediaInfo = new chrome.cast.media.MediaInfo(this.src);
		mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();

		// Let's prepare the metadata
		mediaInfo.metadata.images =   [new chrome.cast.Image(this.poster)];
		mediaInfo.metadata.title =    this.title;
		mediaInfo.metadata.subtitle = this.description;
		// Prepare the actual request
		var request = new chrome.cast.media.LoadRequest(mediaInfo);
		// Didn't really test this currenttime thingy, dont forget
		request.currentTime = 0;
		request.autoplay = !this.paused;

		// Here we go!
		cast.framework.CastContext.getInstance().getCurrentSession().loadMedia(request).then(() => {
			// Update device name
			this.device = cast.framework.CastContext.getInstance().getCurrentSession().getCastDevice().friendlyName || this.device
			// Sometimes it stays paused if previous media ended, force play
			if (this.paused) {
				this._controller.playOrPause();
			}
			return this;
		}, (err) => {
			return this.trigger('error', err);
		});
	}
    cast(src, metadata = {}) {
        // We need a source! Don't forget to enable CORS
        if (!src) {
            return this.trigger('error', 'No media source specified.');
        }
        metadata.src = src;
        // Update media variables with user input
        for (var key in metadata) {
            if (metadata.hasOwnProperty(key)) {
                this[key] = metadata[key];
            }
        }
        // Use current session if available
        if (cast.framework.CastContext.getInstance().getCurrentSession()) {
			return this._startCasting();
        } else {
            // Time to request a session!
            cast.framework.CastContext.getInstance().requestSession().then(() => {
                if (!cast.framework.CastContext.getInstance().getCurrentSession()) {
                    return this.trigger('error', 'Could not connect with the cast device');
                }

				return this._startCasting();
            }, (err) => {
                if (err !== 'cancel' && err !== 'session_error') {
                    this.trigger('error', err);
                }
                return this;
			});
        }
    }
    volume(float) {
        this._player.volumeLevel = float;
        this._controller.setVolumeLevel();
        return this;
    }
    play() {
        if (this.paused) {
            this._controller.playOrPause();
        }
        return this;
    }
    pause() {
        if (!this.paused) {
            this._controller.playOrPause();
        }
        return this;
    }
    mute() {
        if (!this.muted) {
            this._controller.muteOrUnmute();
        }
        return this;
    }
    unmute() {
        if (this.muted) {
            this._controller.muteOrUnmute();
        }
        return this;
    }

    // disconnect will end the current session
    disconnect() {
        cast.framework.CastContext.getInstance().endCurrentSession(true);
        this._controller.stop();

        // application variables
        this.connected  = false;
        this.device     = 'Chromecast';

        // media variables
        this.src         = ''
        this.title       = ''
        this.description = ''
        this.poster      = ''

        // player variable
        this.volumeLevel    = 1;
        this.muted          = false;
        this.paused         = false;
        this.state          = 'disconnected';

        this.trigger('disconnect');
        return this;
    }
}