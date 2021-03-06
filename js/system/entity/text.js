define(['system/lib/entity', 'game/config/fonts'],
		function(Entity, fonts) {
			function TextEntity(pos, text, font, fontSize) {
				Entity.call(this, pos);
				this.text = text;
				this.font = font || fonts.default;
				this.fontSize = fontSize || this.font.size;
				this.textAlign = "center";
			}

			TextEntity.prototype = new Entity();
			TextEntity.prototype.constructor = TextEntity;

			TextEntity.prototype.onDraw = function(ctx) {
				this.font.apply(ctx, this.hover(), this.fontSize * this.scale.x);
				ctx.textAlign = this.textAlign; 
				ctx.fillText(this.text, 0, 0);
			};

			return TextEntity;
		}
);