define([
	'system/lib/entity',
	'system/geo/vector2',
	'system/core/graphic',
	'game/config/screen',
	'game/config/config',
	],
		function (
			Entity,
			Vector2,
			graphics,
			screen,
			config
			) {

		    function Scene() {
				Entity.call(this, Zero(), new Vector2(screen.wViewport, screen.hViewport));
				this.keyAware = [];
			    this.bgColor = "#DDD";
				this.EntityType = "Scene";
				this.background;
			}

			Scene.prototype = new Entity();
			Scene.prototype.constructor = Scene;

			Scene.prototype.onDraw = function (ctx) {
				if (config.debug) {
					ctx.fillStyle = this.bgColor;
				}
				ctx.fillRect(0, 0, this.size.x, this.size.y);
				if (this.bg) {
					ctx.drawImage(graphics[this.bg], 0, 0);
				}
			};

			Scene.prototype.up = function (key) {
				this.dispatch(this.keyAware, 'up', key);
			};

			Scene.prototype.down = function (key) {
				this.dispatch(this.keyAware, 'down', key);
			};

			return Scene;
		}
);
