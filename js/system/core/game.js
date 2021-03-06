define(['game/config/config', 'game/config/screen', 'game/config/fonts', 'system/geo/vector2'],
	function(config, screen, fonts, Vector2) {
		window.requestAnimFrame = (function(){
			return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function( callback, element ){window.setTimeout(callback, 60);};
		})();

		return {
			frames: 0,
			fps: 60,
			drawCount: 0,
			drawCountLast: 0,

			scene: null, // for changing Scene -> use method SetScene(scene)
			lastUpdate: 0,

			display: null,
			displayCtx: null,
			buffer: null,
			bufferCtx: null,

			scaleInternal: new Vector2(1, 1),
			currentlyPortrait: false,
			offset: new Vector2(0, 0),
			sceneScale: 1,
			timeScale: 1,

			resize: function() {
				if(screen.currentScaleType == ScaleType.TO_FULLSCREEN || screen.currentScaleType == ScaleType.WITH_ROTATION) {
					this.updateScale();
				} else if(screen.currentScaleType == ScaleType.SAME_ASPECT_RATIO) {
					this.updateScaleForFixedAspectRatio();
				}
			},

			init: function(scene) {

				screen.w = screen.wViewport;
				screen.h = screen.hViewport;
					
				this.display = document.getElementById('gameframe');
				this.displayCtx = this.display.getContext('2d');

				this.scene = scene;

				this.buffer = document.createElement('canvas');
				this.bufferCtx = this.buffer.getContext('2d');

				if(screen.currentScaleType != ScaleType.NONE) {
					this.resize();
				} else {
					this.onUpdateScreenSizes();
				}

				(function(that) {
					if(config.debug)
						setInterval(function() { that.updateFramerate(); }, 1000);
					if(screen.currentScaleType != ScaleType.NONE)
						window.onresize = function() { that.resize(); };
				}(this));

				this.lastUpdate = Date.now();
				this.loop();
			},

			updateFramerate: function() {
				this.fps = this.frames;
				this.frames = 0;
				this.drawCountLast = this.drawCount;
				this.drawCount = 0;
			},

			loop: function() {
				var now = Date.now();
				var delta = (now - this.lastUpdate) * this.timeScale;

				if( delta < 250 && this.scene ) {
					this.update( delta );
					this.draw();
				}

				this.lastUpdate = now;
				this.frames++;

				var self = this;
				requestAnimFrame( function() { self.loop(); });
			},

			update: function( delta ) {
				this.scene.update( delta );
			},

			draw: function() {

				this.bufferCtx.fillStyle="transparent";
				this.displayCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);
				this.bufferCtx.clearRect(0, 0, this.buffer.width, this.buffer.height);

				this.scene.draw( this.bufferCtx, false );
				this.scene.draw( this.bufferCtx );

				this.displayCtx.drawImage( this.buffer, 0, 0, this.buffer.width, this.buffer.height );

				if( config.debug ) {
					//fonts.frames.apply(this.displayCtx);
					this.displayCtx.fillText("FPS: " + this.fps, 65, 15);
					this.displayCtx.fillText("Draws/Sec: " + this.drawCountLast, 65, 35);
					this.displayCtx.fillText("Draws/Frame: " + Math.round(this.drawCountLast / this.fps), 65, 55);
				}
			},

			updateScaleForFixedAspectRatio: function() {
				var fw = window.innerWidth / screen.w;
				var fh = window.innerHeight / screen.h;
				var scale = Math.min(fw, fh);

				this.scaleInternal.x = scale;
				this.scaleInternal.y = scale;

				this.display.width = screen.w * scale.x;
				this.display.height = screen.h * scale.y;
				this.buffer.width = screen.w * scale.x;
				this.buffer.height = screen.h * scale.y;

				this.onUpdateScreenSizes();
			},

			updateScale: function() {

				var width = window.innerWidth;
				var height = window.innerHeight;

				if(screen.currentScaleType == ScaleType.WITH_ROTATION && this.currentlyPortrait) {
					var tmpWidth = width;
					width = height;
					height = tmpWidth;
				}

				if(screen.w != width || screen.h != height)
				{
					// check ascept radio -> Portrait or Landscape
					if(screen.currentScaleType == ScaleType.WITH_ROTATION) {
						if(width < height && !this.currentlyPortrait) {

							this.currentlyPortrait = true;
							this.display.style.transform = "rotate(90deg)";
							var tmpWidth = width;
							width = height;
							height = tmpWidth;
						} else if(width <= height && this.currentlyPortrait) { // switched >= to <
							this.currentlyPortrait = false;
							this.display.style.transform = "rotate(0deg)";
							var tmpWidth = width;
							width = height;
							height = tmpWidth;
						}
					}

					if(this.currentlyPortrait) {
						var pivot = height / 2;
						this.display.style.transformOrigin = pivot + "px "+pivot+"px 0";
					}

					var fw = width / screen.w;
					var fh = height / screen.h;
					var min = Math.min(fw, fh);

					this.scaleInternal.x = fw;
					this.scaleInternal.y = fh;

					this.display.width = screen.w * fw;
					this.display.height = screen.h * fh;
					this.buffer.width = screen.w * fw;
					this.buffer.height = screen.h * fh;

					// if screen.w/h changed -> update screen
					this.onUpdateScreenSizes(width, height);

				}

			},

			onUpdateScreenSizes: function(min, height) {

				// update scene size
				if(this.scene !== undefined)
					this.scene.setSize(screen.w, screen.h);

				// calculation
				var x = (screen.w - screen.wViewport) / 2;
				var y = (screen.h - screen.hViewport) / 2;
				var scaleX = this.scaleInternal.x;
				var scaleY = this.scaleInternal.y;
				var scale = Math.min(scaleX, scaleY);
				var addPosX = 0;
				var addPosY = 0;

				// get additional Position offset
				if(scaleY < scaleX) {
					addPosX = x + (screen.wViewport * scaleX - (screen.wViewport * scaleY)) / 2;
				} else {
					addPosY = y + (screen.hViewport * scaleY - (screen.hViewport * scaleX)) / 2;
				}

				// save variables
				this.offset.x = addPosX;
				this.offset.y = addPosY;
				this.sceneScale = scale;

				// set scene
				if(this.scene !== undefined)
					this.scene.resize();

			},

			setScene: function(scene) {
				this.scene = scene;
				this.scene.resize();
			}



		};
});